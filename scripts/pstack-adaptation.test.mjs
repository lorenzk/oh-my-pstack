import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MODEL_ROLES, buildPanelWorkflowScript, buildScalarWorkflowScript,
  missingModelRoles, parsePstackConfig, resolveModelRole,
} from "../extensions/pstack-router/core.ts";

const model = { model: "openai-codex/example", configured: "openai-codex/example", fast: false };
const panel = {
  modelRole: "arena runners", executionRole: "implementer", agent: "poteto-agent",
  models: [model, model], tasks: ["Implement A.", "Implement B."],
};
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

test("current setup needs no removed how critics role", async () => {
  const config = parsePstackConfig(MODEL_ROLES.filter(role => role !== "how critics")
    .map(role => `${role}: inherit-parent`).join("\n"));
  assert.deepEqual(missingModelRoles(config), []);
  const how = await readFile(new URL("../skills/how/SKILL.md", import.meta.url), "utf8");
  assert.doesNotMatch(how, /how critics|Critique Mode|critic-prompt/);
});

test("preserves budget-era grouped reasoning entries regardless of line order", () => {
  const config = parsePstackConfig(`# budget: medium (high)
feature, refactoring reasoning: high
feature, refactoring: openai-codex/example
arena runners: openai-codex/example, anthropic/example:low
arena runners reasoning: medium, host-default
`);
  assert.equal(resolveModelRole(config, "feature")[0].thinking, "high");
  assert.equal(resolveModelRole(config, "refactoring")[0].thinking, "high");
  assert.deepEqual(resolveModelRole(config, "arena runners").map(choice => choice.thinking), ["medium", "low"]);
});

for (const [name, config, error] of [
  ["conflicting suffix", "feature: openai-codex/example:low\nfeature reasoning: high", /conflicting/],
  ["mismatched panel", "arena runners: openai-codex/example, anthropic/example\narena runners reasoning: high", /must match/],
  ["orphan effort", "feature reasoning: high", /must match/],
  ["unknown effort", "feature: openai-codex/example\nfeature reasoning: extreme", /invalid reasoning/],
  ["duplicate effort", "feature: openai-codex/example\nfeature reasoning: high\nfeature reasoning: high", /duplicate reasoning/],
  ["inherit override", "feature: inherit-parent\nfeature reasoning: high", /preserve parent thinking/],
]) test(`rejects ${name} before launch`, () => assert.throws(() => parsePstackConfig(config), error));

test("fast eligibility follows runtime support rather than frozen model names", () => {
  const config = parsePstackConfig("feature: openai-codex/future-model:high [fast]");
  assert.equal(resolveModelRole(config, "feature")[0].fast, true);
});

for (const role of ["implementer", "owner", "mechanical", "researcher"]) {
  test(`${role} panel requires isolated writer worktrees`, () => {
    assert.throws(() => buildPanelWorkflowScript({ ...panel, executionRole: role }), /require worktree: true/);
  });
}

test("writer panel binds isolation and explicit fast false on every child", async () => {
  let launched;
  const script = buildPanelWorkflowScript({ ...panel, worktree: true });
  await new AsyncFunction("runs", script)({ all: async children => { launched = children; return children; } });
  assert.equal(launched.length, 2);
  for (const child of launched) {
    assert.equal(child.worktree, true);
    assert.equal(child.fast, false);
    assert.equal(child.model, model.model);
  }
  assert.notEqual(launched[0].key, launched[1].key);
});

test("scalar false fast overrides host defaults instead of inheriting them", async () => {
  let launched;
  const script = buildScalarWorkflowScript({ ...model, modelRole: "feature", executionRole: "implementer", agent: "poteto-agent", task: "Implement.", worktree: true });
  await new AsyncFunction("runs", script)({ run: async (_key, child) => { launched = child; } });
  assert.equal(launched.fast, false);
  assert.equal(launched.worktree, true);
});

test("keeps refreshed source roots, protected adapters, and package assets", async () => {
  const load = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
  const lock = await load("upstream.lock.json");
  const manifest = await load("package.json");
  assert.ok(lock.sourceRoots.some(root => root.source === "pstack/automations/benny/skills"));
  assert.ok(lock.protectedPaths.includes("skills/make-bot-ui/SKILL.md"));
  assert.ok(manifest.files.includes("assets"));
});
