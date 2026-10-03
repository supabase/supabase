// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { Readline } from "ext:deno_node/internal/readline/promises.mjs";

import {
  Interface as _Interface,
  kQuestion,
  kQuestionCancel,
} from "ext:deno_node/internal/readline/interface.mjs";
import { AbortError } from "ext:deno_node/internal/errors.ts";
import { validateAbortSignal } from "ext:deno_node/internal/validators.mjs";

import { kEmptyObject } from "ext:deno_node/internal/util.mjs";
import type { Abortable } from "ext:deno_node/_events.d.ts";
import type {
  AsyncCompleter,
  Completer,
  ReadLineOptions,
} from "ext:deno_node/_readline_shared_types.d.ts";

import type {
  ReadableStream,
  WritableStream,
} from "ext:deno_node/_global.d.ts";

/**
 * The `readline/promise` module provides an API for reading lines of input from a Readable stream one line at a time.
 *
 * @see [source](https://github.com/nodejs/node/blob/v18.0.0/lib/readline/promises.js)
 * @since v17.0.0
 */
export interface Interface extends _Interface {
  /**
   * The rl.question() method displays the query by writing it to the output, waits for user input to be provided on input,
   * then invokes the callback function passing the provided input as the first argument.
   *
   * When called, rl.question() will resume the input stream if it has been paused.
   *
   * If the readlinePromises.Interface was created with output set to null or undefined the query is not written.
   *
   * If the question is called after rl.close(), it returns a rejected promise.
   *
   * Example usage:
   *
   * ```js
   * const answer = await rl.question('What is your favorite food? ');
   * console.log(`Oh, so your favorite food is ${answer}`);
   * ```
   *
   * Using an AbortSignal to cancel a question.
   *
   * ```js
   * const signal = AbortSignal.timeout(10_000);
   *
   * signal.addEventListener('abort', () => {
   *   console.log('The food question timed out');
   * }, { once: true });
   *
   * const answer = await rl.question('What is your favorite food? ', { signal });
   * console.log(`Oh, so your favorite food is ${answer}`);
   * ```
   *
   * @since v17.0.0
   * @param query A statement or query to write to output, prepended to the prompt.
   */
  question(query: string, options?: Abortable): Promise<string>;
}

export class Interface extends _Interface {
  constructor(
    input: ReadableStream | ReadLineOptions,
    output?: WritableStream,
    completer?: Completer | AsyncCompleter,
    terminal?: boolean,
  ) {
    super(input, output, completer, terminal);
  }
  question(query: string, options: Abortable = kEmptyObject): Promise<string> {
    return new Promise((resolve, reject) => {
      let cb = resolve;

      if (options?.signal) {
        validateAbortSignal(options.signal, "options.signal");
        if (options.signal.aborted) {
          return reject(
            new AbortError(undefined, { cause: options.signal.reason }),
          );
        }

        const onAbort = () => {
          this[kQuestionCancel]();
          reject(new AbortError(undefined, { cause: options!.signal!.reason }));
        };
        options.signal.addEventListener("abort", onAbort, { once: true });
        cb = (answer) => {
          options!.signal!.removeEventListener("abort", onAbort);
          resolve(answer);
        };
      }

      this[kQuestion](query, cb);
    });
  }
}

/**
 * The `readlinePromises.createInterface()` method creates a new `readlinePromises.Interface` instance.
 *
 * ```js
 * const readlinePromises = require('node:readline/promises');
 * const rl = readlinePromises.createInterface({
 *   input: process.stdin,
 *   output: process.stdout
 * });
 * ```
 *
 * Once the `readlinePromises.Interface` instance is created, the most common case is to listen for the `'line'` event:
 *
 * ```js
 * rl.on('line', (line) => {
 *   console.log(`Received: ${line}`);
 * });
 * ```
 *
 * If `terminal` is `true` for this instance then the `output` stream will get the best compatibility if it defines an `output.columns` property,
 * and emits a `'resize'` event on the `output`, if or when the columns ever change (`process.stdout` does this automatically when it is a TTY).
 *
 * ## Use of the `completer` function
 *
 * The `completer` function takes the current line entered by the user as an argument, and returns an `Array` with 2 entries:
 *
 * - An Array with matching entries for the completion.
 * - The substring that was used for the matching.
 *
 * For instance: `[[substr1, substr2, ...], originalsubstring]`.
 *
 * ```js
 * function completer(line) {
 *   const completions = '.help .error .exit .quit .q'.split(' ');
 *   const hits = completions.filter((c) => c.startsWith(line));
 *   // Show all completions if none found
 *   return [hits.length ? hits : completions, line];
 * }
 * ```
 *
 * The `completer` function can also returns a `Promise`, or be asynchronous:
 *
 * ```js
 * async function completer(linePartial) {
 *   await someAsyncWork();
 *   return [['123'], linePartial];
 * }
 * ```
 */
export function createInterface(options: ReadLineOptions): Interface;
export function createInterface(
  input: ReadableStream,
  output?: WritableStream,
  completer?: Completer | AsyncCompleter,
  terminal?: boolean,
): Interface;
export function createInterface(
  inputOrOptions: ReadableStream | ReadLineOptions,
  output?: WritableStream,
  completer?: Completer | AsyncCompleter,
  terminal?: boolean,
): Interface {
  return new Interface(inputOrOptions, output, completer, terminal);
}

export { Readline };

export default {
  Interface,
  Readline,
  createInterface,
};
