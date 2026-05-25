#!/usr/bin/env node

const { execFileSync } = require("child_process");
const packageInfo = require("../package.json");

const tag = `v${packageInfo.version}`;

function git(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function runGit(args) {
  execFileSync("git", args, { stdio: "inherit" });
}

const status = git(["status", "--porcelain"]);
if (status) {
  console.error("Working tree must be clean before creating the initial release tag.");
  process.exit(1);
}

if (git(["tag", "--list", tag])) {
  console.log(`${tag} already exists.`);
  process.exit(0);
}

runGit(["tag", "-a", tag, "-m", `${packageInfo.name} ${tag}`]);
runGit(["push", "origin", tag]);
console.log(`Created and pushed ${tag}.`);
