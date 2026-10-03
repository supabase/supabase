// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

"use strict";

import { primordials } from "ext:core/mod.js";
const { DatePrototypeGetTime } = primordials;
import { Buffer } from "node:buffer";
import {
  ERR_FS_EISDIR,
  ERR_FS_INVALID_SYMLINK_TYPE,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
  ERR_OUT_OF_RANGE,
  hideStackFrames,
  uvException,
} from "ext:deno_node/internal/errors.ts";

import {
  isArrayBufferView,
  isBigUint64Array,
  isDate,
  isUint8Array,
} from "ext:deno_node/internal/util/types.ts";
import { once } from "ext:deno_node/internal/util.mjs";
import { toPathIfFileURL } from "ext:deno_node/internal/url.ts";
import {
  validateAbortSignal,
  validateBoolean,
  validateFunction,
  validateInt32,
  validateInteger,
  validateObject,
  validateUint32,
} from "ext:deno_node/internal/validators.mjs";
import pathModule from "node:path";
const kType = Symbol("type");
const kStats = Symbol("stats");
import assert from "ext:deno_node/internal/assert.mjs";
import { lstat, lstatSync } from "ext:deno_node/_fs/_fs_lstat.ts";
import { stat, statSync } from "ext:deno_node/_fs/_fs_stat.ts";
import { isWindows } from "ext:deno_node/_util/os.ts";
import process from "node:process";

import {
  fs as fsConstants,
  os as osConstants,
} from "ext:deno_node/internal_binding/constants.ts";
const {
  F_OK = 0,
  W_OK = 0,
  R_OK = 0,
  X_OK = 0,
  COPYFILE_EXCL,
  COPYFILE_FICLONE,
  COPYFILE_FICLONE_FORCE,
  O_APPEND,
  O_CREAT,
  O_EXCL,
  O_RDONLY,
  O_RDWR,
  O_SYNC,
  O_TRUNC,
  O_WRONLY,
  S_IFBLK,
  S_IFCHR,
  S_IFDIR,
  S_IFIFO,
  S_IFLNK,
  S_IFMT,
  S_IFREG,
  S_IFSOCK,
  UV_FS_SYMLINK_DIR,
  UV_FS_SYMLINK_JUNCTION,
  UV_DIRENT_UNKNOWN,
  UV_DIRENT_FILE,
  UV_DIRENT_DIR,
  UV_DIRENT_LINK,
  UV_DIRENT_FIFO,
  UV_DIRENT_SOCKET,
  UV_DIRENT_CHAR,
  UV_DIRENT_BLOCK,
} = fsConstants;

// The access modes can be any of F_OK, R_OK, W_OK or X_OK. Some might not be
// available on specific systems. They can be used in combination as well
// (F_OK | R_OK | W_OK | X_OK).
const kMinimumAccessMode = Math.min(F_OK, W_OK, R_OK, X_OK);
const kMaximumAccessMode = F_OK | W_OK | R_OK | X_OK;

const kDefaultCopyMode = 0;
// The copy modes can be any of COPYFILE_EXCL, COPYFILE_FICLONE or
// COPYFILE_FICLONE_FORCE. They can be used in combination as well
// (COPYFILE_EXCL | COPYFILE_FICLONE | COPYFILE_FICLONE_FORCE).
const kMinimumCopyMode = Math.min(
  kDefaultCopyMode,
  COPYFILE_EXCL,
  COPYFILE_FICLONE,
  COPYFILE_FICLONE_FORCE,
);
const kMaximumCopyMode = COPYFILE_EXCL |
  COPYFILE_FICLONE |
  COPYFILE_FICLONE_FORCE;

// Most platforms don't allow reads or writes >= 2 GB.
// See https://github.com/libuv/libuv/pull/1501.
const kIoMaxLength = 2 ** 31 - 1;

// Use 64kb in case the file type is not a regular file and thus do not know the
// actual file size. Increasing the value further results in more frequent over
// allocation for small files and consumes CPU time and memory that should be
// used else wise.
// Use up to 512kb per read otherwise to partition reading big files to prevent
// blocking other threads in case the available threads are all in use.
const kReadFileUnknownBufferLength = 64 * 1024;
const kReadFileBufferLength = 512 * 1024;

const kWriteFileMaxChunkSize = 512 * 1024;

