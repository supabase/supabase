// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

export const kAddHistory = Symbol("_addHistory");
export const kDecoder = Symbol("_decoder");
export const kDeleteLeft = Symbol("_deleteLeft");
export const kDeleteLineLeft = Symbol("_deleteLineLeft");
export const kDeleteLineRight = Symbol("_deleteLineRight");
export const kDeleteRight = Symbol("_deleteRight");
export const kDeleteWordLeft = Symbol("_deleteWordLeft");
export const kDeleteWordRight = Symbol("_deleteWordRight");
export const kGetDisplayPos = Symbol("_getDisplayPos");
export const kHistoryNext = Symbol("_historyNext");
export const kHistoryPrev = Symbol("_historyPrev");
export const kInsertString = Symbol("_insertString");
export const kLine = Symbol("_line");
export const kLine_buffer = Symbol("_line_buffer");
export const kMoveCursor = Symbol("_moveCursor");
export const kNormalWrite = Symbol("_normalWrite");
export const kOldPrompt = Symbol("_oldPrompt");
export const kOnLine = Symbol("_onLine");
export const kPreviousKey = Symbol("_previousKey");
export const kPrompt = Symbol("_prompt");
export const kQuestionCallback = Symbol("_questionCallback");
export const kRefreshLine = Symbol("_refreshLine");
export const kSawKeyPress = Symbol("_sawKeyPress");
export const kSawReturnAt = Symbol("_sawReturnAt");
export const kSetRawMode = Symbol("_setRawMode");
export const kTabComplete = Symbol("_tabComplete");
export const kTabCompleter = Symbol("_tabCompleter");
export const kTtyWrite = Symbol("_ttyWrite");
export const kWordLeft = Symbol("_wordLeft");
export const kWordRight = Symbol("_wordRight");
export const kWriteToOutput = Symbol("_writeToOutput");
