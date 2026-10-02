// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Forked from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/d9df51e34526f48bef4e2546a006157b391ad96c/types/node/fs.d.ts

import { BufferEncoding, ErrnoException } from "ext:deno_node/_global.d.ts";

/**
 * Write `buffer` to the file specified by `fd`. If `buffer` is a normal object, it
 * must have an own `toString` function property.
 *
 * `offset` determines the part of the buffer to be written, and `length` is
 * an integer specifying the number of bytes to write.
 *
 * `position` refers to the offset from the beginning of the file where this data
 * should be written. If `typeof position !== 'number'`, the data will be written
 * at the current position. See [`pwrite(2)`](http://man7.org/linux/man-pages/man2/pwrite.2.html).
 *
 * The callback will be given three arguments `(err, bytesWritten, buffer)` where`bytesWritten` specifies how many _bytes_ were written from `buffer`.
 *
 * If this method is invoked as its `util.promisify()` ed version, it returns
 * a promise for an `Object` with `bytesWritten` and `buffer` properties.
 *
 * It is unsafe to use `fs.write()` multiple times on the same file without waiting
 * for the callback. For this scenario, {@link createWriteStream} is
 * recommended.
 *
 * On Linux, positional writes don't work when the file is opened in append mode.
 * The kernel ignores the position argument and always appends the data to
 * the end of the file.
 * @since v0.0.2
 */
export function write<TBuffer extends ArrayBufferView>(
  fd: number,
  buffer: TBuffer,
  offset: number | undefined | null,
  length: number | undefined | null,
  position: number | undefined | null,
  callback: (
    err: ErrnoException | null,
    written: number,
    buffer: TBuffer,
  ) => void,
): void;
/**
 * Asynchronously writes `buffer` to the file referenced by the supplied file descriptor.
 * @param fd A file descriptor.
 * @param offset The part of the buffer to be written. If not supplied, defaults to `0`.
 * @param length The number of bytes to write. If not supplied, defaults to `buffer.length - offset`.
 */
export function write<TBuffer extends ArrayBufferView>(
  fd: number,
  buffer: TBuffer,
  offset: number | undefined | null,
  length: number | undefined | null,
  callback: (
    err: ErrnoException | null,
    written: number,
    buffer: TBuffer,
  ) => void,
): void;
/**
 * Asynchronously writes `buffer` to the file referenced by the supplied file descriptor.
 * @param fd A file descriptor.
 * @param offset The part of the buffer to be written. If not supplied, defaults to `0`.
 */
export function write<TBuffer extends ArrayBufferView>(
  fd: number,
  buffer: TBuffer,
  offset: number | undefined | null,
  callback: (
    err: ErrnoException | null,
    written: number,
    buffer: TBuffer,
  ) => void,
): void;
/**
 * Asynchronously writes `buffer` to the file referenced by the supplied file descriptor.
 * @param fd A file descriptor.
 */
export function write<TBuffer extends ArrayBufferView>(
  fd: number,
  buffer: TBuffer,
  callback: (
    err: ErrnoException | null,
    written: number,
    buffer: TBuffer,
  ) => void,
): void;
/**
 * Asynchronously writes `string` to the file referenced by the supplied file descriptor.
 * @param fd A file descriptor.
 * @param string A string to write.
 * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
 * @param encoding The expected string encoding.
 */
export function write(
  fd: number,
  string: string,
  position: number | undefined | null,
  encoding: BufferEncoding | undefined | null,
  callback: (err: ErrnoException | null, written: number, str: string) => void,
): void;
/**
 * Asynchronously writes `string` to the file referenced by the supplied file descriptor.
 * @param fd A file descriptor.
 * @param string A string to write.
 * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
 */
export function write(
  fd: number,
  string: string,
  position: number | undefined | null,
  callback: (err: ErrnoException | null, written: number, str: string) => void,
): void;
/**
 * Asynchronously writes `string` to the file referenced by the supplied file descriptor.
 * @param fd A file descriptor.
 * @param string A string to write.
 */
export function write(
  fd: number,
  string: string,
  callback: (err: ErrnoException | null, written: number, str: string) => void,
): void;
export namespace write {
  /**
   * Asynchronously writes `buffer` to the file referenced by the supplied file descriptor.
   * @param fd A file descriptor.
   * @param offset The part of the buffer to be written. If not supplied, defaults to `0`.
   * @param length The number of bytes to write. If not supplied, defaults to `buffer.length - offset`.
   * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
   */
  function __promisify__<TBuffer extends ArrayBufferView>(
    fd: number,
    buffer?: TBuffer,
    offset?: number,
    length?: number,
    position?: number | null,
  ): Promise<{
    bytesWritten: number;
    buffer: TBuffer;
  }>;
  /**
   * Asynchronously writes `string` to the file referenced by the supplied file descriptor.
   * @param fd A file descriptor.
   * @param string A string to write.
   * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
   * @param encoding The expected string encoding.
   */
  function __promisify__(
    fd: number,
    string: string,
    position?: number | null,
    encoding?: BufferEncoding | null,
  ): Promise<{
    bytesWritten: number;
    buffer: string;
  }>;
}
/**
 * If `buffer` is a plain object, it must have an own (not inherited) `toString`function property.
 *
 * For detailed information, see the documentation of the asynchronous version of
 * this API: {@link write}.
 * @since v0.1.21
 * @return The number of bytes written.
 */
export function writeSync(
  fd: number,
  buffer: ArrayBufferView,
  offset?: number | null,
  length?: number | null,
  position?: number | null,
): number;
/**
 * Synchronously writes `string` to the file referenced by the supplied file descriptor, returning the number of bytes written.
 * @param fd A file descriptor.
 * @param string A string to write.
 * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
 * @param encoding The expected string encoding.
 */
export function writeSync(
  fd: number,
  string: string,
  position?: number | null,
  encoding?: BufferEncoding | null,
): number;
export type ReadPosition = number | bigint;
/**
 * Read data from the file specified by `fd`.
 *
 * The callback is given the three arguments, `(err, bytesRead, buffer)`.
 *
 * If the file is not modified concurrently, the end-of-file is reached when the
 * number of bytes read is zero.
 *
 * If this method is invoked as its `util.promisify()` ed version, it returns
 * a promise for an `Object` with `bytesRead` and `buffer` properties.
 * @since v0.0.2
 * @param buffer The buffer that the data will be written to.
 * @param offset The position in `buffer` to write the data to.
 * @param length The number of bytes to read.
 * @param position Specifies where to begin reading from in the file. If `position` is `null` or `-1 `, data will be read from the current file position, and the file position will be updated. If
 * `position` is an integer, the file position will be unchanged.
 */
