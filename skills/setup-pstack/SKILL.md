---
name: setup-pstack
description: Configure models and reasoning budgets per pstack workflow role. Detects the live host inventory and writes project policy without changing host agent defaults. Use for /setup-pstack, "configure pstack models", "pstack budget", or changing pstack model choices.
---

# Setup pstack

Follow the [portable runtime contract](../pstack-pi/references/runtime.md) throughout this setup.

If `$PSTACK_CONFIG` is set, write the complete policy at that path. Otherwise, write `.pstack/config.md` in the current project. The environment path replaces the project path. The two files do not form layers.

Model roles and execution roles are independent. A pstack model role selects a model for one workflow step. A host execution role selects the child prompt, tools, permissions, and context.

## 1. Verify model delegation

Detect both capabilities:

1. Enumerate the models available to the current host.
2. Select a model for each child launch.

For Pi, use `pi --list-models` for the model inventory. Require `pstack_launch`, `pstack_panel`, `pstack_followup`, `pstack_status`, and the `subagent` tool. Recommend `pi install npm:pi-subagents` when the `subagent` tool is absent. Tell the user to restart Pi. Tell the user to run `/subagents-doctor` and `/pstack-doctor` after installation.

Use the live host inventory. Do not copy model identifiers from examples. Do not write configuration when the host cannot select a model for each child.

For Pi, record concrete choices as `provider/model-id:thinking` when the model supports effort control. Pi supports `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, and `max`. The base `provider/model-id` must exist in the live inventory.

Add `[fast]` after an explicit native `openai-codex` choice to request priority service. The installed pi-subagents runtime validates which models support it. Do not infer support from model naming or add `[fast]` to `inherit-parent` or `auto`. Priority service may increase cost.

Use the exact child model value that another host accepts. Preserve an effort suffix only when that host supports it.

`inherit-parent` and `auto` both select the parent model. The runtime adapter must use the host's explicit inheritance mechanism when omission can activate a host default.

## 2. Load the current configuration

Read the selected configuration path when it exists. Treat each existing value as the current choice.

A line names a pstack model role. It does not name a host agent. Panel values after the colon contain one entry per child.

Expand the two shared upstream labels exactly:

- `feature, refactoring` configures `feature` and `refactoring`.
- `reflect judgment, divergent, synthesizer` configures `reflect judgment`, `reflect divergent`, and `reflect synthesizer`.

Do not derive model choices from host agent names such as `scout`, `worker`, `reviewer`, or `oracle`.

Drop retired role lines, such as `how critics`, and their separate reasoning entries from the proposed policy. List every dropped line when asking the user to confirm. Do not drop a supported role or change a configured model just because upstream changed its defaults.

## 3. Confirm the reasoning budget and every model role

Preserve the existing `# budget` comment, model families, panel membership, and
explicit efforts on reruns. Ask one focused budget question through the host's
structured interaction facility:

- `unlimited`: keep current efforts, including max where supported.
- `large`: target xhigh.
- `medium`: target high.
- `small`: target medium.

For a target budget, choose the highest supported level at or below the target
on `max > xhigh > high > medium > low > minimal > off`. Do not change model
families to satisfy a budget. Inherited choices retain parent thinking. If the
host cannot establish supported efforts, preserve choices and report the gap.
A reasoning budget is not a monetary cap.

On Pi, encode confirmed effort in `provider/model-id:thinking`. When migrating
older `<role> reasoning:` lines, preserve their choice-by-choice meaning; reject
conflicts and unequal list lengths. `host-default` omits the effort override.
An inherited choice may only use `host-default` in a separate reasoning line.
Other hosts use only effort controls their child facility supports.

Show every line from the configuration shape below. Mark a concrete model that is absent from the live inventory.

Ask the user to accept the current values or change specific lines. Offer only detected models, `inherit-parent`, and `auto`.

For `arena runners`, `architect runners`, and `interrogate reviewers`, list
length controls fan-out. `arena cross-judge pool` supplies candidates for one
judge, not a judge per entry. Prefer a different model family when available.
The current how workflow no longer has a critics phase; do not add it during setup.

`swarm workers` accepts one or more models. Use `modelNumber` on each `pstack_launch` to select a race arm.

## 4. Validate the choices

Verify every concrete base model against the live inventory. Verify each effort level when the host reports supported levels. On Pi, run `/pstack-doctor` after the write.

If the user authorizes model probes, probe every distinct concrete choice once. Probe each `[fast]` choice with fast mode active. Report authentication, quota, priority-service, and unsupported-effort failures. Ask for a replacement instead of writing an unusable choice.

Accept `inherit-parent` or `auto` only when the child runtime can inherit the current parent model.

## 5. Write only the pstack configuration

Create the parent directory when required. Overwrite the selected file so repeated setup stays idempotent. Record `# budget: unlimited (keep current efforts)` or `# budget: <label> (<target>)` only when the supported budget was applied. Never claim unsupported efforts were applied.

Keep these original model role lines and labels:

```md
# pstack model configuration
# Values are concrete child model choices confirmed by the active host.
feature, refactoring: <code-model>
bug-fix: <instruction-model>
perf-issue: <instruction-model>
hillclimb: <instruction-model>
judgment and prose: <judgment-model>
hardest tasks: <judgment-model>
how explorer: <explorer-model>
how explainer: <judgment-model>
why investigators: <explorer-model>
why synthesizer: <judgment-model>
reflect tooling: <instruction-model>
reflect judgment, divergent, synthesizer: <judgment-model>
arena runners: <judgment-model>, <instruction-model>, <explorer-model>
arena cross-judge pool: <judgment-model>, <instruction-model>, <explorer-model>
swarm workers: <code-model>, <alternate-model>
architect runners: <judgment-model>, <instruction-model>, <explorer-model>
interrogate reviewers: <judgment-model>, <instruction-model>, <explorer-model>
```

Replace every placeholder with a confirmed concrete choice. For Pi, valid values resemble `openai-codex/gpt-5.6-sol:max` and `openai-codex/gpt-5.6-luna:xhigh [fast]`.

Do not write host agent settings. Do not create model mappings for host agents. Existing host settings remain under user control.

## 6. Confirm the result

Report the exact configuration path. List each model role line and its selected value.

State that `pstack_launch` and `pstack_panel` resolve each configured value. State that the router passes the model through the child launch `model` field. State that `[fast]` becomes the separate `fast: true` field. State that configuration does not create models, agents, permissions, or delegation facilities.

If the host lacks per-child model selection, report that no configuration was written. Name the missing capability.

## 7. Offer a verification skill

Check whether the project has a real application verification skill or an existing test harness. If neither exists, offer the sibling **create-verification-skill** skill once.
