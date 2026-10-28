import { join, resolve } from "node:path";
import ts from "typescript";
import { findPiHost, HOST_PACKAGES } from "./pi-host.mjs";

const configPath = resolve(import.meta.dirname, "../extensions/pstack-router/tsconfig.json");
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, resolve(configPath, ".."));
const host = findPiHost();
const paths = {};
for (const name of HOST_PACKAGES) {
  const result = ts.resolveModuleName(name, join(host, "pstack-typecheck.ts"), parsed.options, ts.sys);
  if (!result.resolvedModule) throw new Error(`Installed Pi does not provide ${name}: ${host}`);
  paths[name] = [result.resolvedModule.resolvedFileName];
}
const program = ts.createProgram(parsed.fileNames, { ...parsed.options, paths });
const diagnostics = [config.error, ...parsed.errors, ...ts.getPreEmitDiagnostics(program)].filter(Boolean);
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: file => file,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  }));
  process.exitCode = 1;
}
