import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("../extensions/pstack-router/index.ts", import.meta.url), "utf8");
const declaration = source.match(/function resolveConfigPath\(cwd: string\): string \{[\s\S]*?\n\}/u)?.[0];
assert.ok(declaration);

function resolvePath({ override, projectExists = false }) {
  return runInNewContext(
    `${declaration.replace("cwd: string", "cwd").replace("): string", ")")}\nresolveConfigPath("/project")`,
    { process: { env: { PSTACK_CONFIG: override } }, join, resolve, isAbsolute,
      existsSync: (path) => projectExists && path === "/project/.pstack/config.md",
      homedir: () => "/operator" },
  );
}

test("uses the operator config when the project has no config", () => {
  assert.equal(resolvePath({}), "/operator/.pstack/config.md");
});

test("preserves an explicit project config", () => {
  assert.equal(resolvePath({ projectExists: true }), "/project/.pstack/config.md");
});

test("honors absolute and relative environment overrides", () => {
  assert.equal(resolvePath({ override: "/custom/config.md", projectExists: true }), "/custom/config.md");
  assert.equal(resolvePath({ override: "custom/config.md" }), "/project/custom/config.md");
});
