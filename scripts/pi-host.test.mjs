import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import test from "node:test";
import { findPiHost, HOST_PACKAGES } from "./pi-host.mjs";

async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), "pstack-host-")));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function piPackage(directory) {
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "package.json"), JSON.stringify({ name: HOST_PACKAGES[0] }));
  return directory;
}

async function executable(path) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, "#!/bin/sh\nexit 0\n");
  await chmod(path, 0o755);
  return path;
}

test("the checkout never installs its own host packages or pi executable", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8"));
  for (const name of HOST_PACKAGES) {
    assert.equal(manifest.dependencies?.[name], undefined);
    assert.equal(manifest.devDependencies?.[name], undefined);
    assert.equal(manifest.peerDependencies[name], "*");
    assert.equal(manifest.peerDependenciesMeta[name].optional, true);
    assert.equal(lock.packages[`node_modules/${name}`], undefined);
  }
});

test("finds the managed release through a symlinked launcher", async t => {
  const root = await fixture(t);
  const agent = join(root, "agent");
  const launcher = await executable(join(agent, "bin", "pi"));
  const host = await piPackage(join(agent, "install", "releases", "1.4.0", "node_modules", HOST_PACKAGES[0]));
  await writeFile(join(agent, "install", "current-version"), "1.4.0\n");
  const bin = join(root, "bin");
  await mkdir(bin);
  await symlink(launcher, join(bin, "pi"));
  assert.equal(findPiHost({ PATH: bin }), host);
  // Follow the installer's active version, not a version frozen in this repo.
  const updated = await piPackage(join(agent, "install", "releases", "1.5.0", "node_modules", HOST_PACKAGES[0]));
  await writeFile(join(agent, "install", "current-version"), "1.5.0\n");
  assert.equal(findPiHost({ PATH: bin }), updated);
});

test("finds an npm-installed host through its executable symlink", async t => {
  const root = await fixture(t);
  const host = await piPackage(join(root, "node_modules", HOST_PACKAGES[0]));
  const cli = await executable(join(host, "dist", "bundle", "cli.js"));
  const bin = join(root, "bin");
  await mkdir(bin);
  await symlink(cli, join(bin, "pi"));
  assert.equal(findPiHost({ PATH: bin }), host);
  assert.equal(findPiHost({ PI_BIN: join(bin, "pi"), PATH: "" }), host);
  assert.equal(findPiHost({ PI_BIN: "bin/pi" }, root), host);
});

test("does not silently substitute another host when the first launcher is unknown", async t => {
  const root = await fixture(t);
  const first = join(root, "first");
  await executable(join(first, "pi"));
  const host = await piPackage(join(root, "second"));
  await executable(join(host, "pi"));
  assert.throws(() => findPiHost({ PATH: [first, host].join(delimiter) }), /PI_PACKAGE_DIR/);
  assert.equal(findPiHost({ PATH: first, PI_PACKAGE_DIR: host }), host);
});

test("missing hosts and invalid explicit package directories fail actionably", async t => {
  const root = await fixture(t);
  assert.throws(() => findPiHost({ PATH: root }), /Install Pi first/);
  assert.throws(() => findPiHost({ PI_PACKAGE_DIR: root }), /not a Pi package/);
});
