# Upstream pstack 0.15.36 refresh

## Source and approval

The previous pin was `dbf49813a39c1a5389c5e28cb8e4c1c2379e2454`
(0.15.23). The new pin is
`b1695c2019b650ca5d4a66a6a6d805233c806d6d`, fetched directly from
`https://github.com/cursor/plugins.git`. Both pstack manifests declare 0.15.36.
The delta contains 48 pstack commits and changes 487 pstack files, including
upstream documentation and the new statechart compiler's source and fixtures.
This package is `0.15.36-pi.1`.

The operator selected Cursor as the content source and explicitly approved
adopting and adapting the major protected workflow changes. The automatic
updater first refused those changes without writing. This refresh manually
reviewed the protected delta, imported normalized unprotected files from the
immutable snapshot, and advanced the pin after adapting the workflows. The
updater's protection checks were not bypassed or weakened.

There are five new skills and no removed skills. All 58 upstream pstack skills
are represented, alongside three Benny skills and two local runtime adapters,
for 63 skill directories. Cursor guide pages, manifests, generated Claude Code
adapters, and unrelated repository plugins are not imported as Pi resources.

## Merge decisions

| Area | Imported | Pi adaptation |
| --- | --- | --- |
| Interrogate | Executable adversarial findings, parent reruns, root-cause deduplication, and Findings / Dropped output. Delete the four retired review references. | Keep `interrogate reviewers` as the model role. Use `implementer` execution with `worktree: true` because adversaries write repros. Freeze and explicitly seed scoped staged, unstaged, and untracked changes in each worktree. Product fixes, external mutations, nested delegation, commits, and pushes are forbidden. Require `pstack_status` and parent reruns; missing runs remain coverage gaps. |
| Orchestrate | Replace the bookkeeping CLI with tool-driven supervision, durable state, one PR owner, a pilot, bounded retries, and live PR checks. Remove `scripts/orch` and its test command. | Root starts all children, owns approvals and authorized merges, and uses configured routes. Owners alone write their branches and never merge. Sub-coordinators return briefs rather than spawning. Do not assume cloud VMs, Project APIs, event subscriptions, or schedulers. Stop and reconcile old writers before replacement. Graphite is no longer required. |
| Autopilots | Full swarm at code-ready, repeat swarms for major changes, a single verifier for minor fixes and rebases, proof-based blocking, tested merge-result drift checks, and catch-up on changed audits. Autopilot-stack stacks only genuinely dependent PRs. | Preserve root-owned landing, explicit go, operator items, zero-writes holds, isolated fresh owner rounds, route validation, patch-id checks, and honest scheduler gaps. A missing required lane is never a pass. Autopilot-stack never merges or arms auto-merge and freezes pushes after handoff. Align Babysit, PR opening, Shipping, mode routing, and plan guidance. |
| Arena | One cross-family judge from the configured pool, in preference order, with a disclosed skip when none is eligible. | Inherited aliases cannot judge their parent. No vendor defaults, invented model IDs, or silent fallbacks. Missing or invalid policy still stops dispatch. Keep configured efforts and fast mode unchanged. |
| Ketchup | Plain-language catch-up, evidence-based visuals, every waiting item listed with enough context to decide, and no word limit that drops items. | Use `/skill:ketchup`, available visualization tools, and artifacts outside the repository. Do not assume inline Mermaid, SVG, or video support. Never invent screenshots or start the app to make a catch-up. |
| Ketchup-video | Short, subtitled evidence-based slides, measured holds, and frame inspection. | Require available rendering and inspection tools. Link a verified file when inline playback is unavailable; report a capability gap and give calls as text when rendering cannot run. |
| Formal verification | Create and maintain project-local checks, mutation proof, explicit bounds and assumptions, sync commits, drift versus bug outcomes, and statechart follow-up. Setup offers formal verification once when missing. | Write to the target project's supported skill root, not the installed package. Tool installation follows permissions. Do not fix product code or weaken properties to turn failures into passes. |
| Statechart | The full TLA+ compiler, runtime-selecting launcher, plain-text and Mermaid backends, graph passes, CLI, recorded corpus, fuzzing, and renderer tests. | Resolve the real installed skill path. Report missing Java, TLC, mise, network, or rendering capabilities. Keep artifacts and renderer dependencies outside the repository. Preserve executable modes on the launcher and Java replay fixture. |
| Sharpen | Original prompt deepening and rewrite skill. | Imported unchanged; no new model role or host integration. |
| Reflect | Do not edit managed plugin caches; show the destination before approval and edit a user-owned copy. | Preserve explicit approval and confirmed project/user skill roots. A specifically requested maintained source checkout can be edited directly. Never push or open a PR during Reflect. |
| Principles and TypeScript | More precise reasoning about premises, legitimate exceptional states, observable behavior, restart-safe operations, measurement decisions, and branded type guards. Import upstream prose cuts. | Keep existing portable runtime and routing contracts. |