export const kMaxUserId = 2 ** 32 - 1;

export function assertEncoding(encoding) {
  if (encoding && !Buffer.isEncoding(encoding)) {
    const reason = "is invalid encoding";
    throw new ERR_INVALID_ARG_VALUE(encoding, "encoding", reason);
  }
}

export class Dirent {
  constructor(name, type) {
    this.name = name;
    this[kType] = type;
  }

  isDirectory() {
    return this[kType] === UV_DIRENT_DIR;
  }

  isFile() {
    return this[kType] === UV_DIRENT_FILE;
  }

  isBlockDevice() {
    return this[kType] === UV_DIRENT_BLOCK;
  }

  isCharacterDevice() {
    return this[kType] === UV_DIRENT_CHAR;
  }

  isSymbolicLink() {
    return this[kType] === UV_DIRENT_LINK;
  }

  isFIFO() {
    return this[kType] === UV_DIRENT_FIFO;
  }

  isSocket() {
    return this[kType] === UV_DIRENT_SOCKET;
  }
}

class DirentFromStats extends Dirent {
  constructor(name, stats) {
    super(name, null);
    this[kStats] = stats;
  }
}

for (const name of Reflect.ownKeys(Dirent.prototype)) {
  if (name === "constructor") {
    continue;
  }
  DirentFromStats.prototype[name] = function () {
    return this[kStats][name]();
  };
}

export function copyObject(source) {
  const target = {};
  for (const key in source) {
    target[key] = source[key];
  }
  return target;
}

const bufferSep = Buffer.from(pathModule.sep);

function join(path, name) {
  if (
    (typeof path === "string" || isUint8Array(path)) &&
    name === undefined
  ) {
    return path;
  }

  if (typeof path === "string" && isUint8Array(name)) {
    const pathBuffer = Buffer.from(pathModule.join(path, pathModule.sep));
    return Buffer.concat([pathBuffer, name]);
  }

  if (typeof path === "string" && typeof name === "string") {
    return pathModule.join(path, name);
  }

  if (isUint8Array(path) && isUint8Array(name)) {
    return Buffer.concat([path, bufferSep, name]);
  }

  throw new ERR_INVALID_ARG_TYPE(
    "path",
    ["string", "Buffer"],
    path,
  );
}

export function getDirents(path, { 0: names, 1: types }, callback) {
  let i;
  if (typeof callback === "function") {
    const len = names.length;
    let toFinish = 0;
    callback = once(callback);
    for (i = 0; i < len; i++) {
      const type = types[i];
      if (type === UV_DIRENT_UNKNOWN) {
        const name = names[i];
        const idx = i;
        toFinish++;
        let filepath;
        try {
          filepath = join(path, name);
        } catch (err) {
          callback(err);
          return;
        }
        lstat(filepath, (err, stats) => {
          if (err) {
            callback(err);
            return;
          }
          names[idx] = new DirentFromStats(name, stats);
          if (--toFinish === 0) {
            callback(null, names);
          }
        });
      } else {
        names[i] = new Dirent(names[i], types[i]);
      }
    }
    if (toFinish === 0) {
      callback(null, names);
    }
  } else {
    const len = names.length;
    for (i = 0; i < len; i++) {
      names[i] = getDirent(path, names[i], types[i]);
    }
    return names;
  }
}

export function getDirent(path, name, type, callback) {
  if (typeof callback === "function") {
    if (type === UV_DIRENT_UNKNOWN) {
      let filepath;
      try {
        filepath = join(path, name);
      } catch (err) {
        callback(err);
        return;
      }
      lstat(filepath, (err, stats) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null, new DirentFromStats(name, stats));
      });
    } else {
      callback(null, new Dirent(name, type));
    }
  } else if (type === UV_DIRENT_UNKNOWN) {
    const stats = lstatSync(join(path, name));
    return new DirentFromStats(name, stats);
  } else {
    return new Dirent(name, type);
  }
}

