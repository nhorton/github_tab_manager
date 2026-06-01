# REQ-002: GitHub Tab Management

## Overview

This file defines functional requirements for the Chrome extension that improves GitHub tab workflows.

## Requirements

### REQ-002.1: Chrome Extension Packaging

The project MUST provide a Chrome extension manifest and executable extension scripts so it can be loaded by Chrome as an unpacked extension.

### REQ-002.2: Unified GitHub Window

The extension MUST keep all `github.com` tabs in a single Chrome window when Chrome tab permissions allow tab movement.

### REQ-002.3: Alphabetical GitHub Tab Ordering

The extension MUST sort GitHub tabs alphabetically by normalized GitHub URL so tabs are effectively grouped by organization, repository, and pull request number.

### REQ-002.4: Pull Request De-duplication

When a GitHub pull request URL is opened while another tab for the same owner, repository, and pull request number is already open, the extension MUST switch to the existing tab instead of leaving the duplicate tab open, regardless of which pull request subpage was opened.

### REQ-002.5: GitHub Window Exclusivity

The extension MUST move non-GitHub tabs out of the GitHub window and into the next-most-recently-opened Chrome window when another window is available.

### REQ-002.6: Pull Request State Title Prefixes

The extension MUST prefix tab titles for merged pull requests with a purple circle and closed pull requests with a red circle.
