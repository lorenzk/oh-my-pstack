---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Adversaries try to break a change or design, and only findings proven by a run survive."
disable-model-invocation: true
---

# Interrogate

Follow the [portable runtime contract](../pstack-pi/references/runtime.md) for model roles, isolated writer panels, and result acceptance.

Adversaries try to break a change or a design. A finding survives only when a run proves it. Report the findings. Do not apply fixes.

## Frame

Use the scope the user names. Otherwise review the branch diff from its merge base with the actual base branch, through the working tree, including staged changes and relevant untracked files. State intent with [in-your-own-words](../in-your-own-words/SKILL.md), from the user's message, commits, and PR description. Ask when intent is unclear.

Freeze the source head and capture the scoped staged, unstaged, and untracked changes before dispatch. Include deletions, binary changes, and file modes. Do not copy secrets or unrelated local files. Each adversary must test the same snapshot, not just committed HEAD. If the host cannot seed and verify that snapshot in every isolated worktree, stop and report the gap rather than review a different tree.

## Fan out

Read [arena](../arena/SKILL.md) Phase A steps 3 and 4 and Phase B, substituting the `interrogate reviewers` model role for `arena runners`. On Pi, call `pstack_panel` with execution role `implementer`, `worktree: true`, and one identical task per configured entry. These adversaries write repros, so the read-only `reviewer` profile is not suitable. The model role remains `interrogate reviewers`; execution permissions do not change the configured models, efforts, or fast mode. Missing policy or unavailable models stop dispatch.

Give every adversary the scope, intent, frozen source head, snapshot artifacts and setup instructions, acceptance criteria, and this brief:

> Break this change. First seed your isolated worktree with the scoped source snapshot and verify it matches before running probes. Prove each finding with a run against the real code, such as a failing test, a repro script, or command output that shows wrong behavior. For a design or plan, run a prototype or probe the current tree. Write only repros and disposable test fixtures in your own worktree. Do not fix product code, commit, push, start children, or mutate external systems. Report each finding with a title, worktree and repro paths, the exact command and setup, the output it printed, and the output the intent requires. Leave out anything you did not run, including style, naming, structure, and risks that need a future change to matter. No findings is a valid result.

Wait for every required adversary. Call `pstack_status` and require true success with empty failure lists before accepting a result. A failed or missing adversary is a coverage gap, never a clean review.

## Verify

Rerun each finding's command in its preserved isolated worktree against the same source snapshot. Inspect the repro and its setup first. Keep a finding only when the output demonstrates a failure that breaks intent, not one manufactured by an unrelated product edit. Merge findings with the same root cause. Preserve commands, outputs, and repro artifacts until verification is complete.

Skip arena Phases C, D, and E. Keep every verified failure, not one adversary's list. Do not graft repros or fixes into the user's working tree.

## Output

- **Intent.** The restatement and reviewed snapshot.
- **Findings.** Each verified finding, its command, output, required output, how it breaks intent, and the observed models that found it. Say "no verified findings" when none survive; disclose coverage gaps alongside it.
- **Dropped.** For each adversary, the count of dropped findings and why, plus failed or missing runs.
