const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);

let githubWindowId = null;
let organizeTimer = null;
let isOrganizing = false;
let windowIdsByOpenTime = [];

function parseUrl(rawUrl) {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

function isGitHubUrl(rawUrl) {
  const url = parseUrl(rawUrl);
  return Boolean(url && GITHUB_HOSTS.has(url.hostname.toLowerCase()));
}

function prKey(rawUrl) {
  const url = parseUrl(rawUrl);
  if (!url || !GITHUB_HOSTS.has(url.hostname.toLowerCase())) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  const pullIndex = parts.indexOf("pull");
  if (pullIndex !== 2 || parts.length < 4) return null;

  const [owner, repo] = parts;
  const prNumber = parts[3];
  if (!owner || !repo || !/^\d+$/.test(prNumber)) return null;

  return `${url.hostname.toLowerCase()}/${owner.toLowerCase()}/${repo.toLowerCase()}/pull/${prNumber}`;
}

function sortKey(tab) {
  const url = parseUrl(tab.url || tab.pendingUrl || "");
  if (!url) return tab.title || "";

  url.hash = "";
  url.search = "";
  return `${url.hostname.toLowerCase()}${url.pathname.toLowerCase().replace(/\/$/, "")}`;
}

async function allTabs() {
  return chrome.tabs.query({});
}

async function rememberExistingWindows() {
  const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
  const liveWindowIds = new Set(windows.map((window) => window.id).filter((id) => id !== undefined));

  windowIdsByOpenTime = windowIdsByOpenTime.filter((id) => liveWindowIds.has(id));

  const rememberedWindowIds = new Set(windowIdsByOpenTime);
  const unrememberedWindowIds = [...liveWindowIds]
    .filter((id) => !rememberedWindowIds.has(id))
    .sort((a, b) => a - b);

  windowIdsByOpenTime.push(...unrememberedWindowIds);
}

async function nextMostRecentlyOpenedWindowId(excludedWindowId) {
  await rememberExistingWindows();
  return [...windowIdsByOpenTime].reverse().find((windowId) => windowId !== excludedWindowId) ?? null;
}

async function focusTab(tab) {
  if (tab.windowId !== undefined) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
  await chrome.tabs.update(tab.id, { active: true });
}

async function closeDuplicatePrTab(tab) {
  const key = prKey(tab.url || tab.pendingUrl || "");
  if (!key || tab.id === undefined) return false;

  const matches = (await allTabs())
    .filter((candidate) => candidate.id !== tab.id && prKey(candidate.url || candidate.pendingUrl || "") === key)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  if (matches.length === 0) return false;

  await focusTab(matches[0]);
  await chrome.tabs.remove(tab.id);
  return true;
}

async function chooseGitHubWindow(githubTabs) {
  if (githubWindowId !== null) {
    try {
      await chrome.windows.get(githubWindowId);
      return githubWindowId;
    } catch {
      githubWindowId = null;
    }
  }

  const activeGithubTab = githubTabs.find((tab) => tab.active);
  githubWindowId = activeGithubTab?.windowId ?? githubTabs[0]?.windowId ?? null;
  return githubWindowId;
}

async function moveTabsToWindow(tabs, windowId) {
  const tabsToMove = tabs.filter((tab) => tab.windowId !== windowId && tab.id !== undefined);
  for (const tab of tabsToMove) {
    try {
      await chrome.tabs.move(tab.id, { windowId, index: -1 });
    } catch (error) {
      console.warn("Could not move GitHub tab", tab.id, error);
    }
  }
}

async function moveNonGitHubTabsOutOfWindow(windowId) {
  const tabs = await chrome.tabs.query({ windowId });
  const nonGitHubTabs = tabs.filter((tab) => tab.id !== undefined && !isGitHubUrl(tab.url || tab.pendingUrl || ""));

  if (nonGitHubTabs.length === 0) return;

  let destinationWindowId = await nextMostRecentlyOpenedWindowId(windowId);

  for (const tab of nonGitHubTabs) {
    try {
      if (destinationWindowId === null) {
        const newWindow = await chrome.windows.create({ tabId: tab.id });
        destinationWindowId = newWindow.id ?? null;
        if (destinationWindowId !== null && !windowIdsByOpenTime.includes(destinationWindowId)) {
          windowIdsByOpenTime.push(destinationWindowId);
        }
      } else {
        await chrome.tabs.move(tab.id, { windowId: destinationWindowId, index: -1 });
      }
    } catch (error) {
      console.warn("Could not move non-GitHub tab out of GitHub window", tab.id, error);
    }
  }
}

async function sortGitHubTabs(windowId) {
  const tabs = (await chrome.tabs.query({ windowId })).filter((tab) => isGitHubUrl(tab.url || tab.pendingUrl || ""));
  const sortedTabs = [...tabs].sort((a, b) => {
    const byUrl = sortKey(a).localeCompare(sortKey(b));
    if (byUrl !== 0) return byUrl;
    return (a.id ?? 0) - (b.id ?? 0);
  });

  for (let index = 0; index < sortedTabs.length; index += 1) {
    const tab = sortedTabs[index];
    if (tab.id !== undefined && tab.index !== index) {
      try {
        await chrome.tabs.move(tab.id, { index });
      } catch (error) {
        console.warn("Could not sort GitHub tab", tab.id, error);
      }
    }
  }
}

async function organizeGitHubTabs() {
  if (isOrganizing) return;
  isOrganizing = true;

  try {
    const tabs = await allTabs();
    const githubTabs = tabs.filter((tab) => isGitHubUrl(tab.url || tab.pendingUrl || ""));
    if (githubTabs.length === 0) return;

    const targetWindowId = await chooseGitHubWindow(githubTabs);
    if (targetWindowId === null) return;

    await moveTabsToWindow(githubTabs, targetWindowId);
    await moveNonGitHubTabsOutOfWindow(targetWindowId);
    await sortGitHubTabs(targetWindowId);
  } finally {
    isOrganizing = false;
  }
}

function scheduleOrganize() {
  if (organizeTimer !== null) clearTimeout(organizeTimer);
  organizeTimer = setTimeout(() => {
    organizeTimer = null;
    organizeGitHubTabs().catch((error) => console.error("GitHub tab organization failed", error));
  }, 150);
}

async function handlePotentialGitHubTab(tab) {
  const rawUrl = tab.url || tab.pendingUrl || "";
  if (!isGitHubUrl(rawUrl)) return;

  const closedDuplicate = await closeDuplicatePrTab(tab);
  if (!closedDuplicate) scheduleOrganize();
}

chrome.tabs.onCreated.addListener((tab) => {
  handlePotentialGitHubTab(tab).catch((error) => console.error("GitHub tab creation handling failed", error));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    handlePotentialGitHubTab(tab).catch((error) => console.error("GitHub tab update handling failed", error));
  }
});

chrome.tabs.onRemoved.addListener(() => scheduleOrganize());
chrome.tabs.onMoved.addListener(() => scheduleOrganize());
chrome.windows.onCreated.addListener((window) => {
  if (window.id !== undefined && !windowIdsByOpenTime.includes(window.id)) {
    windowIdsByOpenTime.push(window.id);
  }
  scheduleOrganize();
});
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === githubWindowId) githubWindowId = null;
  windowIdsByOpenTime = windowIdsByOpenTime.filter((id) => id !== windowId);
  scheduleOrganize();
});

chrome.runtime.onInstalled.addListener(() => {
  rememberExistingWindows().finally(scheduleOrganize);
});
chrome.runtime.onStartup.addListener(() => {
  rememberExistingWindows().finally(scheduleOrganize);
});
rememberExistingWindows().catch((error) => console.warn("Could not initialize window open order", error));
