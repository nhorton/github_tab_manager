# GitHub Tab Manager

A Chrome extension that makes GitHub-heavy workflows easier by keeping GitHub tabs in one place.

## Features

- Keeps every `github.com` tab in one Chrome window.
- Moves non-GitHub tabs out of the GitHub window and into the next-most-recently-opened window.
- Sorts GitHub tabs alphabetically by URL, which naturally groups by organization, repository, and pull request number.
- Prevents duplicate pull request tabs: opening another page for an already-open PR switches to the existing PR tab instead.
- Prefixes merged PR tab titles with `🟣` and closed PR tab titles with `🔴`.

## Install locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this project directory.

## Files

- `manifest.json` declares the MV3 Chrome extension.
- `src/background.js` manages windows, tab sorting, and PR de-duplication.
- `src/content.js` detects PR state on GitHub pages and prefixes tab titles.
