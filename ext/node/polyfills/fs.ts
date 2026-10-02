// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import {
  access,
  accessPromise,
  accessSync,
} from "ext:deno_node/_fs/_fs_access.ts";
import {
  appendFile,
  appendFilePromise,
  appendFileSync,
} from "ext:deno_node/_fs/_fs_appendFile.ts";
import { chmod, chmodPromise, chmodSync } from "ext:deno_node/_fs/_fs_chmod.ts";
import { chown, chownPromise, chownSync } from "ext:deno_node/_fs/_fs_chown.ts";
import { close, closeSync } from "ext:deno_node/_fs/_fs_close.ts";
import * as constants from "ext:deno_node/_fs/_fs_constants.ts";
import {
  copyFile,
  copyFilePromise,
  copyFileSync,
} from "ext:deno_node/_fs/_fs_copy.ts";
import { cp, cpPromise, cpSync } from "ext:deno_node/_fs/_fs_cp.js";
import Dir from "ext:deno_node/_fs/_fs_dir.ts";
import Dirent from "ext:deno_node/_fs/_fs_dirent.ts";
import { exists, existsSync } from "ext:deno_node/_fs/_fs_exists.ts";
import { fdatasync, fdatasyncSync } from "ext:deno_node/_fs/_fs_fdatasync.ts";
import { fstat, fstatPromise, fstatSync } from "ext:deno_node/_fs/_fs_fstat.ts";
import { fsync, fsyncSync } from "ext:deno_node/_fs/_fs_fsync.ts";
import { ftruncate, ftruncateSync } from "ext:deno_node/_fs/_fs_ftruncate.ts";
import { futimes, futimesSync } from "ext:deno_node/_fs/_fs_futimes.ts";
import {
  lchown,
  lchownPromise,
  lchownSync,
} from "ext:deno_node/_fs/_fs_lchown.ts";
import { link, linkPromise, linkSync } from "ext:deno_node/_fs/_fs_link.ts";
import { lstat, lstatPromise, lstatSync } from "ext:deno_node/_fs/_fs_lstat.ts";
import {
  lutimes,
  lutimesPromise,
  lutimesSync,
} from "ext:deno_node/_fs/_fs_lutimes.ts";
import { mkdir, mkdirPromise, mkdirSync } from "ext:deno_node/_fs/_fs_mkdir.ts";
import {
  mkdtemp,
  mkdtempPromise,
  mkdtempSync,
} from "ext:deno_node/_fs/_fs_mkdtemp.ts";
import { open, openPromise, openSync } from "ext:deno_node/_fs/_fs_open.ts";
import {
  opendir,
  opendirPromise,
  opendirSync,
} from "ext:deno_node/_fs/_fs_opendir.ts";
import { read, readSync } from "ext:deno_node/_fs/_fs_read.ts";
import {
  readdir,
  readdirPromise,
  readdirSync,
} from "ext:deno_node/_fs/_fs_readdir.ts";
import {
  readFile,
  readFilePromise,
  readFileSync,
} from "ext:deno_node/_fs/_fs_readFile.ts";
import {
  readlink,
  readlinkPromise,
  readlinkSync,
} from "ext:deno_node/_fs/_fs_readlink.ts";
import {
  realpath,
  realpathPromise,
  realpathSync,
} from "ext:deno_node/_fs/_fs_realpath.ts";
import {
  rename,
  renamePromise,
  renameSync,
} from "ext:deno_node/_fs/_fs_rename.ts";
import { rmdir, rmdirPromise, rmdirSync } from "ext:deno_node/_fs/_fs_rmdir.ts";
import { rm, rmPromise, rmSync } from "ext:deno_node/_fs/_fs_rm.ts";
import {
  stat,
  statPromise,
  Stats,
  statSync,
} from "ext:deno_node/_fs/_fs_stat.ts";
import {
  statfs,
  statfsPromise,
  statfsSync,
} from "ext:deno_node/_fs/_fs_statfs.js";
import {
  symlink,
  symlinkPromise,
  symlinkSync,
} from "ext:deno_node/_fs/_fs_symlink.ts";
import {
  truncate,
  truncatePromise,
  truncateSync,
} from "ext:deno_node/_fs/_fs_truncate.ts";
import {
  unlink,
  unlinkPromise,
  unlinkSync,
} from "ext:deno_node/_fs/_fs_unlink.ts";
import {
  utimes,
  utimesPromise,
  utimesSync,
} from "ext:deno_node/_fs/_fs_utimes.ts";
import {
  unwatchFile,
  watch,
  watchFile,
  watchPromise,
} from "ext:deno_node/_fs/_fs_watch.ts";
// @deno-types="./_fs/_fs_write.d.ts"
import { write, writeSync } from "ext:deno_node/_fs/_fs_write.mjs";
// @deno-types="./_fs/_fs_writev.d.ts"
import { writev, writevSync } from "ext:deno_node/_fs/_fs_writev.mjs";
import { readv, readvSync } from "ext:deno_node/_fs/_fs_readv.ts";
import {
  writeFile,
  writeFilePromise,
  writeFileSync,
} from "ext:deno_node/_fs/_fs_writeFile.ts";
// @deno-types="./internal/fs/streams.d.ts"
import {
  createReadStream,
  createWriteStream,
  ReadStream,
  WriteStream,
} from "ext:deno_node/internal/fs/streams.mjs";
import { toUnixTimestamp as _toUnixTimestamp } from "ext:deno_node/internal/fs/utils.mjs";

