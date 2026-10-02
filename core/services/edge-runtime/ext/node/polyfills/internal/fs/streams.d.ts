// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright DefinitelyTyped contributors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any

import * as stream from "ext:deno_node/_stream.d.ts";
import * as promises from "node:fs/promises";

import { Buffer } from "node:buffer";
import { BufferEncoding, ErrnoException } from "ext:deno_node/_global.d.ts";

type PathLike = string | Buffer | URL;

/**
 * Instances of `fs.ReadStream` are created and returned using the {@link createReadStream} function.
 * @since v0.1.93
 */
export class ReadStream extends stream.Readable {
  close(callback?: (err?: ErrnoException | null) => void): void;
  /**
   * The number of bytes that have been read so far.
   * @since v6.4.0
   */
  bytesRead: number;
  /**
   * The path to the file the stream is reading from as specified in the first
   * argument to `fs.createReadStream()`. If `path` is passed as a string, then`readStream.path` will be a string. If `path` is passed as a `Buffer`, then`readStream.path` will be a
   * `Buffer`. If `fd` is specified, then`readStream.path` will be `undefined`.
   * @since v0.1.93
   */
  path: string | Buffer;
  /**
   * This property is `true` if the underlying file has not been opened yet,
   * i.e. before the `'ready'` event is emitted.
   * @since v11.2.0, v10.16.0
   */
  pending: boolean;
  /**
   * events.EventEmitter
   *   1. open
   *   2. close
   *   3. ready
   */
  addListener(event: "close", listener: () => void): this;
  addListener(event: "data", listener: (chunk: Buffer | string) => void): this;
  addListener(event: "end", listener: () => void): this;
  addListener(event: "error", listener: (err: Error) => void): this;
  addListener(event: "open", listener: (fd: number) => void): this;
  addListener(event: "pause", listener: () => void): this;
  addListener(event: "readable", listener: () => void): this;
  addListener(event: "ready", listener: () => void): this;
  addListener(event: "resume", listener: () => void): this;
  addListener(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: "close", listener: () => void): this;
  on(event: "data", listener: (chunk: Buffer | string) => void): this;
  on(event: "end", listener: () => void): this;
  on(event: "error", listener: (err: Error) => void): this;
  on(event: "open", listener: (fd: number) => void): this;
  on(event: "pause", listener: () => void): this;
  on(event: "readable", listener: () => void): this;
  on(event: "ready", listener: () => void): this;
  on(event: "resume", listener: () => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: "close", listener: () => void): this;
  once(event: "data", listener: (chunk: Buffer | string) => void): this;
  once(event: "end", listener: () => void): this;
  once(event: "error", listener: (err: Error) => void): this;
  once(event: "open", listener: (fd: number) => void): this;
  once(event: "pause", listener: () => void): this;
  once(event: "readable", listener: () => void): this;
  once(event: "ready", listener: () => void): this;
  once(event: "resume", listener: () => void): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this;
  prependListener(event: "close", listener: () => void): this;
  prependListener(
    event: "data",
    listener: (chunk: Buffer | string) => void,
  ): this;
  prependListener(event: "end", listener: () => void): this;
  prependListener(event: "error", listener: (err: Error) => void): this;
  prependListener(event: "open", listener: (fd: number) => void): this;
  prependListener(event: "pause", listener: () => void): this;
  prependListener(event: "readable", listener: () => void): this;
  prependListener(event: "ready", listener: () => void): this;
  prependListener(event: "resume", listener: () => void): this;
  prependListener(
    event: string | symbol,
    listener: (...args: any[]) => void,
  ): this;
  prependOnceListener(event: "close", listener: () => void): this;
  prependOnceListener(
    event: "data",
    listener: (chunk: Buffer | string) => void,
  ): this;
  prependOnceListener(event: "end", listener: () => void): this;
  prependOnceListener(event: "error", listener: (err: Error) => void): this;
  prependOnceListener(event: "open", listener: (fd: number) => void): this;
  prependOnceListener(event: "pause", listener: () => void): this;
  prependOnceListener(event: "readable", listener: () => void): this;
  prependOnceListener(event: "ready", listener: () => void): this;
  prependOnceListener(event: "resume", listener: () => void): this;
  prependOnceListener(
    event: string | symbol,
    listener: (...args: any[]) => void,
  ): this;
}
/**
 * * Extends `stream.Writable`
 *
 * Instances of `fs.WriteStream` are created and returned using the {@link createWriteStream} function.
 * @since v0.1.93
 */
