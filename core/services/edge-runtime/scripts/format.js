#!/usr/bin/env -S deno run --allow-write --allow-read --allow-run --allow-net
// Copyright 2018-2025 the Deno authors. MIT license.

import { dirname, fromFileUrl, join } from "jsr:@std/path";

const ROOT_PATH = dirname(dirname(fromFileUrl(import.meta.url)));

const subcommand = Deno.args.includes("--check") ? "check" : "fmt";
const configFile = join(ROOT_PATH, ".dprint.json");
const cmd = new Deno.Command("deno", {
  args: [
    "run",
    "-A",
    "--no-config",
    "npm:dprint@0.47.2",
    subcommand,
    "--config=" + configFile,
  ],
  cwd: ROOT_PATH,
  stdout: "inherit",
  stderr: "inherit",
});

const { code } = await cmd.output();
Deno.exit(code);
