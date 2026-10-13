import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { isProtectedPath, normalizeContent } from "./sync-upstream.mjs";
import { forbiddenBindingsIn } from "./portability-bindings.mjs";

const root = new URL("../", import.meta.url);
const load = path => readFile(new URL(path, root), "utf8");
const audit = new URL("skills/poteto-mode/scripts/worktree-audit.sh", root).pathname;

async function fixture() {
  const directory = await realpath(await mkdtemp(join(tmpdir(), "pstack-audit-")));
  const repo = join(directory, "repo with spaces");
  const remote = join(directory, "remote.git");
  const home = join(directory, "home");
  const bin = join(directory, "bin");
  await mkdir(home);
  await mkdir(bin);
  await writeFile(join(bin, "gh"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });
  const env = { ...process.env, HOME: home, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", PATH: `${bin}:${process.env.PATH}` };
  const git = (...args) => execFileSync("git", ["-C", repo, ...args], { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  execFileSync("git", ["init", "--bare", remote], { env, stdio: "ignore" });
  execFileSync("git", ["init", "--initial-branch=trunk", repo], { env, stdio: "ignore" });
  git("config", "user.name", "Fixture");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "core.hooksPath", join(directory, "no-hooks"));
  await writeFile(join(repo, "tracked.txt"), "baseline\n");
  git("add", "tracked.txt");
  git("commit", "-m", "fixture");
  git("remote", "add", "origin", remote);
  git("push", "origin", "trunk");
  git("symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/trunk");
  const worktree = name => {
    const path = join(directory, name);
    git("worktree", "add", "-b", name.replaceAll(" ", "-"), path);
    return path;
  };
  const run = (...args) => spawnSync("bash", [audit, ...args, repo], { env, encoding: "utf8" });
  return { directory, repo, git, run, worktree, env };
}

function rows(stdout) {
  const lines = stdout.trim().split("\n");
  const header = lines[1].split("\t");
  return lines.slice(2).map(line => Object.fromEntries(line.split("\t").map((value, i) => [header[i], value])));
}

test("worktree audit follows the remote default and preserves spaced paths, locks, and dirty holds", async () => {
  const f = await fixture();
  try {
    const safe = f.worktree("safe tree");
    const locked = f.worktree("locked tree");
    f.git("worktree", "lock", "--reason", "active session", locked);
    const wip = f.worktree("wip tree");
    await writeFile(join(wip, "tracked.txt"), "changed\n");
    const scratch = f.worktree("scratch tree");
    await writeFile(join(scratch, "untracked.txt"), "not disposable\n");
    const unmerged = f.worktree("unmerged tree");
    execFileSync("git", ["-C", unmerged, "commit", "--allow-empty", "-m", "unmerged"], { env: f.env, stdio: "ignore" });
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^# base: origin\/trunk\n/);
    const byPath = new Map(rows(result.stdout).map(row => [row.WORKTREE, row]));
    assert.equal(byPath.size, 5);
    assert.equal(byPath.get(safe).BUCKET, "safe");
    assert.equal(byPath.get(locked).BUCKET, "hold-locked", `${JSON.stringify(byPath.get(locked))}\n${f.git("worktree", "list", "--porcelain")}`);
    assert.equal(byPath.get(locked).LOCKED, "active session");
    assert.equal(byPath.get(wip).BUCKET, "hold-wip");
    assert.equal(byPath.get(scratch).DIRTY, "scratch:1");
    assert.equal(byPath.get(unmerged).MERGED, "no");
    assert.equal(byPath.get(unmerged).BUCKET, "review");
    assert.equal(await readFile(join(scratch, "untracked.txt"), "utf8"), "not disposable\n");
    assert.equal(await readFile(join(wip, "tracked.txt"), "utf8"), "changed\n");
  } finally { await rm(f.directory, { recursive: true, force: true }); }
});

test("worktree audit fetches an explicit previously unfetched PR base", async () => {
  const f = await fixture();
  try {
    f.git("switch", "-c", "integration");
    f.git("commit", "--allow-empty", "-m", "integration");
    f.git("push", "origin", "integration");
    const wt = f.worktree("integration tree");
    f.git("switch", "trunk");
    f.git("update-ref", "-d", "refs/remotes/origin/integration");
    const result = f.run("--base", "origin/integration");
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^# base: origin\/integration\n/);
    assert.equal(rows(result.stdout).find(row => row.WORKTREE === wt).MERGED, "YES");
    assert.equal(f.git("rev-parse", "origin/integration"), f.git("rev-parse", "integration"));
    assert.equal(rows(f.run().stdout).find(row => row.WORKTREE === wt).MERGED, "no");
  } finally { await rm(f.directory, { recursive: true, force: true }); }
});

test("worktree audit rejects invalid or missing bases and malformed arguments", async () => {
  const f = await fixture();
  try {
    assert.equal(f.run("--unknown").status, 2);
    const missingArgument = spawnSync("bash", [audit, "--base"], { encoding: "utf8" });
    assert.equal(missingArgument.status, 2);
    const invalid = f.run("-b", "not-a-ref");
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /base ref not found/);
    f.git("symbolic-ref", "--delete", "refs/remotes/origin/HEAD");
    const missing = f.run();
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /no base ref/);
    f.git("update-ref", "refs/remotes/origin/main", "HEAD");
    assert.match(f.run().stdout, /^# base: origin\/main\n/);
    f.git("update-ref", "-d", "refs/remotes/origin/main");
    f.git("update-ref", "refs/remotes/origin/master", "HEAD");
    assert.match(f.run().stdout, /^# base: origin\/master\n/);
  } finally { await rm(f.directory, { recursive: true, force: true }); }
});

test("new skills and help references retain Pi adaptations across future syncs", async () => {
  for (const path of [
    "skills/ketchup/SKILL.md", "skills/in-your-own-words/SKILL.md",
    "skills/poteto-help/references/prompting.md", "skills/poteto-help/references/recipes.md",
  ]) assert.equal(isProtectedPath(path), true, path);
  const help = await load("skills/poteto-help/SKILL.md");
  assert.match(help, /disable-model-invocation: true/);
  assert.match(help, /at most once per chat/);
  assert.match(help, /delegation remains unconfigured/);
  assert.match(help, /references\/prompting\.md/);
  assert.match(help, /references\/recipes\.md/);
  const ketchup = await load("skills/ketchup/SKILL.md");
  assert.match(ketchup, /read-only/);
  assert.match(ketchup, /under 250 words/);
  assert.match(ketchup, /outside the repository/);
  assert.doesNotMatch(ketchup, /\/visualize/);
  assert.match(await load("skills/poteto-help/references/recipes.md"), /\/skill:ketchup/);
  assert.match(await load("skills/poteto-help/references/prompting.md"), /Native Pi has no built-in/);
});

test("mode briefs resolve hidden packaged skills without replacing configured Pi policy", async () => {
  const mode = await load("skills/poteto-mode/SKILL.md");
  assert.match(mode, /absolute path in every `poteto-agent` brief/);
  assert.match(mode, /Never spawn a `poteto-agent` to run the whole mode/);
  assert.equal((mode.match(/\*\*Explain the Number\*\*/g) ?? []).length, 1);
  assert.match(await load("agents/poteto-agent.md"), /Never guess a user skill directory/);
  const verification = await load("skills/create-verification-skill/SKILL.md");
  assert.match(verification, /usable state from an empty data directory/);
  assert.match(verification, /Never weaken the journey/);
  assert.match(verification, /Those steps stay unverified/);
  assert.equal(normalizeContent("claude-opus-5-5-xhigh"), "host-configured role/model");
  assert.deepEqual(forbiddenBindingsIn("claude-opus-5-5-xhigh"), ["claude-opus-5-5-xhigh"]);
});