const {
  F_OK,
  R_OK,
  W_OK,
  X_OK,
  O_RDONLY,
  O_WRONLY,
  O_RDWR,
  O_NOCTTY,
  O_TRUNC,
  O_APPEND,
  O_DIRECTORY,
  O_NOFOLLOW,
  O_SYNC,
  O_DSYNC,
  O_SYMLINK,
  O_NONBLOCK,
  O_CREAT,
  O_EXCL,
} = constants;

const promises = {
  access: accessPromise,
  constants,
  copyFile: copyFilePromise,
  cp: cpPromise,
  open: openPromise,
  opendir: opendirPromise,
  rename: renamePromise,
  truncate: truncatePromise,
  rm: rmPromise,
  rmdir: rmdirPromise,
  mkdir: mkdirPromise,
  readdir: readdirPromise,
  readlink: readlinkPromise,
  symlink: symlinkPromise,
  lstat: lstatPromise,
  stat: statPromise,
  statfs: statfsPromise,
  fstat: fstatPromise,
  link: linkPromise,
  unlink: unlinkPromise,
  chmod: chmodPromise,
  // lchmod: promisify(lchmod),
  lchown: lchownPromise,
  chown: chownPromise,
  utimes: utimesPromise,
  lutimes: lutimesPromise,
  realpath: realpathPromise,
  mkdtemp: mkdtempPromise,
  writeFile: writeFilePromise,
  appendFile: appendFilePromise,
  readFile: readFilePromise,
  watch: watchPromise,
};

export default {
  access,
  accessSync,
  appendFile,
  appendFileSync,
  chmod,
  chmodSync,
  chown,
  chownSync,
  close,
  closeSync,
  constants,
  copyFile,
  copyFileSync,
  cp,
  cpSync,
  createReadStream,
  createWriteStream,
  Dir,
  Dirent,
  exists,
  existsSync,
  F_OK,
  fdatasync,
  fdatasyncSync,
  fstat,
  fstatSync,
  fsync,
  fsyncSync,
  ftruncate,
  ftruncateSync,
  futimes,
  futimesSync,
  lchown,
  lchownSync,
  link,
  linkSync,
  lstat,
  lstatSync,
  lutimes,
  lutimesSync,
  mkdir,
  mkdirSync,
  mkdtemp,
  mkdtempSync,
  O_APPEND,
  O_CREAT,
  O_DIRECTORY,
  O_DSYNC,
  O_EXCL,
  O_NOCTTY,
  O_NOFOLLOW,
  O_NONBLOCK,
  O_RDONLY,
  O_RDWR,
  O_SYMLINK,
  O_SYNC,
  O_TRUNC,
  O_WRONLY,
  open,
  openSync,
  opendir,
  opendirSync,
  read,
  readSync,
  promises,
  R_OK,
  readdir,
  readdirSync,
  readFile,
  readFileSync,
  readlink,
  readlinkSync,
  ReadStream,
  realpath,
  realpathSync,
  readv,
  readvSync,
  rename,
  renameSync,
  rmdir,
  rmdirSync,
  rm,
  rmSync,
  stat,
  Stats,
  statSync,
  statfs,
  statfsSync,
  symlink,
  symlinkSync,
  truncate,
  truncateSync,
  unlink,
  unlinkSync,
  unwatchFile,
  utimes,
  utimesSync,
  W_OK,
  watch,
  watchFile,
  write,
  writeFile,
  writev,
  writevSync,
  writeFileSync,
  WriteStream,
  writeSync,
  X_OK,
  // For tests
  _toUnixTimestamp,
};

export {
  // For tests
  _toUnixTimestamp,
  access,
  accessSync,
  appendFile,
  appendFileSync,
  chmod,
  chmodSync,
  chown,
  chownSync,
  close,
  closeSync,
  constants,
  copyFile,
  copyFileSync,
  cp,
  cpSync,
  createReadStream,
  createWriteStream,
  Dir,
  Dirent,
  exists,
  existsSync,
  F_OK,
  fdatasync,
  fdatasyncSync,
  fstat,
  fstatSync,
  fsync,
  fsyncSync,
  ftruncate,
  ftruncateSync,
  futimes,
  futimesSync,
  link,
  linkSync,
  lstat,
  lstatSync,
  lutimes,
  lutimesSync,
  mkdir,
  mkdirSync,
  mkdtemp,
  mkdtempSync,
  O_APPEND,
  O_CREAT,
  O_DIRECTORY,
  O_DSYNC,
  O_EXCL,
  O_NOCTTY,
  O_NOFOLLOW,
  O_NONBLOCK,
  O_RDONLY,
  O_RDWR,
  O_SYMLINK,
  O_SYNC,
  O_TRUNC,
  O_WRONLY,
  open,
  opendir,
  opendirSync,
  openSync,
  promises,
  R_OK,
  read,
  readdir,
  readdirSync,
  readFile,
  readFileSync,
  readlink,
  readlinkSync,
  ReadStream,
  readSync,
  readv,
  readvSync,
  realpath,
  realpathSync,
  rename,
  renameSync,
  rm,
  rmdir,
  rmdirSync,
  rmSync,
  stat,
  statfs,
  statfsSync,
  Stats,
  statSync,
  symlink,
  symlinkSync,
  truncate,
  truncateSync,
  unlink,
  unlinkSync,
  unwatchFile,
  utimes,
  utimesSync,
  W_OK,
  watch,
  watchFile,
  write,
  writeFile,
  writeFileSync,
  WriteStream,
  writeSync,
  writev,
  writevSync,
  X_OK,
};
