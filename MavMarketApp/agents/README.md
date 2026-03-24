# Mav Market Agents

This directory is the execution surface for the Mav Market build system.

Use these files in this order:
- `manifest.json` is the canonical registry.
- `orchestrator.md` defines sequencing, handoffs, and acceptance gates.
- `contracts.md` defines cross-agent interfaces that must stay stable.
- `runbooks/phase-1.md` is the initial execution order.
- `specs/*.md` contains one decision-complete brief per agent.
- `tools/*.mjs` provides lightweight local inspection and validation.

Conventions:
- Each agent owns a bounded scope and must not edit outside it without an orchestrator-approved handoff.
- Shared types, data access contracts, and security invariants must follow `contracts.md`.
- Payments are architecture-only in phase 1. No active checkout or payout flow ships in the first build wave.

Suggested local commands:

```bash
node agents/tools/list-agents.mjs
node agents/tools/validate-manifest.mjs
```
