# Upstream pstack 0.15.10 refresh

## Source and scope

The old baseline was `6ed0f7a9504f577d7529064103cecce9be7dfc5e` (0.15.2).
The reviewed new baseline is `4e5b1cf2ccb0ea3716f08c8ee0a5856b5ab93536`
(0.15.10). The portable package is `0.15.10-pi.1`.

The authoritative source is a sparse Git checkout at
`vendor/cursor-plugins/pstack/`. The nested clone is ignored rather than added
as an accidental gitlink. `vendor/README.md` records how to recreate it.
Neither vendor content nor its Git history ships in the npm package.

Nine commits affect pstack in this interval. The delta spans 56 files with
459 insertions and 209 deletions. There are four new skills and no removed
skills. All 51 upstream skills remain represented, alongside the three Benny
skills and the local runtime/orchestration adapters.

## Analysis and merge decisions

| Commit | Upstream change | Pi adaptation |
|---|---|---|
| `70b2dc8`, `b42effe` | Opus 5.5 and Grok 4.7 defaults, shorter panels, revised upgrade help | New setup templates offer three panel seats. Existing confirmed families, efforts, and panel membership stay unchanged. No Cursor-only model IDs are prescribed. Sync normalization and forbidden-binding checks cover the two new defaults. |
| `b0b9c7a` | Remove redundant instructions across principles, review, writing, and TDD | Import portable prose reductions. Keep parent artifact verification and review separation where the Pi adapter owns those contracts. Remove the contradictory prohibition on pausing with a broken tree; the next pause step explicitly supports a durable broken-tree checkpoint. |
| `12d587d` | Consistent model-rule reads and runtime fallback; resolve workflow conflicts | Keep exact role reads, but reject fallback and omitted model fields. Pi resolves inheritance explicitly and fails closed for unavailable or missing models. Setup drops retired role lines and their effort entries only in the proposed, user-confirmed policy. Autopilot authorization can start root-controlled Babysit after code-ready. Watchers still cannot rebase, delegate, or merge. |
| `23e4138` | Explain-the-number, benchmark checklist, fresh subagents, hourly ticks, PR headings, schema-first casts | Add both measurement skills and their triggers. Wire baseline and harness vetting into Perf issue and Hillclimb. Fresh owner rounds carry consolidated briefs; retained sessions remain only for costly live state. Port hourly audit intent without inventing a native Pi scheduler. Import PR headings, scope requirements, built-in PR-tool precedence when present, and schema-first examples. |
| `9511e60` | Correct skill | Add architecture-first enforcement of repeated mistakes, with project-scoped evidence and the portable runtime contract. Protect its history/authority adaptation from automatic overwrite. |
| `a586282` | Designs that resist agent mistakes | Import single state ownership, one supported path, unreachable internals, and derived lists into architecture screening. |
| `e43c7ee` | Ordered performance mantras | Replace the eight strategy families with the seven ordered mantras. Hillclimb borrows their order but keeps its own stop predicate. |
| `4e5b1cf` | Poteto help | Add a portable help map using `/skill:name`, package install, doctor checks, project policy, and the actual lifecycle contract. Replace Cursor Custom Modes, plugin commands, guide links, and default-model assumptions. |

## Lifecycle and verification changes

Autopilot starts verification at code-ready, then at every patch-changing push.
Self-proof, CI, and Babysit can run alongside the frozen-SHA swarm. At least two
focused audit lanes accompany gates and the live-runtime floor. Every proven
defect, including one filed as a note, returns in one fix-forward and is added
to the next round's review brief.

Fix rounds retain their merge base until merge prep, a trunk conflict, or a
trunk-caused CI failure. Merge prep records a new head and requires CI on it.
Before root-owned landing, check trunk overlap, CI-selection paths, and merge-tree
conflicts. Stack topology and all merges stay at the root, not in an owner child.

Shipping can preserve a lane after a tests/docs/lint-only patch change only when
its built output is equivalent after explicitly accounting for repeated-build
noise and embedded commit IDs. Dev-server lanes and lanes without build outputs
must rerun. Checks and change review always run fresh.

Swarm verification briefs name exact SHAs. Measurement briefs also name sample
count, sample definition, and order. Reject results missing that evidence and
retry once; a second miss is a gap, not a pass.

Native Pi completion notifications collect child results without poll/sleep
loops. Hourly audit wakes require an installed scheduler. Without one, record
the gap and checkpoint. Every tick is logged, but chat reports only changes not
already reported. Child IDs, expected runtimes, states, branches, and generations
are root-tracked. A replacement writer cannot take the scope before the old
writer is stopped and its worktree reconciled.

Decision logs mark run boundaries with `start` rows, audit only that run's
stretches, and correct mistakes by appending superseding rows. The logger now
initializes empty files and appends headers rather than risking truncation.

## Deliberately not imported

- Cursor model slugs, provider-family fallback, and omission-based inheritance.
- Cursor `/goal`, `/loop 1h`, cloud-sleeper chains, and Custom Mode keybindings.
- Nested owner delegation or child-owned merges.
- Claims that rules automatically apply only in new chats. Pi launch tools read
  current policy; retained owners preserve their original validated route.
- Cursor installation/guide pages and its plugin manifest. The portable README,
  help skill, Pi adapter, and host manifests own those topics.

No TypeScript router behavior changed. The existing launch, status, and retained
owner tools already support the ported workflow choices. Freshness and scheduler
selection are workflow policy, not new claims of runtime enforcement. No user's
model configuration or host settings were changed.

## Reproduce and verify

```bash
git -C vendor/cursor-plugins log --oneline 6ed0f7a..4e5b1cf -- pstack
git -C vendor/cursor-plugins diff --stat 6ed0f7a 4e5b1cf -- pstack
node scripts/sync-upstream.mjs --check --source vendor/cursor-plugins
env -u PSTACK_CONFIG npm run verify
bun install --cwd skills/poteto-mode/scripts --frozen-lockfile
(cd skills/poteto-mode/scripts && bun test orch watch-pr)
(cd skills/poteto-mode/scripts && bunx tsc --project watch-pr/tsconfig.json --noEmit --strict)
npm pack --dry-run --json
git diff --check
```

Results from this refresh:

- Sync check matches the new pin and every unprotected managed file.
- Verification passes 72 Node tests plus extension TypeScript checking.
- Bundled Bun scripts pass 52 tests and strict watch-pr TypeScript checking.
- Package preview has 167 files and no vendor or node_modules content.
- The new plan CLI tests accept a concrete configured model and hourly cadence,
  and reject unfilled placeholders and the old cadence.
- Logger tests exercise empty-file initialization, append preservation, and TSV
  formula/cell escaping.

The first test run inherited this session's `$PSTACK_CONFIG`, which selected
real user models outside the mocked inventory. Those fixture tests failed.
Unsetting only that variable for verification passed; no user policy was edited.
These checks prove package artifacts and script behavior, not live execution of
every workflow or an unattended hourly scheduler.
