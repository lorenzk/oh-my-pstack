---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
disable-model-invocation: true
---

# How

Follow the [portable runtime contract](../pstack-pi/references/runtime.md) for explorer and synthesizer roles, model choices, and unavailable capabilities.

Explore the codebase to answer "how does X work?" Produce an architectural explanation at the level of a senior engineer onboarding onto a subsystem. Build a working mental model, not annotated source code.

Every child is read-only and receives a standalone brief. On Pi, use `pstack_launch` with model role `how explorer` and execution role `explorer` for exploration, or model role `how explainer` and execution role `synthesizer` for explanation. Stop if policy or delegation is unavailable. Require `pstack_status` success with empty failure lists before accepting each result.

## 1. Assess complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (a single module, a small utility, a narrow question such as "how does function X work"). No explorers. Launch one explainer that explores and explains in one pass, built from `references/explainer-prompt.md` without the explorer-findings section. Go to step 4.
- **Complex** (multiple files or services, a cross-cutting feature, a full architectural overview). Go to step 2.

When in doubt, take the simple path.

## 2. Explore (complex only)

Decompose the question into 2 to 4 angles, each a distinct slice of the subsystem. Launch all explorers concurrently, each with `references/explorer-prompt.md` and its angle filled in.

## 3. Synthesize (complex only)

Once all explorers return and pass route validation, launch one explainer with `references/explainer-prompt.md` and every explorer's findings filled in.

## 4. Present

Present the validated explainer output. Light edits for clarity or conversation context are fine. Do not substantially rewrite it.

## Output format

Use the sections in `references/explainer-prompt.md`, dropping any that do not apply. Overview, Key Concepts, How It Works, Where Things Live, Gotchas.
