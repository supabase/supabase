import * as net from "ext:deno_net/01_net.js";
import * as tls from "ext:deno_net/02_tls.js";
import * as timers from "ext:deno_web/02_timers.js";
import * as fs from "ext:deno_fs/30_fs.js";
import { createHttpClient } from "ext:deno_fetch/22_http_client.js";
import { osCalls } from "ext:os/os.js";
import * as io from "ext:deno_io/12_io.js";
import * as permissions from "ext:runtime/permissions.js";
import { errors } from "ext:runtime/errors.js";
import { serve, serveHttp, upgradeWebSocket } from "ext:runtime/http.js";

const osCallsVars = {
  gid: osCalls.gid,
  uid: osCalls.uid,
  hostname: osCalls.hostname,
  loadavg: osCalls.loadAvg,
  osUptime: osCalls.osUptime,
  osRelease: osCalls.osRelease,
  systemMemoryInfo: osCalls.systemMemoryInfo,
  consoleSize: osCalls.consoleSize,
  Command: osCalls.command,
  version: osCalls.version,
  networkInterfaces: osCalls.networkInterfaces,
  execPath: () => "/bin/deno",
};

const fsVars = {
  writeFileSync: fs.writeFileSync,
  writeFile: fs.writeFile,
  writeTextFileSync: fs.writeTextFileSync,
  writeTextFile: fs.writeTextFile,
  readTextFile: fs.readTextFile,
  readTextFileSync: fs.readTextFileSync,
  readFile: fs.readFile,
  readFileSync: fs.readFileSync,
  chmodSync: fs.chmodSync,
  chmod: fs.chmod,
  chown: fs.chown,
  chownSync: fs.chownSync,
  copyFileSync: fs.copyFileSync,
  cwd: fs.cwd,
  makeTempDirSync: fs.makeTempDirSync,
  makeTempDir: fs.makeTempDir,
  makeTempFileSync: fs.makeTempFileSync,
  makeTempFile: fs.makeTempFile,
  mkdirSync: fs.mkdirSync,
  mkdir: fs.mkdir,
  chdir: fs.chdir,
  copyFile: fs.copyFile,
  readDirSync: fs.readDirSync,
  readDir: fs.readDir,
  readLinkSync: fs.readLinkSync,
  readLink: fs.readLink,
  realPathSync: fs.realPathSync,
  realPath: fs.realPath,
  removeSync: fs.removeSync,
  remove: fs.remove,
  renameSync: fs.renameSync,
  rename: fs.rename,
  statSync: fs.statSync,
  lstatSync: fs.lstatSync,
  stat: fs.stat,
  lstat: fs.lstat,
  truncateSync: fs.truncateSync,
  truncate: fs.truncate,
  ftruncateSync: fs.ftruncateSync,
  ftruncate: fs.ftruncate,
  futime: fs.futime,
  futimeSync: fs.futimeSync,
  File: fs.File,
  FsFile: fs.FsFile,
  open: fs.open,
  openSync: fs.openSync,
  create: fs.create,
  createSync: fs.createSync,
  seek: fs.seek,
  seekSync: fs.seekSync,
  fstatSync: fs.fstatSync,
  fstat: fs.fstat,
  fsyncSync: fs.fsyncSync,
  fsync: fs.fsync,
  fdatasyncSync: fs.fdatasyncSync,
  fdatasync: fs.fdatasync,
  symlink: fs.symlink,
  symlinkSync: fs.symlinkSync,
  link: fs.link,
  linkSync: fs.linkSync,
  utime: fs.utime,
  utimeSync: fs.utimeSync,
};

const ioVars = {
  stdout: io.stdout,
  stderr: io.stderr,
  stdin: io.stdin,
};

const denoOverrides = {
  createHttpClient,
  serve,
  serveHttp,
  upgradeWebSocket,
  listen: net.listen,
  connect: net.connect,
  connectTls: tls.connectTls,
  startTls: tls.startTls,
  resolveDns: net.resolveDns,
  permissions: permissions.permissions,
  Permissions: permissions.Permissions,
  PermissionStatus: permissions.PermissionStatus,
  errors: errors,
  refTimer: timers.refTimer,
  unrefTimer: timers.unrefTimer,
  isatty: (_arg) => false,
  ...ioVars,
  ...fsVars,
  ...osCallsVars,
};

export { denoOverrides, fsVars, ioVars, osCallsVars };
