# REQ-001: Project Governance

## Overview

This file defines baseline requirements for maintaining durable project
requirements and traceability policies.

## Requirements

### REQ-001.1: Stable Requirement Documents

Requirement documents MUST use stable IDs, RFC 2119 language, and verifiable
statements so future implementation work can trace back to durable obligations.

### REQ-001.2: Validation Mechanism Selection

Each requirement SHOULD identify or imply an appropriate validation mechanism,
such as an automated test, DeepSchema, DeepReview rule, or direct reviewer
judgment.

### REQ-001.3: Test Traceability Comments

Tests that validate formal requirements MUST include durable traceability
comments identifying the requirement ID and warning maintainers not to modify the
test unless the requirement changes.
