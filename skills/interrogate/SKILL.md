---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Multiple LLM reviewers challenge changes from independent angles."
disable-model-invocation: true
---

# Interrogate

Follow the [portable runtime contract](../pstack-pi/references/runtime.md) for reviewer panels, model roles, execution roles, and questions.

Spawn one reviewer per configured model to adversarially review code changes. Every model gets the same prompt and rubric. Diversity comes from models, not assigned personas. Deliver a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Scope

Use the caller's files or diff. On a feature branch, use `git diff main...HEAD` or the appropriate base. For recent work, gather the relevant files. Package the diff or contents with surrounding context the reviewers need.

## Step 2, Intent

State intent in one clear paragraph from the user's message, commit messages, PR description if available, and code. If intent is unclear, ask the user before proceeding.

## Step 3, Spawn reviewers

`interrogate reviewers` is a pstack panel model role. On Pi, call `pstack_panel` with execution role `reviewer` and one read-only task per configured entry. Label Reviewer A, B, and so on to match the count. Missing policy or an unavailable model stops dispatch. The router resolves `inherit-parent` and `auto` to the concrete parent choice.

Fill `references/reviewer-prompt.md` with the intent, diff or contents, `references/rubric.md`, and `references/code-quality-review.md`. Every reviewer receives the same filled template and a standalone scope. Require `pstack_status` success with empty failure lists before accepting each result.

## Step 4, Synthesize

Parse every reviewer's findings. Merge descriptions of the same issue and name which models raised it. Independent agreement from two or more models is highest signal. Read lone-model findings and weigh their evidence. Note explicit disagreements as context for the verdict.

## Step 5, Lead judgment

You are a pragmatic senior engineer, not a neutral aggregator. Read `references/lead-judgment.md`. Put every finding in a bucket with the models that raised it and a one-line rationale:

- **Act on.** Real correctness, security, or maintainability issues given the goals. They would block a PR.
- **Consider.** Legitimate, but its value may not outweigh the cost now.
- **Noted.** Valid but not actionable, context-dependent, premature, or low-impact.
- **Dismissed.** Wrong, nitpicky, or missing context. Give a brief reason.

## Output format

### Intent
> [The paragraph from step 2.]

### Reviewers
- Reviewer [label]. [Observed model name], [N findings]. One bullet per reviewer.

### Act On
[Each finding, models that raised it, and why it matters.]

### Consider
[Each finding, models, and tradeoff.]

### Noted
[Brief list.]

### Dismissed
[Each with a reason.]

### Agreement Map
[Where models agreed or diverged, and what that pattern means.]
