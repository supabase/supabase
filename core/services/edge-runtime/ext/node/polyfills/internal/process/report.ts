// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { primordials } from "ext:core/mod.js";
const {
  Error,
  StringPrototypeToUpperCase,
  StringPrototypeCharAt,
  StringPrototypeSlice,
  Date,
  DatePrototypeGetTime,
} = primordials;

import { arch, versions } from "ext:deno_node/_process/process.ts";
import { cpus, hostname, networkInterfaces } from "node:os";

function writeReport(_filename: string, _err: typeof Error) {
  return "";
}

const todoUndefined = undefined;

function getReport(_err: typeof Error) {
  const dumpEventTime = new Date();
  return {
    header: {
      reportVersion: 3,
      event: "JavaScript API",
      trigger: "GetReport",
      filename: report.filename, // assumption!
      dumpEventTime,
      dumpEventTimeStamp: DatePrototypeGetTime(dumpEventTime),
      processId: Deno.pid, // I am not sure if it should be Deno.pid or Deno.ppid
      threadId: 0,
      cwd: Deno.cwd(),
      commandLine: ["node"],
      nodejsVersion: `v${versions.node}`,
      glibcVersionRuntime: "2.38",
      glibcVersionCompiler: "2.38",
      wordSize: 64,
      arch: arch(),
      platform: Deno.build.os,
      componentVersions: versions,
      release: {
        name: "node",
        headersUrl:
          "https://nodejs.org/download/release/v21.2.0/node-v21.2.0-headers.tar.gz",
        sourceUrl:
          "https://nodejs.org/download/release/v21.2.0/node-v21.2.0.tar.gz",
      },
      osName:
        StringPrototypeToUpperCase(StringPrototypeCharAt(Deno.build.os, 0)) +
        StringPrototypeSlice(Deno.build.os, 1),
      osRelease: todoUndefined,
      osVersion: todoUndefined,
      osMachine: Deno.build.arch,
      cpus: cpus(),
      networkInterfaces: networkInterfaces(),
      host: hostname(),
    },
    javascriptStack: todoUndefined,
    javascriptHeap: todoUndefined,
    nativeStack: todoUndefined,
    resourceUsage: todoUndefined,
    uvthreadResourceUsage: todoUndefined,
    libuv: todoUndefined,
    workers: [],
    environmentVariables: todoUndefined,
    userLimits: todoUndefined,
    sharedObjects: todoUndefined,
  };
}

// https://nodejs.org/api/process.html#processreport
export const report = {
  compact: false,
  directory: "",
  filename: "",
  getReport,
  reportOnFatalError: false,
  reportOnSignal: false,
  reportOnUncaughtException: false,
  signal: "SIGUSR2",
  writeReport,
};
