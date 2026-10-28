// Native Node tests need the same host-provided imports as Pi's extension loader.
import { registerHooks } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { findPiHost, HOST_PACKAGES } from "./pi-host.mjs";

const parentURL = pathToFileURL(join(findPiHost(), "package.json")).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier, HOST_PACKAGES.includes(specifier) ? { ...context, parentURL } : context);
  },
});
