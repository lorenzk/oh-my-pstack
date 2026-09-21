#!/usr/bin/env node
// Registration-only smoke test: no prompts, model calls, or child launches.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const directory = await mkdtemp(join(tmpdir(), "pstack-pi-probe-"));
const helper = join(directory, "probe.ts");
await writeFile(helper, `export default function (pi) {
  pi.registerCommand("pstack-registration-probe", {
    handler: async (_args, ctx) => ctx.ui.notify(JSON.stringify({
      tools: pi.getAllTools().map(tool => tool.name).filter(name => name.startsWith("pstack_"))
    }), "info")
  });
}`);
const child = spawn(process.env.PI_BIN ?? "pi", [
  "--mode", "rpc", "--no-session", "--no-extensions", "--no-skills",
  "--no-context-files", "--no-prompt-templates", "--no-themes", "--no-approve",
  "-e", root, "-e", helper,
], { cwd: directory, env: { ...process.env, PI_CODING_AGENT_DIR: directory, PI_OFFLINE: "1" }, stdio: ["pipe", "pipe", "pipe"] });
let buffer = "";
let stderr = "";
child.stdout.setEncoding("utf8");
child.stderr.setEncoding("utf8");
child.stderr.on("data", chunk => { stderr += chunk; });
const exit = new Promise(resolve => {
  child.once("exit", resolve);
  child.once("error", resolve);
});
let timer;
try {
  await new Promise((resolveProbe, reject) => {
    timer = setTimeout(() => reject(new Error(`Pi registration probe timed out. ${stderr}`)), 30_000);
    child.once("error", reject);
    child.once("exit", code => reject(new Error(`Pi exited before registration verification (${code}). ${stderr}`)));
    child.stdout.on("data", chunk => {
      buffer += chunk;
      let newline;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === "extension_error") throw new Error(JSON.stringify(event));
          if (event.type === "response" && event.id === "commands") {
            assert.equal(event.success, true);
            const names = event.data.commands.map(command => command.name);
            for (const name of ["pstack-doctor", "pstack-routes", "pstack-registration-probe"]) assert.ok(names.includes(name), `missing ${name}`);
            // Only send a known extension command, never a model prompt fallback.
            child.stdin.write(JSON.stringify({ type: "prompt", id: "probe", message: "/pstack-registration-probe" }) + "\n");
          }
          if (event.type === "extension_ui_request" && event.method === "notify") {
            const report = JSON.parse(event.message);
            assert.deepEqual(report.tools.sort(), ["pstack_followup", "pstack_launch", "pstack_panel", "pstack_status"]);
            clearTimeout(timer);
            resolveProbe();
          }
        } catch (error) {
          clearTimeout(timer);
          reject(error);
        }
      }
    });
    child.stdin.write(JSON.stringify({ type: "get_commands", id: "commands" }) + "\n");
  });
  console.log("Pi registered all four pstack tools and both commands without model calls.");
} finally {
  clearTimeout(timer);
  child.kill("SIGTERM");
  const force = setTimeout(() => child.kill("SIGKILL"), 5_000);
  await exit;
  clearTimeout(force);
  await rm(directory, { recursive: true, force: true });
}
