# oh-my-pstack

<img src="assets/logo.png" alt="pstack logo" width="128">

**This is [lorenzk's fork](https://github.com/lorenzk/oh-my-pstack) of
[shrimpwtf/oh-my-pstack](https://github.com/shrimpwtf/oh-my-pstack), which is a
portable adaptation of Lauren Tan's original
[Cursor pstack](https://github.com/cursor/plugins/tree/main/pstack).**

**This fork is optimized for working with Pi, not other agent hosts.**
Other-host support is inherited from upstream and is not this fork's focus.

For the general workflow overview, see
[the upstream README](https://github.com/shrimpwtf/oh-my-pstack#readme).
This README focuses on what has changed in this fork.

## Changes compared with shrimpwtf/oh-my-pstack

- **Refreshed pstack to 0.15.10**, via 0.15.2, while preserving portable-host
  adaptations. Includes the revised how/why workflows, `poteto-help`, `correct`,
  `make-bot-ui`, benchmark guidance, and updated playbooks and principles.
- **Integrated and extended deterministic Pi routing from
  [upstream PR #1](https://github.com/shrimpwtf/oh-my-pstack/pull/1)**
  (Gabriel Aguiar's work). The router resolves configured model roles, launches
  through `pi-subagents`, and records requested versus observed routes in a
  validated session ledger. Adds `pstack_launch`, `pstack_panel`,
  `pstack_followup`, `pstack_status`, `/pstack-doctor`, and `/pstack-routes`.
- **Tightened Pi execution and setup:** separate read, web-evidence, and
  MCP-evidence profiles; explicit MCP opt-in; isolated writer/researcher panels;
  reasoning-budget preservation; explicit fast-mode handling; completion
  reconciliation after reload/resume; and corrected structured RPC calls.
  Clarified sibling-skill path resolution on Pi.
- **Hardened upstream syncing:** protect all adapted paths, reject dirty sources
  and managed-file drift, read immutable Git snapshots, and avoid deleting
  local-only skills. Preserve these safeguards when integrating upstream fixes.
- **Expanded verification** with routing, extension, portability, refresh, and
  sync regression tests, strict TypeScript checks, and a Pi registration probe.

Details: [Pi routing adaptation](docs/pi-routing-adaptation.md),
[0.15.2 refresh](docs/upstream-refresh-2026-09.md), and
[0.15.10 refresh](docs/upstream-refresh-0.15.10.md).

## Install this fork on Pi

```bash
pi install https://github.com/lorenzk/oh-my-pstack
pi install npm:pi-subagents
```

Requires `pi-subagents` 0.57.0 or later. Restart Pi, run `/subagents-doctor`,
configure your project with `setup-pstack`, then run `/pstack-doctor`.
Install the whole package, not just copied skill files; older duplicate skills
can shadow it. Web research also requires `pi-web-access`; MCP-backed work
requires a loaded MCP adapter.

For a local checkout:

```bash
pi install /absolute/path/to/oh-my-pstack
```

## Development

```bash
npm install
npm test
npm run verify
npm run typecheck
npm run test:sync
```

The original Cursor repository remains the content authority, pinned in
`upstream.lock.json`. Protected adaptations require a human merge decision;
the updater never silently overwrites them.

## License and attribution

MIT. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
Credit to Lauren Tan for the original pstack, shrimpwtf for the portable
adaptation, and Gabriel Aguiar for the deterministic Pi router integrated here.
