---
name: poteto-help
description: Guides users through pstack setup, poteto-mode, and picking a skill, playbook, or principle. Use for /poteto-help or questions about installing, setting up, or using pstack. Not for requests to do work, even ones that name pstack.
---

# Poteto help

Answer the question, give one prompt the user can send, and link the file that owns the answer. Do not start a workflow for a help question. A request such as "use pstack to fix this bug" is work, not help; read [poteto-mode](../poteto-mode/SKILL.md) and run it instead.

Read the routed file before quoting it. Installed files own the details when this map disagrees. Give a local file path or its public portable copy under `https://github.com/shrimpwtf/oh-my-pstack/blob/main/`. Upstream Cursor instructions are not Pi instructions.

## Find the need

Infer it from the message and conversation. If still unclear, ask one focused multiple-choice question through `ask_user` when available, otherwise in chat:

- Get set up
- Start a task
- Pick a skill
- Fix a run
- Make pstack my own

Check state only when it changes the answer. Read `$PSTACK_CONFIG` if set, otherwise `.pstack/config.md`. Missing policy means Pi delegation is not configured, not that roles silently get defaults. If the project has no app verification skill or harness, mention [create-verification-skill](../create-verification-skill/SKILL.md) for questions about proving behavior.

## Get set up

Read the [portable README](../../README.md) and [setup-pstack](../setup-pstack/SKILL.md).

On Pi:

1. Install `pi install https://github.com/shrimpwtf/oh-my-pstack` and `pi install npm:pi-subagents`.
2. Restart Pi and run `/subagents-doctor`.
3. Run `/skill:setup-pstack`, confirm models and budget, then run `/pstack-doctor`.
4. Start a real task with `/skill:poteto-mode`, a goal, and a check that can pass or fail.

Installing exposes resources; it does not start a workflow. Pi loads skills on demand from descriptions or explicit `/skill:name` commands. Skills marked `disable-model-invocation: true` require explicit loading or another workflow reading them. Other hosts use their documented skill invocation syntax.

For cost, reduce reasoning effort, choose cheaper available models, or shorten panel lists. A panel runs one child per entry. `auto` and `inherit-parent` resolve to the concrete parent model and thinking level on Pi; they are not free. A reasoning budget is not a spending cap. Reruns preserve confirmed model families and panel membership unless the user changes them.

Pi requires per-child model selection through the router. Missing roles or unavailable models stop dispatch. Do not recommend vendor-default fallback. Read [pstack-pi](../pstack-pi/SKILL.md) for the host contract.

## Start a task

[poteto-mode](../poteto-mode/SKILL.md) picks the playbook, tracks its steps, and reads supporting skills as needed. A good prompt states the goal and the done predicate rather than a hand-written skill sequence. "New task" requests a fresh playbook.

Pi has no Cursor Custom Mode or Option+Enter activation. Explicitly invoke `/skill:poteto-mode` for each new substantial task and after context loss. Use a project instruction if the user wants a standing routing rule. Alt+Enter in Pi queues a follow-up; it does not pin a skill. Native Pi also has no built-in `/loop`, planning mode, or subagents. Installed extensions supply those capabilities; never invent them.

## Pick a skill

The default is poteto-mode. Name another skill directly when the user asks for a narrower outcome. Read it before recommending it and give one example prompt using the active host's syntax.

