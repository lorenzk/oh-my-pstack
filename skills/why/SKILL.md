---
name: why
description: "Use for 'why does X work this way', 'why we picked Y', design rationale, regressions, postmortems, or data-backed thresholds. Discovers available MCPs and queries each evidence category (source control, issue tracker, long-form docs, real-time chat, infrastructure observability, error tracking, product analytics warehouse) in parallel, then returns a cited read on decisions and tradeoffs. Use how for runtime behavior."
disable-model-invocation: true
---

# Why

Follow the [portable runtime contract](../pstack-pi/references/runtime.md) for capability discovery, concurrency, model roles, and unavailable-capability reporting.

Investigate the motivation and intent behind code. The companion `how` skill explains behavior. `why` explains what forces led to its shape.

`why investigators` and `why synthesizer` are pstack model roles. On Pi, route each child through `pstack_launch`, which binds the concrete per-run `model`. Select execution roles independently. Forbid writes in every standalone brief. Require `pstack_status` success with empty failure lists before accepting results. The router does not grant citation tools; verify the execution profile already exposes them, or report the capability gap.

## Operating posture

Be careful, cautious, and precise. Separate what you know from what you infer. Read `references/epistemics.md` for the confidence framework and phrasing guide. The synthesizer must follow it.

## 1. Understand the target and question

The **target** is usually code, a pattern, a feature, or a named decision. The **question** is usually rationale, a tradeoff, a motivating edge case, an external constraint, dead code, or history.

If the referent is vague, infer it from conversation context, open files, recent edits, or active selection when exposed. State your interpretation so the user can redirect, then proceed.

## 2. Establish the code anchor

Build the seed context inline. Include file paths and line ranges, key symbols, recent commits, PR numbers from merge subjects such as `(#1234)`, and linked ticket IDs. Use:

- `git blame -L <start>,<end> <file>` for last-touch commits.
- `git log --follow -p -- <file>` for patches through renames.
- `git log --oneline -20 -- <file>` for recent commits.
- `git log -1 --format=%B <commit>` to extract PR numbers.

When `gh` is available and authenticated, retrieve substantive PR bodies and discussion with `gh pr view <number> --json title,body,author,createdAt,mergedAt,labels,closingIssuesReferences,comments,reviews`. Otherwise record that gap. Give this anchor to every investigator and the synthesizer.

## 3. Spawn parallel investigators

Default to the full investigation. Produce a complete coverage map, not a minimal one. Document the null, don't skip the search.

### Discovery

Inspect external tools, MCP servers, resources, and CLIs exposed by the current host. The live inventory is authoritative. Do not infer a vendor directory or claim an absent source is searchable.

Map each available capability to one evidence category. Local Git history is available in a Git workspace; remote PR history is separate and optional. Classify other sources by MCP name, server instructions, tool names, and resource descriptors. If a source fits several categories, use its primary evidence and record the ambiguity.

Launch one investigator per available evidence category concurrently. Each owns exactly one tool or MCP. Do not assign multiple MCPs to one child.

On Pi, call `pstack_launch` with model role `why investigators`. Use execution role `explorer` for local Git/CLI history, `researcher` for web evidence, or `researcher` with `mcp: true` for an MCP-backed category. Preserve required tool access without granting write authority.

Each investigator receives `references/investigator-prompt.md`, filled in, plus:

- The matching `references/sources/<source>.md`, adapted from `references/source-playbook.md`.
- `references/sources/incident-postmortem.md` if the target looks defensive, such as null guards, retries, timeouts, rate limits, flags, egress guards, or OOM handlers.
- The code anchor and original question.

### Roster

Each category surfaces a distinct kind of why. Use it to interpret findings, name empty results, and justify rare irrelevant-source skips.

1. **Source control.** Git history, optional `gh` PRs, comments, and tests. Always investigate when available. Best at implementation-time rationale captured during review.
2. **Issue / ticket tracker.** Linear, Jira, GitHub Issues, Plane, Shortcut. Best at the product or business forcing function, especially external constraints.
3. **Long-form documents.** Notion, Confluence, Google Docs, Coda. Best at design rationale written before implementation.
4. **Real-time team chat.** Slack, Discord, Teams, Mattermost. Best at deliberation that never reached a document, especially when the written paper trail is thin.
5. **Infrastructure observability.** Datadog, New Relic, Honeycomb, Grafana, Splunk. Best at runtime reality behind timeouts, retries, rate limits, and circuit breakers.
6. **Error / exception tracking.** Sentry, Rollbar, Bugsnag, Airbrake. Best at the exceptions behind defensive code, catch blocks, null guards, and corrective changes.
7. **Product analytics warehouse.** Databricks, Snowflake, BigQuery, ClickHouse, dbt, Redshift. Best at data behind experiments, flags, migrations, and numerical thresholds.

### Skips

Every skip needs a written justification in Sources Consulted. Only two reasons qualify:

- No matching capability is available. This is a gap, not a choice.
- The source is provably irrelevant, not merely unlikely to help. For example, runtime error tracking for a build-time script with no runtime path.

For a trivial target whose PR already answers everything, respond inline only after confirming all seven category searches would be redundant. State that justification. This should be rare.

## 4. Synthesize

Launch one child with execution role `synthesizer`. On Pi, call `pstack_launch` with model role `why synthesizer`. Verify its citation-tool capabilities before dispatch; forbid repository writes.

Give it every investigator's findings, nulls and justified skips, the code anchor, the original question, `references/epistemics.md`, and `references/synthesizer-prompt.md`.

## 5. Present

Present the validated output. Light edits for clarity or conversation context are fine. Do not rewrite its confidence language.

## Output format

Use `references/synthesizer-prompt.md`. The Question, The Code in Question, What We Found, What We Can Reasonably Infer, Competing Hypotheses, What We Don't Know, Sources Consulted, Confidence Summary. Keep the confidence separation and one Sources Consulted line per investigator, including empty or skipped categories and their reasons.

When the question precedes a code change, convert lineage into Preserve / Change / Avoid / Risk constraints after Sources Consulted.

Avoid recency bias. The latest commit is not necessarily authoritative. Trace earlier decisions that accumulated into the current shape.
