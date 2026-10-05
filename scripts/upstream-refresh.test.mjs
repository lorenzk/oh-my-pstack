import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { isProtectedPath, normalizeContent } from "./sync-upstream.mjs";

const root = new URL("../", import.meta.url);
const load = path => readFile(new URL(path, root), "utf8");
const rule = "Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.";
function plan(model = "provider/example:high") {
  return `# Example

## How to read this
One box is one unit of work and names the evidence.
Check a box only when its evidence exists.
Read playbooks/autopilot-full.md.
${rule}

## Program checklist
### Arm the program
- [ ] Record a durable goal.
- [ ] Read \`git show origin/main:plan.md\`.
- [ ] Schedule the hourly audit and log every tick.
- [ ] Post a status message only for new changes.
### Spawn owners
- [ ] Start fresh owners.
### PR mechanics
- [ ] Open a ready PR.
### Verdict and merge
- [ ] Verify code-ready.
### Boot recipe
- [ ] Run the real app.

## PR 1
**Depends on.** None.
**Files.**
- [ ] app.ts
**Build.**
- [ ] Build the app.
**You see.**
- [ ] The feature works.
**Verify, unit.** ${rule}
- [ ] Run tests.
**Verify, live.** ${rule} Ten lanes on \`${model}\` at the PR head.
${Array.from({ length: 10 }, (_, i) => `- [ ] Lane ${i + 1}. Run the app. Save \`lane-${i + 1}.png\`. Pass when output matches.`).join("\n")}
**Verify, perf.** ${rule}
- [ ] Metric. latency
- [ ] Probe. alternate sides
- [ ] Baseline. trunk
- [ ] Rule. at most 100 ms
**Review gate.** None. No interaction change.
**Merge.**
- [ ] Root merges after verification.

## Close the program
- [ ] Record completion.
## Appendix A Prototype evidence
Evidence lives here.
`;
}

test("plan checker accepts configured models and hourly audits, rejects placeholders and old cadence", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pstack-plan-"));
  try {
    const path = join(dir, "plan.md");
    const check = async source => {
      await writeFile(path, source);
      return spawnSync(process.execPath, [new URL("skills/poteto-mode/scripts/check-plan.mjs", root).pathname, path], { encoding: "utf8" });
    };
    const valid = await check(plan());
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /1 PR sections, 0 problems/);
    const placeholder = await check(plan("<swarm workers model>"));
    assert.equal(placeholder.status, 1);
    assert.match(placeholder.stderr, /concrete configured model/);
    const old = await check(plan().replace("hourly audit", "30-minute audit"));
    assert.equal(old.status, 1);
    assert.match(old.stderr, /hourly audit/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("decision logger initializes empty logs, appends without destroying rows, and escapes cells", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pstack-log-"));
  try {
    const path = join(dir, "decisions.tsv");
    await writeFile(path, "");
    const log = (phase, decision) => {
      const run = spawnSync("bash", [new URL("skills/show-me-your-work/scripts/log.sh", root).pathname, path, phase, decision, "why", "artifact", "open"], { encoding: "utf8" });
      assert.equal(run.status, 0, run.stderr);
    };
    log("start", "=untrusted\tcell\nnext");
    const first = await readFile(path, "utf8");
    assert.equal(first.split("\n")[0], "ts\tphase\tdecision\twhy\tevidence\tresult");
    assert.equal(first.trimEnd().split("\n").length, 2);
    assert.equal(first.trimEnd().split("\n")[1].split("\t")[2], "'=untrusted cell next");
    log("verify", "passed");
    const next = await readFile(path, "utf8");
    assert.ok(next.startsWith(first));
    assert.equal(next.trimEnd().split("\n").length, 3);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("new portable adaptations remain protected and model defaults are normalized", () => {
  for (const path of ["skills/poteto-help/SKILL.md", "skills/correct/SKILL.md", "skills/benchmark-checklist/SKILL.md"]) assert.equal(isProtectedPath(path), true);
  assert.equal(normalizeContent("grok-4.7-xhigh-fast / claude-opus-5-5-max"), "host-configured role/model / host-configured role/model");
});

test("refreshed workflows keep Pi gates, fresh owners, and benchmark evidence", async () => {
  const mode = await load("skills/poteto-mode/SKILL.md");
  assert.match(mode, /fresh session for new work, fix rounds, retries, follow-ups/);
  assert.match(mode, /principle-explain-the-number/);
  const full = await load("skills/poteto-mode/playbooks/autopilot-full.md");
  assert.match(full, /code-ready/);
  assert.match(full, /at least two diff-audit lanes/);
  assert.match(full, /Only the root squash-merges/);
  assert.match(full, /Native Pi has no built-in/);
  const swarm = await load("skills/swarm/SKILL.md");
  assert.match(swarm, /brief names the exact SHAs/);
  assert.match(swarm, /sample count/);
  assert.match(swarm, /respawn that worker once/);
  const help = await load("skills/poteto-help/SKILL.md");
  assert.match(help, /\/skill:setup-pstack/);
  assert.doesNotMatch(help, /add-plugin|Custom Mode keeps it on|docs\/guide\//);
});