export class WriteStream extends stream.Writable {
  /**
   * Closes `writeStream`. Optionally accepts a
   * callback that will be executed once the `writeStream`is closed.
   * @since v0.9.4
   */
  close(callback?: (err?: ErrnoException | null) => void): void;
  /**
   * The number of bytes written so far. Does not include data that is still queued
   * for writing.
   * @since v0.4.7
   */
  bytesWritten: number;
  /**
   * The path to the file the stream is writing to as specified in the first
   * argument to {@link createWriteStream}. If `path` is passed as a string, then`writeStream.path` will be a string. If `path` is passed as a `Buffer`, then`writeStream.path` will be a
   * `Buffer`.
   * @since v0.1.93
   */
  path: string | Buffer;
  /**
   * This property is `true` if the underlying file has not been opened yet,
   * i.e. before the `'ready'` event is emitted.
   * @since v11.2.0
   */
  pending: boolean;
  /**
   * events.EventEmitter
   *   1. open
   *   2. close
   *   3. ready
   */
  addListener(event: "close", listener: () => void): this;
  addListener(event: "drain", listener: () => void): this;
  addListener(event: "error", listener: (err: Error) => void): this;
  addListener(event: "finish", listener: () => void): this;
  addListener(event: "open", listener: (fd: number) => void): this;
  addListener(event: "pipe", listener: (src: stream.Readable) => void): this;
  addListener(event: "ready", listener: () => void): this;
  addListener(event: "unpipe", listener: (src: stream.Readable) => void): this;
  addListener(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: "close", listener: () => void): this;
  on(event: "drain", listener: () => void): this;
  on(event: "error", listener: (err: Error) => void): this;
  on(event: "finish", listener: () => void): this;
  on(event: "open", listener: (fd: number) => void): this;
  on(event: "pipe", listener: (src: stream.Readable) => void): this;
  on(event: "ready", listener: () => void): this;
  on(event: "unpipe", listener: (src: stream.Readable) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: "close", listener: () => void): this;
  once(event: "drain", listener: () => void): this;
  once(event: "error", listener: (err: Error) => void): this;
  once(event: "finish", listener: () => void): this;
  once(event: "open", listener: (fd: number) => void): this;
  once(event: "pipe", listener: (src: stream.Readable) => void): this;
  once(event: "ready", listener: () => void): this;
  once(event: "unpipe", listener: (src: stream.Readable) => void): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this;
  prependListener(event: "close", listener: () => void): this;
  prependListener(event: "drain", listener: () => void): this;
  prependListener(event: "error", listener: (err: Error) => void): this;
  prependListener(event: "finish", listener: () => void): this;
  prependListener(event: "open", listener: (fd: number) => void): this;
  prependListener(
    event: "pipe",
    listener: (src: stream.Readable) => void,
  ): this;
  prependListener(event: "ready", listener: () => void): this;
  prependListener(
    event: "unpipe",
    listener: (src: stream.Readable) => void,
  ): this;
  prependListener(
    event: string | symbol,
    listener: (...args: any[]) => void,
  ): this;
  prependOnceListener(event: "close", listener: () => void): this;
  prependOnceListener(event: "drain", listener: () => void): this;
  prependOnceListener(event: "error", listener: (err: Error) => void): this;
  prependOnceListener(event: "finish", listener: () => void): this;
  prependOnceListener(event: "open", listener: (fd: number) => void): this;
  prependOnceListener(
    event: "pipe",
    listener: (src: stream.Readable) => void,
  ): this;
  prependOnceListener(event: "ready", listener: () => void): this;
  prependOnceListener(
    event: "unpipe",
    listener: (src: stream.Readable) => void,
  ): this;
  prependOnceListener(
    event: string | symbol,
    listener: (...args: any[]) => void,
  ): this;
}
interface StreamOptions {
  flags?: string | undefined;
  encoding?: BufferEncoding | undefined;
  // @ts-ignore promises.FileHandle is not implemented
  fd?: number | promises.FileHandle | undefined;
  mode?: number | undefined;
  autoClose?: boolean | undefined;
  /**
   * @default false
   */
  emitClose?: boolean | undefined;
  start?: number | undefined;
  highWaterMark?: number | undefined;
}
interface ReadStreamOptions extends StreamOptions {
  end?: number | undefined;
}
/**
 * Unlike the 16 kb default `highWaterMark` for a `stream.Readable`, the stream
 * returned by this method has a default `highWaterMark` of 64 kb.
 *
 * `options` can include `start` and `end` values to read a range of bytes from
 * the file instead of the entire file. Both `start` and `end` are inclusive and
 * start counting at 0, allowed values are in the
 * \[0, [`Number.MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)\] range. If `fd` is specified and `start` is
 * omitted or `undefined`, `fs.createReadStream()` reads sequentially from the
 * current file position. The `encoding` can be any one of those accepted by `Buffer`.
 *
 * If `fd` is specified, `ReadStream` will ignore the `path` argument and will use
 * the specified file descriptor. This means that no `'open'` event will be
 * emitted. `fd` should be blocking; non-blocking `fd`s should be passed to `net.Socket`.
 *
 * If `fd` points to a character device that only supports blocking reads
 * (such as keyboard or sound card), read operations do not finish until data is
 * available. This can prevent the process from exiting and the stream from
 * closing naturally.
 *
 * By default, the stream will emit a `'close'` event after it has been
 * destroyed.  Set the `emitClose` option to `false` to change this behavior.
 *
 * By providing the `fs` option, it is possible to override the corresponding `fs`implementations for `open`, `read`, and `close`. When providing the `fs` option,
 * an override for `read` is required. If no `fd` is provided, an override for`open` is also required. If `autoClose` is `true`, an override for `close` is
 * also required.
 *
 * ```js
 * import { createReadStream } from "ext:deno_node/internal/fs/fs";
 *
 * // Create a stream from some character device.
 * const stream = createReadStream('/dev/input/event0');
 * setTimeout(() => {
 *   stream.close(); // This may not close the stream.
 *   // Artificially marking end-of-stream, as if the underlying resource had
 *   // indicated end-of-file by itself, allows the stream to close.
 *   // This does not cancel pending read operations, and if there is such an
 *   // operation, the process may still not be able to exit successfully
 *   // until it finishes.
 *   stream.push(null);
 *   stream.read(0);
 * }, 100);
 * ```
 *
 * If `autoClose` is false, then the file descriptor won't be closed, even if
 * there's an error. It is the application's responsibility to close it and make
 * sure there's no file descriptor leak. If `autoClose` is set to true (default
 * behavior), on `'error'` or `'end'` the file descriptor will be closed
 * automatically.
 *
 * `mode` sets the file mode (permission and sticky bits), but only if the
 * file was created.
 *
 * An example to read the last 10 bytes of a file which is 100 bytes long:
 *
 * ```js
 * import { createReadStream } from "ext:deno_node/internal/fs/fs";
 *
 * createReadStream('sample.txt', { start: 90, end: 99 });
 * ```
 *
 * If `options` is a string, then it specifies the encoding.
 * @since v0.1.31
 */