export function getOptions(options, defaultOptions) {
  if (
    options === null || options === undefined ||
    typeof options === "function"
  ) {
    return defaultOptions;
  }

  if (typeof options === "string") {
    defaultOptions = { ...defaultOptions };
    defaultOptions.encoding = options;
    options = defaultOptions;
  } else if (typeof options !== "object") {
    throw new ERR_INVALID_ARG_TYPE("options", ["string", "Object"], options);
  }

  if (options.encoding !== "buffer") {
    assertEncoding(options.encoding);
  }

  if (options.signal !== undefined) {
    validateAbortSignal(options.signal, "options.signal");
  }
  return options;
}

/**
 * @param {InternalFSBinding.FSSyncContext} ctx
 */
export function handleErrorFromBinding(ctx) {
  if (ctx.errno !== undefined) { // libuv error numbers
    const err = uvException(ctx);
    Error.captureStackTrace(err, handleErrorFromBinding);
    throw err;
  }
  if (ctx.error !== undefined) { // Errors created in C++ land.
    // TODO(joyeecheung): currently, ctx.error are encoding errors
    // usually caused by memory problems. We need to figure out proper error
    // code(s) for this.
    Error.captureStackTrace(ctx.error, handleErrorFromBinding);
    throw ctx.error;
  }
}

// Check if the path contains null types if it is a string nor Uint8Array,
// otherwise return silently.
export const nullCheck = hideStackFrames(
  (path, propName, throwError = true) => {
    const pathIsString = typeof path === "string";
    const pathIsUint8Array = isUint8Array(path);

    // We can only perform meaningful checks on strings and Uint8Arrays.
    if (
      (!pathIsString && !pathIsUint8Array) ||
      (pathIsString && !path.includes("\u0000")) ||
      (pathIsUint8Array && !path.includes(0))
    ) {
      return;
    }

    const err = new ERR_INVALID_ARG_VALUE(
      propName,
      path,
      "must be a string or Uint8Array without null bytes",
    );
    if (throwError) {
      throw err;
    }
    return err;
  },
);

