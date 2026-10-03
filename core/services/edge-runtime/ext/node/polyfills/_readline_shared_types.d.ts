// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// Part of https://github.com/DefinitelyTyped/DefinitelyTyped/blob/cd61f5b4d3d143108569ec3f88adc0eb34b961c4/types/node/readline.d.ts

// This .d.ts file is provided to avoid circular dependencies.

import type {
  ReadableStream,
  WritableStream,
} from "ext:deno_node/_global.d.ts";

export type Completer = (line: string) => CompleterResult;
export type AsyncCompleter = (
  line: string,
  callback: (err?: null | Error, result?: CompleterResult) => void,
) => void;
export type CompleterResult = [string[], string];
export interface ReadLineOptions {
  input: ReadableStream;
  output?: WritableStream | undefined;
  completer?: Completer | AsyncCompleter | undefined;
  terminal?: boolean | undefined;
  /**
   *  Initial list of history lines. This option makes sense
   * only if `terminal` is set to `true` by the user or by an internal `output`
   * check, otherwise the history caching mechanism is not initialized at all.
   * @default []
   */
  history?: string[] | undefined;
  historySize?: number | undefined;
  prompt?: string | undefined;
  crlfDelay?: number | undefined;
  /**
   * If `true`, when a new input line added
   * to the history list duplicates an older one, this removes the older line
   * from the list.
   * @default false
   */
  removeHistoryDuplicates?: boolean | undefined;
  escapeCodeTimeout?: number | undefined;
  tabSize?: number | undefined;
}