export function createReadStream(
  path: PathLike,
  options?: BufferEncoding | ReadStreamOptions,
): ReadStream;
/**
 * `options` may also include a `start` option to allow writing data at some
 * position past the beginning of the file, allowed values are in the
 * \[0, [`Number.MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)\] range. Modifying a file rather than
 * replacing it may require the `flags` option to be set to `r+` rather than the
 * default `w`. The `encoding` can be any one of those accepted by `Buffer`.
 *
 * If `autoClose` is set to true (default behavior) on `'error'` or `'finish'`the file descriptor will be closed automatically. If `autoClose` is false,
 * then the file descriptor won't be closed, even if there's an error.
 * It is the application's responsibility to close it and make sure there's no
 * file descriptor leak.
 *
 * By default, the stream will emit a `'close'` event after it has been
 * destroyed.  Set the `emitClose` option to `false` to change this behavior.
 *
 * By providing the `fs` option it is possible to override the corresponding `fs`implementations for `open`, `write`, `writev` and `close`. Overriding `write()`without `writev()` can reduce
 * performance as some optimizations (`_writev()`)
 * will be disabled. When providing the `fs` option, overrides for at least one of`write` and `writev` are required. If no `fd` option is supplied, an override
 * for `open` is also required. If `autoClose` is `true`, an override for `close`is also required.
 *
 * Like `fs.ReadStream`, if `fd` is specified, `fs.WriteStream` will ignore the`path` argument and will use the specified file descriptor. This means that no`'open'` event will be
 * emitted. `fd` should be blocking; non-blocking `fd`s
 * should be passed to `net.Socket`.
 *
 * If `options` is a string, then it specifies the encoding.
 * @since v0.1.31
 */
export function createWriteStream(
  path: PathLike,
  options?: BufferEncoding | StreamOptions,
): WriteStream;
