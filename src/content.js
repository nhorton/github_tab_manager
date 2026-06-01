const CLOSED_PREFIX = "🔴 ";
const MERGED_PREFIX = "🟣 ";
const KNOWN_PREFIXES = [CLOSED_PREFIX, MERGED_PREFIX];

let lastAppliedTitle = "";

function isPullRequestPage() {
  return /^\/[^/]+\/[^/]+\/pull\/\d+(?:\/|$)/.test(window.location.pathname);
}

function titleWithoutStatusPrefix(title) {
  let nextTitle = title;
  for (const prefix of KNOWN_PREFIXES) {
    if (nextTitle.startsWith(prefix)) {
      nextTitle = nextTitle.slice(prefix.length);
    }
  }
  return nextTitle;
}

function visibleText(element) {
  return (element?.textContent || "").trim().toLowerCase();
}

function detectPrState() {
  if (!isPullRequestPage()) return "open";

  const stateCandidates = [
    ...document.querySelectorAll("[class*='State'], [data-testid*='state'], [aria-label*='State'], [aria-label*='state']"),
  ];

  for (const element of stateCandidates) {
    const text = visibleText(element);
    const className = String(element.className || "").toLowerCase();
    const ariaLabel = String(element.getAttribute("aria-label") || "").toLowerCase();
    const combined = `${text} ${className} ${ariaLabel}`;

    if (/\bmerged\b/.test(combined)) return "merged";
    if (/\bclosed\b/.test(combined)) return "closed";
  }

  return "open";
}

function desiredPrefixForState(state) {
  if (state === "merged") return MERGED_PREFIX;
  if (state === "closed") return CLOSED_PREFIX;
  return "";
}

function applyTitlePrefix() {
  const baseTitle = titleWithoutStatusPrefix(document.title);
  const prefix = desiredPrefixForState(detectPrState());
  const desiredTitle = `${prefix}${baseTitle}`;

  if (document.title !== desiredTitle) {
    lastAppliedTitle = desiredTitle;
    document.title = desiredTitle;
  }
}

function scheduleTitleUpdate() {
  window.requestAnimationFrame(() => {
    if (document.title !== lastAppliedTitle || isPullRequestPage()) {
      applyTitlePrefix();
    }
  });
}

applyTitlePrefix();

const observer = new MutationObserver(scheduleTitleUpdate);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
});

window.addEventListener("popstate", scheduleTitleUpdate);
window.addEventListener("hashchange", scheduleTitleUpdate);
setInterval(applyTitlePrefix, 2000);