| Need | Skill |
|---|---|
| Rigorous non-trivial work | [poteto-mode](../poteto-mode/SKILL.md) |
| How code works or where a change belongs | [how](../how/SKILL.md) |
| Why the code took its shape | [why](../why/SKILL.md) |
| A plain explanation of a subsystem or change | [teach](../teach/SKILL.md) |
| Recent context from the user's own work | [recall](../recall/SKILL.md) |
| Breakage outside a small diff | [blast-radius](../blast-radius/SKILL.md) |
| Types and module shape before implementation | [architect](../architect/SKILL.md) |
| Several attempts at one brief, then base selection | [arena](../arena/SKILL.md) |
| Parallel slices or a worker race | [swarm](../swarm/SKILL.md) |
| Independent adversarial review | [interrogate](../interrogate/SKILL.md) |
| Cheap test-first bug fixing | [tdd](../tdd/SKILL.md) |
| TypeScript rules | [typescript-best-practices](../typescript-best-practices/SKILL.md) |
| Independent comment review | [no-comments](../no-comments/SKILL.md) |
| Clean prose | [unslop](../unslop/SKILL.md), [technical-writing](../technical-writing/SKILL.md) |
| A simpler version of the last reply | [bro](../bro/SKILL.md) |
| Scripted app verification | [create-verification-skill](../create-verification-skill/SKILL.md), [maintain-verification-skill](../maintain-verification-skill/SKILL.md) |
| Vet a measured performance number | [benchmark-checklist](../benchmark-checklist/SKILL.md) |
| A bespoke rigorous workflow | [figure-it-out](../figure-it-out/SKILL.md) |
| An auditable decision trail | [show-me-your-work](../show-me-your-work/SKILL.md) |
| Models and reasoning budgets | [setup-pstack](../setup-pstack/SKILL.md) |
| Host delegation and lifecycle details | [pstack-pi](../pstack-pi/SKILL.md) |
| A personal workflow skill | [automate-me](../automate-me/SKILL.md) |
| Lessons from completed work | [reflect](../reflect/SKILL.md) |
| Enforce rules against repeated agent mistakes | [correct](../correct/SKILL.md) |
| A webhook-driven dashboard | [make-bot-ui](../make-bot-ui/SKILL.md) |

Read frontmatter for installed skills not listed here. Principles are `principle-*` leaf skills indexed by poteto-mode. They steer decisions, not model selection.

Close calls: how explains behavior, why investigates motivation, and teach combines them. Arena selects and grafts candidates; swarm aggregates slices or a race. Architect normally implements after design; "with checkpoint" asks it to stop for design review. Recall rebuilds recent context; Session pickup resumes one specific effort. Figure-it-out designs one run; Orchestrate drives a multi-day program.

## Playbooks

Playbooks are step lists, not slash commands. Under poteto-mode, "babysit this PR" runs Babysit and stops at merge-ready unless landing was authorized. "Land the stack" runs Shipping. "Take over this branch" runs Session pickup. "Pause safely" runs Pause safely. "Full autopilot on this queue" runs Autopilot-full; "stack them, don't ship" runs Autopilot-stack. "Run the eval playbook" runs Eval.

For phased plans, [Multi-phase plan](../poteto-mode/playbooks/multi-phase-plan.md) writes the plan without implementing. Prototype settles an empirical design fork. The [poteto-mode index](../poteto-mode/SKILL.md) owns the full list. There is no bundled orchestrate slash skill.

## Fix a run

| Symptom | Action |
|---|---|
| Mode stopped applying | Explicitly reload `/skill:poteto-mode`; do not suggest Cursor keybindings. |
| A question continued the last task | Say "new task" or opt out for that turn. |
| Model choice had no effect | Check selected config path, `/pstack-doctor`, and `/pstack-routes`. New launches resolve current policy; a retained owner keeps its original route. |
| Skill did not load | Use `/skill:name`, check `pi list`, and inspect duplicate skill warnings. |
| Workers overwrote files | Give each writer a separate managed worktree or serialize that scope. |
| Overnight progress had no finish | Name a done predicate and verify an installed scheduler; checkpoint when unavailable. |
| Build green was treated as success | Ask for the real flow, stored value, command, or profile. |
| A child claimed success | Require `pstack_status` success with empty failure lists and parent artifact verification. |

## Make it yours

Automate-me drafts a personal skill from authorized history. Reflect proposes skill changes from a completed run. Correct turns repeated mistakes into architecture, type, lint, or test enforcement. Poteto-mode's authoring and eval playbooks create and test skills. Fix a broken workflow separately from unrelated feature work.

## Reply

Lead with the answer. Give at most one example prompt, then a source link. Keep it short unless the user requested the map.