export function preprocessSymlinkDestination(path, type, linkPath) {
  if (!isWindows) {
    // No preprocessing is needed on Unix.
    return path;
  }
  path = "" + path;
  if (type === "junction") {
    // Junctions paths need to be absolute and \\?\-prefixed.
    // A relative target is relative to the link's parent directory.
    path = pathModule.resolve(linkPath, "..", path);
    return pathModule.toNamespacedPath(path);
  }
  if (pathModule.isAbsolute(path)) {
    // If the path is absolute, use the \\?\-prefix to enable long filenames
    return pathModule.toNamespacedPath(path);
  }
  // Windows symlinks don't tolerate forward slashes.
  return path.replace(/\//g, "\\");
}

// Constructor for file stats.
function StatsBase(
  dev,
  mode,
  nlink,
  uid,
  gid,
  rdev,
  blksize,
  ino,
  size,
  blocks,
) {
  this.dev = dev;
  this.mode = mode;
  this.nlink = nlink;
  this.uid = uid;
  this.gid = gid;
  this.rdev = rdev;
  this.blksize = blksize;
  this.ino = ino;
  this.size = size;
  this.blocks = blocks;
}

StatsBase.prototype.isDirectory = function () {
  return this._checkModeProperty(S_IFDIR);
};

StatsBase.prototype.isFile = function () {
  return this._checkModeProperty(S_IFREG);
};

StatsBase.prototype.isBlockDevice = function () {
  return this._checkModeProperty(S_IFBLK);
};

StatsBase.prototype.isCharacterDevice = function () {
  return this._checkModeProperty(S_IFCHR);
};

StatsBase.prototype.isSymbolicLink = function () {
  return this._checkModeProperty(S_IFLNK);
};

StatsBase.prototype.isFIFO = function () {
  return this._checkModeProperty(S_IFIFO);
};

StatsBase.prototype.isSocket = function () {
  return this._checkModeProperty(S_IFSOCK);
};

const kNsPerMsBigInt = 10n ** 6n;
const kNsPerSecBigInt = 10n ** 9n;
const kMsPerSec = 10 ** 3;
const kNsPerMs = 10 ** 6;
function msFromTimeSpec(sec, nsec) {
  return sec * kMsPerSec + nsec / kNsPerMs;
}

function nsFromTimeSpecBigInt(sec, nsec) {
  return sec * kNsPerSecBigInt + nsec;
}

// The Date constructor performs Math.floor() to the timestamp.
// https://www.ecma-international.org/ecma-262/#sec-timeclip
// Since there may be a precision loss when the timestamp is
// converted to a floating point number, we manually round
// the timestamp here before passing it to Date().
// Refs: https://github.com/nodejs/node/pull/12607
function dateFromMs(ms) {
  return new Date(Number(ms) + 0.5);
}

export function BigIntStats(
  dev,
  mode,
  nlink,
  uid,
  gid,
  rdev,
  blksize,
  ino,
  size,
  blocks,
  atimeNs,
  mtimeNs,
  ctimeNs,
  birthtimeNs,
) {
  Reflect.apply(StatsBase, this, [
    dev,
    mode,
    nlink,
    uid,
    gid,
    rdev,
    blksize,
    ino,
    size,
    blocks,
  ]);

  this.atimeMs = atimeNs / kNsPerMsBigInt;
  this.mtimeMs = mtimeNs / kNsPerMsBigInt;
  this.ctimeMs = ctimeNs / kNsPerMsBigInt;
  this.birthtimeMs = birthtimeNs / kNsPerMsBigInt;
  this.atimeNs = atimeNs;
  this.mtimeNs = mtimeNs;
  this.ctimeNs = ctimeNs;
  this.birthtimeNs = birthtimeNs;
  this.atime = dateFromMs(this.atimeMs);
  this.mtime = dateFromMs(this.mtimeMs);
  this.ctime = dateFromMs(this.ctimeMs);
  this.birthtime = dateFromMs(this.birthtimeMs);
}

Object.setPrototypeOf(BigIntStats.prototype, StatsBase.prototype);
Object.setPrototypeOf(BigIntStats, StatsBase);

BigIntStats.prototype._checkModeProperty = function (property) {
  if (
    isWindows && (property === S_IFIFO || property === S_IFBLK ||
      property === S_IFSOCK)
  ) {
    return false; // Some types are not available on Windows
  }
  return (this.mode & BigInt(S_IFMT)) === BigInt(property);
};

export function Stats(
  dev,
  mode,
  nlink,
  uid,
  gid,
  rdev,
  blksize,
  ino,
  size,
  blocks,
  atimeMs,
  mtimeMs,
  ctimeMs,
  birthtimeMs,
) {
  StatsBase.call(
    this,
    dev,
    mode,
    nlink,
    uid,
    gid,
    rdev,
    blksize,
    ino,
    size,
    blocks,
  );
  this.atimeMs = atimeMs;
  this.mtimeMs = mtimeMs;
  this.ctimeMs = ctimeMs;
  this.birthtimeMs = birthtimeMs;
  this.atime = dateFromMs(atimeMs);
  this.mtime = dateFromMs(mtimeMs);
  this.ctime = dateFromMs(ctimeMs);
  this.birthtime = dateFromMs(birthtimeMs);
}

Object.setPrototypeOf(Stats.prototype, StatsBase.prototype);
Object.setPrototypeOf(Stats, StatsBase);

// HACK: Workaround for https://github.com/standard-things/esm/issues/821.
// TODO(ronag): Remove this as soon as `esm` publishes a fixed version.
Stats.prototype.isFile = StatsBase.prototype.isFile;

Stats.prototype._checkModeProperty = function (property) {
  if (
    isWindows && (property === S_IFIFO || property === S_IFBLK ||
      property === S_IFSOCK)
  ) {
    return false; // Some types are not available on Windows
  }
  return (this.mode & S_IFMT) === property;
};

/**
 * @param {Float64Array | BigUint64Array} stats
 * @param {number} offset
 * @returns
 */
export function getStatsFromBinding(stats, offset = 0) {
  if (isBigUint64Array(stats)) {
    return new BigIntStats(
      stats[0 + offset],
      stats[1 + offset],
      stats[2 + offset],
      stats[3 + offset],
      stats[4 + offset],
      stats[5 + offset],
      stats[6 + offset],
      stats[7 + offset],
      stats[8 + offset],
      stats[9 + offset],
      nsFromTimeSpecBigInt(stats[10 + offset], stats[11 + offset]),
      nsFromTimeSpecBigInt(stats[12 + offset], stats[13 + offset]),
      nsFromTimeSpecBigInt(stats[14 + offset], stats[15 + offset]),
      nsFromTimeSpecBigInt(stats[16 + offset], stats[17 + offset]),
    );
  }
  return new Stats(
    stats[0 + offset],
    stats[1 + offset],
    stats[2 + offset],
    stats[3 + offset],
    stats[4 + offset],
    stats[5 + offset],
    stats[6 + offset],
    stats[7 + offset],
    stats[8 + offset],
    stats[9 + offset],
    msFromTimeSpec(stats[10 + offset], stats[11 + offset]),
    msFromTimeSpec(stats[12 + offset], stats[13 + offset]),
    msFromTimeSpec(stats[14 + offset], stats[15 + offset]),
    msFromTimeSpec(stats[16 + offset], stats[17 + offset]),
  );
}

export function stringToFlags(flags, name = "flags") {
  if (typeof flags === "number") {
    validateInt32(flags, name);
    return flags;
  }

  if (flags == null) {
    return O_RDONLY;
  }

  switch (flags) {
    case "r":
      return O_RDONLY;
    case "rs": // Fall through.
    case "sr":
      return O_RDONLY | O_SYNC;
    case "r+":
      return O_RDWR;
    case "rs+": // Fall through.
    case "sr+":
      return O_RDWR | O_SYNC;

    case "w":
      return O_TRUNC | O_CREAT | O_WRONLY;
    case "wx": // Fall through.
    case "xw":
      return O_TRUNC | O_CREAT | O_WRONLY | O_EXCL;

    case "w+":
      return O_TRUNC | O_CREAT | O_RDWR;
    case "wx+": // Fall through.
    case "xw+":
      return O_TRUNC | O_CREAT | O_RDWR | O_EXCL;

    case "a":
      return O_APPEND | O_CREAT | O_WRONLY;
    case "ax": // Fall through.
    case "xa":
      return O_APPEND | O_CREAT | O_WRONLY | O_EXCL;
    case "as": // Fall through.
    case "sa":
      return O_APPEND | O_CREAT | O_WRONLY | O_SYNC;

    case "a+":
      return O_APPEND | O_CREAT | O_RDWR;
    case "ax+": // Fall through.
    case "xa+":
      return O_APPEND | O_CREAT | O_RDWR | O_EXCL;
    case "as+": // Fall through.
    case "sa+":
      return O_APPEND | O_CREAT | O_RDWR | O_SYNC;
  }

  throw new ERR_INVALID_ARG_VALUE("flags", flags);
}

export const stringToSymlinkType = hideStackFrames((type) => {
  let flags = 0;
  if (typeof type === "string") {
    switch (type) {
      case "dir":
        flags |= UV_FS_SYMLINK_DIR;
        break;
      case "junction":
        flags |= UV_FS_SYMLINK_JUNCTION;
        break;
      case "file":
        break;
      default:
        throw new ERR_FS_INVALID_SYMLINK_TYPE(type);
    }
  }
  return flags;
});

// converts Date or number to a fractional UNIX timestamp
export function toUnixTimestamp(time, name = "time") {
  // eslint-disable-next-line eqeqeq
  if (typeof time === "string" && +time == time) {
    return +time;
  }
  if (Number.isFinite(time)) {
    if (time < 0) {
      return Date.now() / 1000;
    }
    return time;
  }
  if (isDate(time)) {
    // Convert to 123.456 UNIX timestamp
    return DatePrototypeGetTime(time) / 1000;
  }
  throw new ERR_INVALID_ARG_TYPE(name, ["Date", "Time in seconds"], time);
}

export const validateOffsetLengthRead = hideStackFrames(
  (offset, length, bufferLength) => {
    if (offset < 0) {
      throw new ERR_OUT_OF_RANGE("offset", ">= 0", offset);
    }
    if (length < 0) {
      throw new ERR_OUT_OF_RANGE("length", ">= 0", length);
    }
    if (offset + length > bufferLength) {
      throw new ERR_OUT_OF_RANGE(
        "length",
        `<= ${bufferLength - offset}`,
        length,
      );
    }
  },
);

export const validateOffsetLengthWrite = hideStackFrames(
  (offset, length, byteLength) => {
    if (offset > byteLength) {
      throw new ERR_OUT_OF_RANGE("offset", `<= ${byteLength}`, offset);
    }

    if (length > byteLength - offset) {
      throw new ERR_OUT_OF_RANGE("length", `<= ${byteLength - offset}`, length);
    }

    if (length < 0) {
      throw new ERR_OUT_OF_RANGE("length", ">= 0", length);
    }

    validateInt32(length, "length", 0);
  },
);

export const validatePath = hideStackFrames((path, propName = "path") => {
  if (typeof path !== "string" && !isUint8Array(path)) {
    throw new ERR_INVALID_ARG_TYPE(propName, ["string", "Buffer", "URL"], path);
  }

  const err = nullCheck(path, propName, false);

  if (err !== undefined) {
    throw err;
  }
});

export const getValidatedPath = hideStackFrames(
  (fileURLOrPath, propName = "path") => {
    const path = toPathIfFileURL(fileURLOrPath);
    validatePath(path, propName);
    return path;
  },
);

export const getValidatedFd = hideStackFrames((fd, propName = "fd") => {
  if (Object.is(fd, -0)) {
    return 0;
  }

  validateInt32(fd, propName, 0);

  return fd;
});

export const validateBufferArray = hideStackFrames(
  (buffers, propName = "buffers") => {
    if (!Array.isArray(buffers)) {
      throw new ERR_INVALID_ARG_TYPE(propName, "ArrayBufferView[]", buffers);
    }

    for (let i = 0; i < buffers.length; i++) {
      if (!isArrayBufferView(buffers[i])) {
        throw new ERR_INVALID_ARG_TYPE(propName, "ArrayBufferView[]", buffers);
      }
    }

    return buffers;
  },
);

let nonPortableTemplateWarn = true;

export function warnOnNonPortableTemplate(template) {
  // Template strings passed to the mkdtemp() family of functions should not
  // end with 'X' because they are handled inconsistently across platforms.
  if (nonPortableTemplateWarn && template.endsWith("X")) {
    process.emitWarning(
      "mkdtemp() templates ending with X are not portable. " +
        "For details see: https://nodejs.org/api/fs.html",
    );
    nonPortableTemplateWarn = false;
  }
}

const defaultCpOptions = {
  dereference: false,
  errorOnExist: false,
  filter: undefined,
  force: true,
  preserveTimestamps: false,
  recursive: false,
};

const defaultRmOptions = {
  recursive: false,
  force: false,
  retryDelay: 100,
  maxRetries: 0,
};

const defaultRmdirOptions = {
  retryDelay: 100,
  maxRetries: 0,
  recursive: false,
};

export const validateCpOptions = hideStackFrames((options) => {
  if (options === undefined) {
    return { ...defaultCpOptions };
  }
  validateObject(options, "options");
  options = { ...defaultCpOptions, ...options };
  validateBoolean(options.dereference, "options.dereference");
  validateBoolean(options.errorOnExist, "options.errorOnExist");
  validateBoolean(options.force, "options.force");
  validateBoolean(options.preserveTimestamps, "options.preserveTimestamps");
  validateBoolean(options.recursive, "options.recursive");
  if (options.filter !== undefined) {
    validateFunction(options.filter, "options.filter");
  }
  return options;
});

export const validateRmOptions = hideStackFrames(
  (path, options, expectDir, cb) => {
    options = validateRmdirOptions(options, defaultRmOptions);
    validateBoolean(options.force, "options.force");

    stat(path, (err, stats) => {
      if (err) {
        if (options.force && err.code === "ENOENT") {
          return cb(null, options);
        }
        return cb(err, options);
      }

      if (expectDir && !stats.isDirectory()) {
        return cb(false);
      }

      if (stats.isDirectory() && !options.recursive) {
        return cb(
          new ERR_FS_EISDIR({
            code: "EISDIR",
            message: "is a directory",
            path,
            syscall: "rm",
            errno: osConstants.errno.EISDIR,
          }),
        );
      }
      return cb(null, options);
    });
  },
);

export const validateRmOptionsSync = hideStackFrames(
  (path, options, expectDir) => {
    options = validateRmdirOptions(options, defaultRmOptions);
    validateBoolean(options.force, "options.force");

    if (!options.force || expectDir || !options.recursive) {
      const isDirectory = statSync(path, { throwIfNoEntry: !options.force })
        ?.isDirectory();

      if (expectDir && !isDirectory) {
        return false;
      }

      if (isDirectory && !options.recursive) {
        throw new ERR_FS_EISDIR({
          code: "EISDIR",
          message: "is a directory",
          path,
          syscall: "rm",
          errno: osConstants.errno.EISDIR,
        });
      }
    }

    return options;
  },
);

let recursiveRmdirWarned = process.noDeprecation;
export function emitRecursiveRmdirWarning() {
  if (!recursiveRmdirWarned) {
    process.emitWarning(
      "In future versions of Node.js, fs.rmdir(path, { recursive: true }) " +
        "will be removed. Use fs.rm(path, { recursive: true }) instead",
      "DeprecationWarning",
      "DEP0147",
    );
    recursiveRmdirWarned = true;
  }
}

export const validateRmdirOptions = hideStackFrames(
  (options, defaults = defaultRmdirOptions) => {
    if (options === undefined) {
      return defaults;
    }
    validateObject(options, "options");

    options = { ...defaults, ...options };

    validateBoolean(options.recursive, "options.recursive");
    validateInt32(options.retryDelay, "options.retryDelay", 0);
    validateUint32(options.maxRetries, "options.maxRetries");

    return options;
  },
);

export const getValidMode = hideStackFrames((mode, type) => {
  let min = kMinimumAccessMode;
  let max = kMaximumAccessMode;
  let def = F_OK;
  if (type === "copyFile") {
    min = kMinimumCopyMode;
    max = kMaximumCopyMode;
    def = mode || kDefaultCopyMode;
  } else {
    assert(type === "access");
  }
  if (mode == null) {
    return def;
  }
  if (Number.isInteger(mode) && mode >= min && mode <= max) {
    return mode;
  }
  if (typeof mode !== "number") {
    throw new ERR_INVALID_ARG_TYPE("mode", "integer", mode);
  }
  throw new ERR_OUT_OF_RANGE(
    "mode",
    `an integer >= ${min} && <= ${max}`,
    mode,
  );
});

export const validateStringAfterArrayBufferView = hideStackFrames(
  (buffer, name) => {
    if (typeof buffer !== "string") {
      throw new ERR_INVALID_ARG_TYPE(
        name,
        ["string", "Buffer", "TypedArray", "DataView"],
        buffer,
      );
    }
  },
);

export const validatePosition = hideStackFrames((position) => {
  if (typeof position === "number") {
    validateInteger(position, "position");
  } else if (typeof position === "bigint") {
    if (!(position >= -(2n ** 63n) && position <= 2n ** 63n - 1n)) {
      throw new ERR_OUT_OF_RANGE(
        "position",
        `>= ${-(2n ** 63n)} && <= ${2n ** 63n - 1n}`,
        position,
      );
    }
  } else {
    throw new ERR_INVALID_ARG_TYPE("position", ["integer", "bigint"], position);
  }
});

/** @type {(buffer: ArrayBufferView) => Uint8Array} */
export const arrayBufferViewToUint8Array = hideStackFrames(
  (buffer) => {
    if (!(buffer instanceof Uint8Array)) {
      return new Uint8Array(
        buffer.buffer,
        buffer.byteOffset,
        buffer.byteLength,
      );
    }
    return buffer;
  },
);

export const realpathCacheKey = Symbol("realpathCacheKey");
export const constants = {
  kIoMaxLength,
  kMaxUserId,
  kReadFileBufferLength,
  kReadFileUnknownBufferLength,
  kWriteFileMaxChunkSize,
};

export default {
  constants,
  assertEncoding,
  BigIntStats, // for testing
  copyObject,
  Dirent,
  emitRecursiveRmdirWarning,
  getDirent,
  getDirents,
  getOptions,
  getValidatedFd,
  getValidatedPath,
  getValidMode,
  handleErrorFromBinding,
  kMaxUserId,
  nullCheck,
  preprocessSymlinkDestination,
  realpathCacheKey,
  getStatsFromBinding,
  stringToFlags,
  stringToSymlinkType,
  Stats,
  toUnixTimestamp,
  validateBufferArray,
  validateCpOptions,
  validateOffsetLengthRead,
  validateOffsetLengthWrite,
  validatePath,
  validatePosition,
  validateRmOptions,
  validateRmOptionsSync,
  validateRmdirOptions,
  validateStringAfterArrayBufferView,
  warnOnNonPortableTemplate,
};
