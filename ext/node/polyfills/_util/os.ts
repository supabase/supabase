// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { op_node_build_os } from "ext:core/ops";

export type OSType =
  | "windows"
  | "linux"
  | "android"
  | "darwin"
  | "freebsd"
  | "openbsd";

export const osType: OSType = op_node_build_os();

export const isWindows = osType === "windows";
export const isLinux = osType === "linux" || osType === "android";
