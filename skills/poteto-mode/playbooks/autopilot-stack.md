### Autopilot-stack

Run `skill://poteto-mode/playbooks/autopilot-full.md`, but do not merge. The root still starts every child and owns verification and approvals. The operator lands the PRs.

1. **Replace step 5 with verified handoff.** Stop when each PR is verified and green at its current head. No owner or root merges, arms auto-merge, or closes a PR under this playbook. After handoff, nobody pushes without the operator's go. Every audit prompt names this file so it preserves the no-merge rule.
2. **Stack only dependent PRs.** Independent PRs branch off trunk. A PR that builds on another targets that parent's branch, per **Size and stacks** in `skill://poteto-mode/playbooks/opening-a-pr.md`. Its owner alone rebases and pushes the branch under root coordination; another owner never rewrites it. Pin any authorized `--force-with-lease` to the last known remote SHA. A root PR rebases onto trunk and a child onto its parent's exact tip. A lower-head change restacks descendants bottom-up. Apply the Shipping patch-id rule to each new head; rerun mergeability and CI even when a code verdict survives. A changed patch needs the fresh verification required by Autopilot-full step 4.

**Reply:** list each PR with its current head, verdict, and parent or trunk base, plus operator gates and trail links. Deliver independent PRs separately and dependent chains bottom-up, not an artificial single stack.