Upstream's automatic effort increases/decreases, urgency-based fast-mode changes,
and fallback model selection are deliberately not imported. The many leaf
changes that only add those instructions therefore leave the Pi workflows
unchanged. No user configuration, host defaults, credentials, model families,
panel membership, efforts, or fast-mode choices were changed. The router's
TypeScript implementation is unchanged.

Shipping retains the fork's safer one-frontier-at-a-time watcher behavior and
explicit confirmation that each merged PR targeted trunk. It does not import
upstream's assumption that watching the full queue proves every PR has landed.

## Script and packaging fixes

- Import watcher deadline-capped sleeps for single, queued, and retry paths.
- Distinguish fork heads during stack discovery to avoid false parents and
  cycles. Fetch and validate `isCrossRepository` from GitHub.
- Classify an owner-approval `ACTION_REQUIRED` Code Review Gate consistently
  on both check-read paths. Ordinary `ACTION_REQUIRED` checks still fail.
- Preserve generalized automated-review detection, review-pass counts,
  pagination, and the existing fail-closed cursor guards.
- Import matching multi-backtick inline code handling in the plan checker,
  preserving the fork's configured-model and durable hourly-audit contracts.
- Normalize Origin and GitHub PR states in the worktree audit, falling back to
  GitHub when Origin fails or gives an invalid list. Prefer active PRs over
  old branch history. Add real-Git regressions for draft/open PR holds and
  fallback. Preserve spaced paths, worktree locks, dirty/error holds, and
  scratch cleanup. Upstream's GNU transcript timestamp fix is not applicable:
  this fork deliberately does not scan private transcripts.
- Fix a macOS symlink test fixture by resolving the temporary directory's real
  path before computing its relative link. `/var` can point to `/private/var`;
  the old fixture built a dangling relative link. The product launcher is
  unchanged.
- Make the compiler exit classifier's `0 | 1 | 2` return type explicit so
  TypeScript preserves it in result objects. Make async signal-test callbacks
  return `Promise<void>` rather than a fixture. These type-only corrections
  fix upstream errors found by strict checking against the checkout's Node
  types; runtime semantics are unchanged. CI checks the compiler strictly too.
- Exclude nested `node_modules` explicitly from the package's files list. A
  package preview after installing statechart's dev dependencies exposed that
  the broad `skills` entry otherwise shipped them. Test the actual pack list,
  new skills, and executable modes. Keep compiler source and recorded fixtures.
- CI now runs the bundled watcher/plan command without the retired orch suite
  and adds statechart tests. Statechart's optional live tests require an
  explicitly supplied Java executable and TLC jar.

Protect the adapted new skill files, compiler type correction, and CLI fixtures in
`upstream.lock.json`. The retired rubric path remains protected as a tombstone
so future updates cannot silently restore that adapted contract.

## Verification

```sh
npm run verify
node scripts/sync-upstream.mjs --check --source vendor/cursor-plugins
bun install --cwd skills/poteto-mode/scripts --frozen-lockfile
bun run --cwd skills/poteto-mode/scripts test
./node_modules/.bin/tsc --project skills/poteto-mode/scripts/watch-pr/tsconfig.json --noEmit --strict
npm install --prefix skills/statechart/scripts --ignore-scripts --no-package-lock
npm run test:statechart
npm run typecheck:statechart
npm run test:pi
npm pack --dry-run --json --ignore-scripts
git diff --check
```

Results:

- 63 skill directories and their Markdown references validate.
- 94 Node tests pass, including routing, sync, refresh, package-list, and
  disposable local-Git audit regressions. Extension TypeScript checking passes.
- 64 Bun watcher and plan-checker tests pass. Strict watcher TypeScript checking
  passes. Cursor failure and pagination regressions remain covered.
- Statechart has 267 passing tests and 67 explicitly skipped live-TLC tests.
  Compiler behavior, recorded TLC outputs, process cleanup, launcher paths,
  fuzzing, Mermaid parsing, and Pele rendering pass. Strict compiler TypeScript
  checking passes. Java and a TLC jar were
  unavailable locally, so no live model-checking claim is made. Tests install
  pinned renderer dependencies in an external user cache.
- Pi registers all four tools and both commands without model calls.
- Unprotected managed files match the pinned immutable snapshot. The package
  preview includes the new skills, excludes vendor and nested dependency trees,
  and retains executable launchers.

These checks validate package artifacts and local scripts, not every agent
workflow, remote GitHub responses, video production, or unattended supervision.
No real PRs, user worktrees, or external services were mutated.
