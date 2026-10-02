// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { EventEmitter } from "ext:deno_node/_events.d.ts";
import { Buffer } from "node:buffer";

export type BufferEncoding =
  | "ascii"
  | "utf8"
  | "utf-8"
  | "utf16le"
  | "ucs2"
  | "ucs-2"
  | "base64"
  | "base64url"
  | "latin1"
  | "binary"
  | "hex";

export interface Buffered {
  chunk: Buffer;
  encoding: string;
  callback: (err?: Error | null) => void;
}

export interface ErrnoException extends Error {
  errno?: number | undefined;
  code?: string | undefined;
  path?: string | undefined;
  syscall?: string | undefined;
}

export interface ReadableStream extends EventEmitter {
  readable: boolean;
  read(size?: number): string | Buffer;
  setEncoding(encoding: BufferEncoding): this;
  pause(): this;
  resume(): this;
  isPaused(): boolean;
  pipe<T extends WritableStream>(
    destination: T,
    options?: { end?: boolean | undefined },
  ): T;
  unpipe(destination?: WritableStream): this;
  unshift(chunk: string | Uint8Array, encoding?: BufferEncoding): void;
  wrap(oldStream: ReadableStream): this;
  [Symbol.asyncIterator](): AsyncIterableIterator<string | Buffer>;
}

export interface WritableStream extends EventEmitter {
  writable: boolean;
  write(
    buffer: Uint8Array | string,
    cb?: (err?: Error | null) => void,
  ): boolean;
  write(
    str: string,
    encoding?: BufferEncoding,
    cb?: (err?: Error | null) => void,
  ): boolean;
  end(cb?: () => void): void;
  end(data: string | Uint8Array, cb?: () => void): void;
  end(str: string, encoding?: BufferEncoding, cb?: () => void): void;
}

export interface ReadWriteStream extends ReadableStream, WritableStream {}
