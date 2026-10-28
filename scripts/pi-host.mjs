import { accessSync, constants, readFileSync, realpathSync } from "node:fs";
import { delimiter, dirname, isAbsolute, join, resolve } from "node:path";

export const HOST_PACKAGES = ["@earendil-works/pi-coding-agent", "@earendil-works/pi-ai", "typebox"];
const packageName = HOST_PACKAGES[0];

function isPiPackage(directory) {
  try {
    return JSON.parse(readFileSync(join(directory, "package.json"), "utf8")).name === packageName;
  } catch {
    return false;
  }
}

// Resolve the selected launcher, not a second Pi installed in this checkout.
// PI_PACKAGE_DIR supports custom wrappers and nonstandard installation layouts.
export function findPiHost(env = process.env, cwd = process.cwd()) {
  if (env.PI_PACKAGE_DIR) {
    const directory = resolve(cwd, env.PI_PACKAGE_DIR);
    if (isPiPackage(directory)) return directory;
    throw new Error(`PI_PACKAGE_DIR is not a Pi package: ${directory}`);
  }
  const binary = env.PI_BIN || "pi";
  const candidates = isAbsolute(binary) || binary.includes("/") || binary.includes("\\")
    ? [resolve(cwd, binary)]
    : (env.PATH || "").split(delimiter).map(directory => resolve(cwd, directory, binary));
  let executable;
  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      executable = realpathSync(candidate);
      break;
    } catch { /* Try the next PATH entry. */ }
  }
  if (executable) {
    // npm installs expose a symlink into the package itself.
    for (let directory = dirname(executable); ; directory = dirname(directory)) {
      if (isPiPackage(directory)) return directory;
      if (directory === dirname(directory)) break;
    }
    // The managed launcher lives at <agent-dir>/bin/pi (possibly symlinked).
    const install = join(dirname(dirname(executable)), "install");
    try {
      const version = readFileSync(join(install, "current-version"), "utf8").trim();
      if (!/^[a-zA-Z0-9_+.-]+$/.test(version) || version === "." || version === "..") {
        throw new Error("Invalid managed Pi version");
      }
      const directory = join(install, "releases", version, "node_modules", packageName);
      if (isPiPackage(directory)) return directory;
    } catch { /* Report a single actionable error below. */ }
  }
  throw new Error(`Cannot locate the installed Pi package for ${binary}. Install Pi first, or set PI_BIN to its launcher / PI_PACKAGE_DIR to its package directory.`);
}
