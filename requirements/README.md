# Requirements

This directory contains formal project requirements. Requirement statements use
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) keywords so agents and
maintainers can distinguish hard obligations from recommendations.

## File Format

Requirement files use this naming pattern:

```text
REQ-NNN-<topic>.md
```

Each file should contain:

```markdown
# REQ-NNN: Title

## Overview

Context for this requirement group.

## Requirements

### REQ-NNN.1: Requirement Title

The system MUST describe a verifiable obligation.
```

## Validation Mechanisms

Choose the narrowest validation mechanism that fits the requirement:

- **Automated tests** for deterministic runtime behavior, exact generated data,
  validation outcomes, or command behavior.
- **DeepSchemas** for structural and semantic file-level contracts.
- **DeepReview rules** for judgment-based policies that require reviewer
  interpretation.
- **Direct reviewer judgment** only when automation is not practical.

## Test Traceability

Tests that validate a formal requirement MUST include this two-line comment
immediately before the relevant test or test group:

```ts
// THIS TEST VALIDATES A HARD REQUIREMENT (REQ-001.1).
// YOU MUST NOT MODIFY THIS TEST UNLESS THE REQUIREMENT CHANGES.
it("validates durable behavior", () => {
  // ...
});
```

Do not attach traceability comments to incidental utility tests that do not
validate a formal requirement.
