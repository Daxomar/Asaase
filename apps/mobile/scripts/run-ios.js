#!/usr/bin/env node
/**
 * Build/install via expo run:ios, then keep Metro alive.
 * Non-interactive shells exit after run:ios and kill the bundler — app then
 * shows "No script URL provided". Chaining expo start --dev-client fixes that.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");

const run = spawnSync("npx", ["expo", "run:ios"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

if (run.status !== 0) {
  process.exit(run.status ?? 1);
}

// ponytail: run:ios exits after launch; start keeps Metro up for reloads
spawnSync("npx", ["expo", "start", "--dev-client"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
