// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { EventEmitter } from "node:events";
import { Buffer } from "node:buffer";
import { promises, read, write } from "node:fs";
export type { BigIntStats, Stats } from "ext:deno_node/_fs/_fs_stat.ts";
import {
  BinaryOptionsArgument,
  FileOptionsArgument,
  ReadOptions,
  TextOptionsArgument,
} from "ext:deno_node/_fs/_fs_common.ts";
import { core } from "ext:core/mod.js";

interface WriteResult {
  bytesWritten: number;
  buffer: Buffer | string;
}

interface ReadResult {
  bytesRead: number;
  buffer: Buffer;
}

export class FileHandle extends EventEmitter {
  #rid: number;
  constructor(rid: number) {
    super();
    this.#rid = rid;
  }

  get fd() {
    return this.#rid;
  }

  read(
    buffer: Uint8Array,
    offset?: number,
    length?: number,
    position?: number | null,
  ): Promise<ReadResult>;
  read(options?: ReadOptions): Promise<ReadResult>;
  read(
    bufferOrOpt: Uint8Array | ReadOptions,
    offset?: number,
    length?: number,
    position?: number | null,
  ): Promise<ReadResult> {
    if (bufferOrOpt instanceof Uint8Array) {
      return new Promise((resolve, reject) => {
        read(
          this.fd,
          bufferOrOpt,
          offset,
          length,
          position,
          (err, bytesRead, buffer) => {
            if (err) reject(err);
            else resolve({ buffer: buffer, bytesRead: bytesRead });
          },
        );
      });
    } else {
      return new Promise((resolve, reject) => {
        read(this.fd, bufferOrOpt, (err, bytesRead, buffer) => {
          if (err) reject(err);
          else resolve({ buffer: buffer, bytesRead: bytesRead });
        });
      });
    }
  }

  readFile(
    opt?: TextOptionsArgument | BinaryOptionsArgument | FileOptionsArgument,
  ): Promise<string | Buffer> {
    return promises.readFile(this, opt);
  }

  write(
    buffer: Buffer,
    offset: number,
    length: number,
    position: number,
  ): Promise<WriteResult>;
  write(
    str: string,
    position: number,
    encoding: string,
  ): Promise<WriteResult>;
  write(
    bufferOrStr: Uint8Array | string,
    offsetOrPosition: number,
    lengthOrEncoding: number | string,
    position?: number,
  ): Promise<WriteResult> {
    if (bufferOrStr instanceof Uint8Array) {
      const buffer = bufferOrStr;
      const offset = offsetOrPosition;
      const length = lengthOrEncoding;

      return new Promise((resolve, reject) => {
        write(
          this.fd,
          buffer,
          offset,
          length,
          position,
          (err, bytesWritten, buffer) => {
            if (err) reject(err);
            else resolve({ buffer, bytesWritten });
          },
        );
      });
    } else {
      const str = bufferOrStr;
      const position = offsetOrPosition;
      const encoding = lengthOrEncoding;

      return new Promise((resolve, reject) => {
        write(
          this.fd,
          str,
          position,
          encoding,
          (err, bytesWritten, buffer) => {
            if (err) reject(err);
            else resolve({ buffer, bytesWritten });
          },
        );
      });
    }
  }

  writeFile(data, options): Promise<void> {
    return fsCall(promises.writeFile, this, data, options);
  }

  close(): Promise<void> {
    // Note that Deno.close is not async
    return Promise.resolve(core.close(this.fd));
  }

  stat(): Promise<Stats>;
  stat(options: { bigint: false }): Promise<Stats>;
  stat(options: { bigint: true }): Promise<BigIntStats>;
  stat(options?: { bigint: boolean }): Promise<Stats | BigIntStats> {
    return fsCall(promises.fstat, this, options);
  }
}

function fsCall(fn, handle, ...args) {
  if (handle.fd === -1) {
    const err = new Error("file closed");
    throw Object.assign(err, {
      code: "EBADF",
      syscall: fn.name,
    });
  }

  return fn(handle.fd, ...args);
}

export default {
  FileHandle,
};
