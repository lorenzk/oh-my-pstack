import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, readFile, readdir, stat } from "node:fs/promises";
import { constants } from "node:fs";
import test from "node:test";
import { buildPanelWorkflowScript, parsePstackConfig, resolveModelRole } from "../extensions/pstack-router/core.ts";
import { isProtectedPath } from "./sync-upstream.mjs";

const root = new URL("../", import.meta.url);
const load = path => readFile(new URL(path, root), "utf8");

const newSkills = [
  "sharpen", "create-formal-verification-skill", "maintain-formal-verification-skill",
  "statechart", "ketchup-video",
];

test("0.15.36 exposes every new skill and protects its host adaptations", async () => {
  const help = await load("skills/poteto-help/SKILL.md");
  for (const name of newSkills) {
    const path = `skills/${name}/SKILL.md`;
    const source = await load(path);
    assert.match(source, new RegExp(`^name: ${name}$`, "m"));
    assert.match(source, /disable-model-invocation: true/);
    assert.ok(help.includes(`../${name}/SKILL.md`), name);
    if (name !== "sharpen") assert.equal(isProtectedPath(path), true, path);
  }
  const manifest = JSON.parse(await load("package.json"));
  assert.equal(manifest.version, "0.15.36-pi.1");
  assert.equal(JSON.parse(await load("package-lock.json")).version, manifest.version);
});

test("packed refresh ships new skills and executable launchers without nested dependencies", () => {
  const run = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: root, encoding: "utf8", timeout: 30000,
  });
  assert.equal(run.status, 0, run.stderr);
  const [packed] = JSON.parse(run.stdout);
  const files = new Map(packed.files.map(file => [file.path, file]));
  for (const name of newSkills) assert.ok(files.has(`skills/${name}/SKILL.md`), name);
  assert.equal(files.get("skills/statechart/scripts/statechart").mode & 0o111, 0o111);
  assert.equal(files.get("skills/statechart/scripts/test/java.ts").mode & 0o111, 0o111);
  assert.ok(![...files.keys()].some(path => /(^|\/)(node_modules|vendor)(\/|$)/.test(path)));
});

test("Interrogate keeps configured reviewer models while isolating executable repro writers", async () => {
  const config = parsePstackConfig("interrogate reviewers: provider/one:high, provider/two:medium");
  const models = resolveModelRole(config, "interrogate reviewers");
  let launched;
  const script = buildPanelWorkflowScript({
    modelRole: "interrogate reviewers", executionRole: "implementer", agent: "poteto-agent",
    models, tasks: ["Run repro A.", "Run repro B."], worktree: true,
  });
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction("runs", script)({ all: async children => { launched = children; return children; } });
  assert.deepEqual(launched.map(child => child.model), ["provider/one:high", "provider/two:medium"]);
  assert.ok(launched.every(child => child.worktree && child.agent === "poteto-agent"));
  const workflow = await load("skills/interrogate/SKILL.md");
  assert.match(workflow, /execution role `implementer`, `worktree: true`/);
  assert.match(workflow, /scoped staged, unstaged, and untracked changes/);
  assert.match(workflow, /Rerun each finding's command/);
  assert.match(workflow, /Do not apply fixes/);
  assert.match(workflow, /`pstack_status`/);
  assert.doesNotMatch(workflow, /references\/(?:rubric|reviewer-prompt|lead-judgment|code-quality-review)/);
});

test("orchestration no longer ships or calls retired bookkeeping machinery", async () => {
  const directory = new URL("skills/poteto-mode/scripts/", root);
  assert.ok(!(await readdir(directory)).includes("orch"));
  const workflow = await load("skills/poteto-mode/playbooks/orchestrate.md");
  assert.doesNotMatch(workflow, /orch\.ts|orch init|frontier\.json|requires `gt`/);
  assert.match(workflow, /Children never start children/);
  assert.match(workflow, /Owners never merge or arm auto-merge/);
  assert.match(workflow, /`pstack_status`/);
  assert.match(workflow, /Stop and reconcile an old writer/);
  const scripts = JSON.parse(await load("skills/poteto-mode/scripts/package.json"));
  assert.equal(scripts.scripts.test, "bun test watch-pr check-plan.test.ts");
});

test("autopilots preserve root landing gates and scale repeated verification", async () => {
  const full = await load("skills/poteto-mode/playbooks/autopilot-full.md");
  assert.match(full, /Another full swarm is required for new behavior/);
  assert.match(full, /single independent verifier at the new head/);
  assert.match(full, /A failed or missing required lane remains a gap/);
  assert.match(full, /Only the root squash-merges/);
  const stack = await load("skills/poteto-mode/playbooks/autopilot-stack.md");
  assert.match(stack, /No owner or root merges, arms auto-merge/);
  assert.match(stack, /Stack only dependent PRs/);
  assert.match(stack, /After handoff, nobody pushes without the operator's go/);
  const mode = await load("skills/poteto-mode/SKILL.md");
  assert.match(mode, /Task urgency does not authorize automatic effort or speed changes/);
});

test("catch-up lists every pending call and makes rendering capability-aware", async () => {
  const ketchup = await load("skills/ketchup/SKILL.md");
  assert.match(ketchup, /Never cut items or shrink them to stay under a word count/);
  assert.match(ketchup, /even one raised before their last message/);
  assert.match(ketchup, /outside the repository/);
  assert.doesNotMatch(ketchup, /\/visualize|under 250 words/);
  const video = await load("skills/ketchup-video/SKILL.md");
  assert.match(video, /If rendering or inspection is unavailable/);
  assert.match(video, /never draw a screen you did not capture/i);
});

test("Reflect edits user-owned sources only after destination approval", async () => {
  const reflect = await load("skills/reflect/SKILL.md");
  assert.match(reflect, /Never edit a managed plugin cache or installed release in place/);
  assert.match(reflect, /Before approval, show the exact destination/);
  assert.match(reflect, /Never push or open a PR/);
});

test("statechart launchers are executable and run without a guessed installation root", async () => {
  for (const path of ["skills/statechart/scripts/statechart", "skills/statechart/scripts/test/java.ts"]) {
    await access(new URL(path, root), constants.X_OK);
    assert.ok((await stat(new URL(path, root))).mode & 0o111);
  }
  const run = spawnSync(new URL("skills/statechart/scripts/statechart", root).pathname, [], { encoding: "utf8", timeout: 10000 });
  assert.equal(run.status, 2, run.stderr);
  assert.match(run.stderr, /Give one SPEC\.tla/);
  assert.match(run.stderr, /Usage: statechart/);
  const workflow = await load("skills/statechart/SKILL.md");
  assert.match(workflow, /actual installed directory/);
  assert.match(workflow, /If rendering is unavailable/);
  assert.equal(isProtectedPath("skills/statechart/scripts/test/cli.test.ts"), true);
});
