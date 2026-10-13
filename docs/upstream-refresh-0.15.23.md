# Upstream pstack 0.15.23 refresh

## Source

The previous pin was `4e5b1cf2ccb0ea3716f08c8ee0a5856b5ab93536` (0.15.10).
The reviewed pin is `dbf49813a39c1a5389c5e28cb8e4c1c2379e2454` (0.15.23),
fetched directly from `https://github.com/cursor/plugins.git`. Both upstream
manifests declare 0.15.23 at this commit. The last standalone version-bump
commit is titled 0.15.22, but the subsequent goal-restatement change bumps the
manifests again. The portable package is `0.15.23-pi.1`.

The ignored sparse checkout remains `vendor/cursor-plugins/pstack/`. The delta
has 26 pstack commits and changes 81 files, including 65 managed skill files.
There are two new skills and no removed skills. All 53 upstream skills remain
represented, alongside three Benny skills and two local runtime adapters.
Vendor content and dependencies remain excluded from the package.

## Merge decisions

| Area | Imported | Pi adaptation retained |
| --- | --- | --- |
| `ketchup` | Read-only catch-up since the user's last message, fewer than 250 words, factual visuals and pending operator decisions. | Explicit `/skill:ketchup`; available visual tooling instead of an absent `/visualize` command. Save SVG or HTML outside the repository when inline rendering is unavailable. Never start an app or invent a screenshot for catch-up. |
| `in-your-own-words` | Restate the user's goals and the problem before work. | Explicit `/skill:in-your-own-words`. |
| Help | Explicit-only invocation, once-per-chat setup offer, prompting references and recipes, new skill entries. | This fork's installation URL, `/skill:name`, project policy, doctor checks, and no native `/loop` claims. Missing policy blocks delegation rather than selecting vendor defaults. |
| Mode and delegate | The receiving chat owns the playbook. Delegate briefs carry the installed mode file's absolute path. Leaf skills resolve relative to it. | Existing private profiles, explicit models, fresh sessions, no nested delegation, and route validation. Do not search Cursor plugin directories or guess a user skill root. |
| Verification skill | Readiness requires a usable app from an empty data directory, including migrations and seed data. Missing journey prerequisites fail rather than weaken the test. Stand-in setup steps remain unverified on the real target. | Project-local output paths, isolated PTYs, owned cleanup, and surviving evidence. |
| How, why, interrogate, reflect | Leaner workflows and prompts, shortened confidence/source guidance, review prose, and synthesis wording. | Configured model and execution roles, live capability discovery, optional authenticated remote history, read-only evidence, route acceptance, and user approval for reflected edits. Keep explicit explorer tracing where it provides source-verification guidance. |
| Arena and architect | Arena output includes the base reason, cross-judge verdict, rejected grafts and convergence. Architect grounding asks for how's architectural explanation. | Managed writer worktrees, frozen candidates before judgment, two distinct designs, and root verification. |
| Principles and writing | Portable prose reductions and the cheap always-on debugging signal proposal. Remove the non-renewable-context claim and blanket inline-reference rule. | Capability-aware payload isolation, deterministic levers, and runtime contracts. |
| Playbooks | Trace-forensics prose, commit-body guidance, and configurable worktree bases. | Root-owned PR opening and merges, watcher authorization limits, Babysit reply requirements, and explicit file/lock/activity gates before cleanup. |

### Script fixes

- The plan checker recognizes backtick and tilde fences, indentation, matching
  characters and minimum closing lengths. Its new tests retain Pi's durable
  goal and hourly-audit markers rather than requiring Cursor `/loop 1h`.
- The PR watcher fetches every review-thread page before counting automation
  passes or filtering resolved threads. The 101st thread now blocks readiness
  even when CI passes. Preserve `isAutomatedReview`, `reviewPasses`, and
  generalized automation markers rather than restoring Bugbot-only fields.
- Add fail-closed validation for missing/empty next-page cursors and repeated
  cursor cycles. Both regressions failed before the fix. A partial review must
  not be treated as complete, and a pagination cycle must not loop forever.
- Worktree audit accepts `-b` or `--base`. Without it, use `origin/HEAD`, then
  `origin/main`, then `origin/master`. Fetch explicit origin bases with a
  refspec, including bases absent from a single-branch clone, and print the
  selected base. Preserve paths containing spaces, locks, dirty/error holds,
  scratch cleanup, and the absence of private transcript scans.
- A new real-Git fixture exposed a pre-existing macOS awk parsing error that
  silently hid locks. Parenthesize the conditional print so locked worktrees
  remain held. The audit does not delete worktrees; buckets are still advice,
  not deletion permission.

## Deliberate differences

Upstream replaces its default three-model panels with two models, changes
judgment defaults to xhigh, and makes `unlimited` target max. Do not import
that policy into Pi. This fork already defines `unlimited` as preserving
current efforts in both setup and the runtime contract. Keep confirmed model
families, efforts, aliases, and panel membership. New Pi setup still asks for
choices from the live inventory. No user configuration or host settings were
changed. Sync normalization and forbidden-binding checks recognize the new
Cursor xhigh slug so future imports cannot leak it into portable workflows.

Keep explicit principle IDs and playbook paths rather than importing the
shorter kebab-case derivation rules. Keep portable no-comments routing, already
using `comment-sicko`, and workflow safeguards that upstream merely removes as
redundant prose. Do not import Cursor plugin manifests, guide pages, keybindings,
MCP-mode assumptions, provider fallback, or omitted-model inheritance. Pi's
package manifest and runtime adapter own those integrations. The router's
TypeScript implementation is unchanged.

Protect the new Pi-adapted skills and help references in `upstream.lock.json`.
The normal updater still refuses protected changes; no bypass was added. The
pin advances only after reviewing the delta and merging adapted files.

## Review and verification

Two read-only review lanes independently inspected the protected workflows and
mode/scripts. The root made all changes and ran artifact verification. Review
runs were `f3567dbb-2fec-42e8-83d5-6965213b7505` and
`dc4a9afd-baff-4a9f-b82a-c2449ae3ff1f`; neither edited files.

```bash
git -C vendor/cursor-plugins log --oneline 4e5b1cf..dbf4981 -- pstack
node scripts/sync-upstream.mjs --check --source vendor/cursor-plugins
env -u PSTACK_CONFIG npm run verify
(cd skills/poteto-mode/scripts && bun test orch watch-pr check-plan.test.ts)
(cd skills/poteto-mode/scripts && bunx tsc --project watch-pr/tsconfig.json --noEmit --strict)
npm run test:pi
npm pack --dry-run --json
git diff --check
```

Results:

- Managed files match the new immutable source pin.
- 78 Node tests pass, including disposable local-Git worktree fixtures, with
  extension TypeScript checking.
- 66 Bun tests pass, including fences, pagination, cross-page pass counts,
  cursor failures, and the 101st-thread readiness regression. Strict watcher
  TypeScript checking passes.
- Pi registers all four routing tools and both commands without model calls.
- Package preview includes both new skills and no vendor or node_modules files.
- Diff whitespace checking passes.

These checks prove package artifacts and local script behavior, not execution
of every agent workflow or live GitHub responses. The worktree tests use only
local remotes and a disabled `gh` fixture; no actual worktrees or PRs were deleted
or changed. The session's `$PSTACK_CONFIG` is unset only for mocked test runs.
