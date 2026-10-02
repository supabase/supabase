// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Forked from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/d9df51e34526f48bef4e2546a006157b391ad96c/types/node/fs.d.ts

import { ErrnoException } from "ext:deno_node/_global.d.ts";

/**
 * Write an array of `ArrayBufferView`s to the file specified by `fd` using`writev()`.
 *
 * `position` is the offset from the beginning of the file where this data
 * should be written. If `typeof position !== 'number'`, the data will be written
 * at the current position.
 *
 * The callback will be given three arguments: `err`, `bytesWritten`, and`buffers`. `bytesWritten` is how many bytes were written from `buffers`.
 *
 * If this method is `util.promisify()` ed, it returns a promise for an`Object` with `bytesWritten` and `buffers` properties.
 *
 * It is unsafe to use `fs.writev()` multiple times on the same file without
 * waiting for the callback. For this scenario, use {@link createWriteStream}.
 *
 * On Linux, positional writes don't work when the file is opened in append mode.
 * The kernel ignores the position argument and always appends the data to
 * the end of the file.
 * @since v12.9.0
 */
export function writev(
  fd: number,
  buffers: ReadonlyArray<ArrayBufferView>,
  cb: (
    err: ErrnoException | null,
    bytesWritten: number,
    buffers: ArrayBufferView[],
  ) => void,
): void;
export function writev(
  fd: number,
  buffers: ReadonlyArray<ArrayBufferView>,
  position: number | null,
  cb: (
    err: ErrnoException | null,
    bytesWritten: number,
    buffers: ArrayBufferView[],
  ) => void,
): void;
export interface WriteVResult {
  bytesWritten: number;
  buffers: ArrayBufferView[];
}
export namespace writev {
  function __promisify__(
    fd: number,
    buffers: ReadonlyArray<ArrayBufferView>,
    position?: number,
  ): Promise<WriteVResult>;
}
/**
 * For detailed information, see the documentation of the asynchronous version of
 * this API: {@link writev}.
 * @since v12.9.0
 * @return The number of bytes written.
 */
export function writevSync(
  fd: number,
  buffers: ReadonlyArray<ArrayBufferView>,
  position?: number,
): number;
