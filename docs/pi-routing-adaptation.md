# Pi routing on the refreshed pstack branch

This change adapts [upstream PR #1](https://github.com/shrimpwtf/oh-my-pstack/pull/1)
at `f2b3ee59ff6925a336bee24612b7338f17090a09`. The original router, tests, and
policy separation are Gabriel Aguiar's work; this branch integrates them with
the existing 0.15.2 portability refresh.

## Branch separation

`feat/pi-deterministic-routing` starts at `2255573` on
`feat/upstream-pstack-refresh`. The refresh branch remains unchanged. No merge
commit or upstream PR is required for local use.

Review only this adaptation with:

```bash
git diff feat/upstream-pstack-refresh...feat/pi-deterministic-routing
```

A PR from this branch directly to upstream main would also include the refresh
until that refresh lands. Keep the existing refresh PR unchanged. For a later
Pi-only PR, rebase these adaptation commits onto upstream main after the refresh
lands, or use the refresh branch as the review base in a fork.

## Differences from PR #1

- Keep package version `0.15.2-pi.1`, upstream pin
  `6ed0f7a9504f577d7529064103cecce9be7dfc5e`, Benny source roots, make-bot-ui,
  forge-neutral playbooks, and the newer how/why workflow structure.
- Do not reinstate how's removed critique phase. The parser accepts an old
  `how critics` policy line for compatibility, but setup and doctor do not
  require it.
- Preserve reasoning-budget selection. Accept the refresh's grouped and
  per-panel reasoning entries; reject conflicts, missing models, unequal
  lengths, and attempts to override inherited parent thinking.
- Require separate managed worktrees for writer/researcher panels. Forward
  `fast: false` explicitly so host defaults cannot silently activate priority
  service. Let pi-subagents own the supported OpenAI-Codex fast-model list.
- Split web evidence and MCP evidence profiles. A normal researcher does not
  require an MCP adapter; an MCP-backed task explicitly requests `mcp: true`.
  Local Git-only investigation uses the read profile. Missing requested tools
  still fail closed.
- Reconcile missed completion events through public structured RPC status after
  reload/resume. Clean up listeners on shutdown. Reject incomplete child
  evidence, extra children, and follow-ups to an already-continued owner.
  Correlate panel results by stable child keys, not delivery order.
- Preserve dirty-source and protected-prefix sync checks. Read immutable Git
  snapshots, advance safe no-change pins, detect managed-file drift, and delete
  only files proven to have belonged to the old upstream snapshot. Never delete
  local-only skills merely because upstream lacks them.
- Do not import PR #1's separate create-skill workflow or unrelated older prose.

## Local activation

The branch is not automatically installed into Pi. Register the whole package,
not only its Markdown skills:

```bash
pi install /absolute/path/to/oh-my-pstack
```

Back up and relocate older copied pstack skills outside discovery directories
before using the package, so duplicate names cannot select stale content. Keep
unrelated personal skills. Local-path installs follow the checkout's active
branch; use a dedicated checkout if that is undesirable.

Restart Pi, run `/subagents-doctor`, invoke `setup-pstack` in the target project,
and run `/pstack-doctor`. Existing host agent overrides remain user-owned and
are not rewritten. Web evidence requires pi-web-access; MCP evidence requires
a loaded MCP adapter. Read-only shell/MCP contracts are not OS sandboxes.

The router does not grant delegation authority. Host authorization, concurrency,
worktree, capability, and acceptance policies still apply.

## Verification

Executed on the adapted checkout:

- `npm run verify`: skill/manifests checks, 68 Node tests, strict router TypeScript.
- `npm run test:pi`: a real Pi process registers all four tools and both commands,
  using an isolated temporary config and no model calls or child launches.
- `npm run sync:check -- --source <clean pinned upstream checkout>`: pin and
  normalized unprotected files match.
- `bun test --cwd skills/poteto-mode/scripts orch watch-pr`: 52 tests pass.
- `bunx tsc --project skills/poteto-mode/scripts/watch-pr/tsconfig.json --noEmit --strict`.
- `npm pack --dry-run`: extension and five agents included; no node_modules payload.
- `git diff --check`.

The router tests simulate the public pi-subagents RPC and execute generated
scripts against recording runners. They prove payload, isolation, policy, and
ledger behavior, not provider authentication, real multi-model generation,
worktree execution, or live retained-owner continuation. Those live acceptance
checks still need an installed package and explicitly authorized model runs.
