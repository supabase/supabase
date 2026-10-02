// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This file was vendored from std/testing/_diff.ts

import { primordials } from "ext:core/mod.js";
const {
  ArrayFrom,
  ArrayPrototypeFilter,
  ArrayPrototypeForEach,
  ArrayPrototypeJoin,
  ArrayPrototypeMap,
  ArrayPrototypePop,
  ArrayPrototypePush,
  ArrayPrototypePushApply,
  ArrayPrototypeReverse,
  ArrayPrototypeShift,
  ArrayPrototypeSlice,
  ArrayPrototypeSome,
  ArrayPrototypeSplice,
  ArrayPrototypeUnshift,
  MathMin,
  ObjectFreeze,
  SafeArrayIterator,
  SafeRegExp,
  StringPrototypeReplace,
  StringPrototypeSplit,
  StringPrototypeTrim,
  Uint32Array,
} = primordials;

import {
  bgGreen,
  bgRed,
  bold,
  gray,
  green,
  red,
  white,
} from "ext:deno_node/_util/std_fmt_colors.ts";

interface FarthestPoint {
  y: number;
  id: number;
}

export enum DiffType {
  removed = "removed",
  common = "common",
  added = "added",
}

export interface DiffResult<T> {
  type: DiffType;
  value: T;
  details?: DiffResult<T>[];
}

const REMOVED = 1;
const COMMON = 2;
const ADDED = 3;

function createCommon<T>(A: T[], B: T[], reverse?: boolean): T[] {
  const common = [];
  if (A.length === 0 || B.length === 0) return [];
  for (let i = 0; i < MathMin(A.length, B.length); i += 1) {
    if (
      A[reverse ? A.length - i - 1 : i] === B[reverse ? B.length - i - 1 : i]
    ) {
      ArrayPrototypePush(common, A[reverse ? A.length - i - 1 : i]);
    } else {
      return common;
    }
  }
  return common;
}

/**
 * Renders the differences between the actual and expected values
 * @param A Actual value
 * @param B Expected value
 */
export function diff<T>(A: T[], B: T[]): DiffResult<T>[] {
  const prefixCommon = createCommon(A, B);
  const suffixCommon = ArrayPrototypeReverse(createCommon(
    ArrayPrototypeSlice(A, prefixCommon.length),
    ArrayPrototypeSlice(B, prefixCommon.length),
    true,
  ));
  A = suffixCommon.length
    ? ArrayPrototypeSlice(A, prefixCommon.length, -suffixCommon.length)
    : ArrayPrototypeSlice(A, prefixCommon.length);
  B = suffixCommon.length
    ? ArrayPrototypeSlice(B, prefixCommon.length, -suffixCommon.length)
    : ArrayPrototypeSlice(B, prefixCommon.length);
  const swapped = B.length > A.length;
  if (swapped) {
    const temp = A;
    A = B;
    B = temp;
  }
  const M = A.length;
  const N = B.length;
  if (
    M === 0 && N === 0 && suffixCommon.length === 0 && prefixCommon.length === 0
  ) return [];
  if (N === 0) {
    return [
      ...new SafeArrayIterator(
        ArrayPrototypeMap(
          prefixCommon,
          (c: T): DiffResult<typeof c> => ({ type: DiffType.common, value: c }),
        ),
      ),
      ...new SafeArrayIterator(
        ArrayPrototypeMap(A, (a: T): DiffResult<typeof a> => ({
          type: swapped ? DiffType.added : DiffType.removed,
          value: a,
        })),
      ),
      ...new SafeArrayIterator(
        ArrayPrototypeMap(
          suffixCommon,
          (c: T): DiffResult<typeof c> => ({ type: DiffType.common, value: c }),
        ),
      ),
    ];
  }
  const offset = N;
  const delta = M - N;
  const size = M + N + 1;
  const fp: FarthestPoint[] = ArrayFrom(
    { length: size },
    () => ({ y: -1, id: -1 }),
  );
  /**
   * INFO:
   * This buffer is used to save memory and improve performance.
   * The first half is used to save route and last half is used to save diff
   * type.
   * This is because, when I kept new uint8array area to save type,performance
   * worsened.
   */
  const routes = new Uint32Array((M * N + size + 1) * 2);
  const diffTypesPtrOffset = routes.length / 2;
  let ptr = 0;
  let p = -1;

  function backTrace<T>(
    A: T[],
    B: T[],
    current: FarthestPoint,
    swapped: boolean,
  ): {
    type: DiffType;
    value: T;
  }[] {
    const M = A.length;
    const N = B.length;
    const result: DiffResult<T>[] = [];
    let a = M - 1;
    let b = N - 1;
    let j = routes[current.id];
    let type = routes[current.id + diffTypesPtrOffset];
    while (true) {
      if (!j && !type) break;
      const prev = j;
      if (type === REMOVED) {
        ArrayPrototypeUnshift(result, {
          type: swapped ? DiffType.removed : DiffType.added,
          value: B[b],
        });
        b -= 1;
      } else if (type === ADDED) {
        ArrayPrototypeUnshift(result, {
          type: swapped ? DiffType.added : DiffType.removed,
          value: A[a],
        });
        a -= 1;
      } else {
        ArrayPrototypeUnshift(result, { type: DiffType.common, value: A[a] });
        a -= 1;
        b -= 1;
      }
      j = routes[prev];
      type = routes[prev + diffTypesPtrOffset];
    }
    return result;
  }

  function createFP(
    slide: FarthestPoint,
    down: FarthestPoint,
    k: number,
    M: number,
  ): FarthestPoint {
    if (slide && slide.y === -1 && down && down.y === -1) {
      return { y: 0, id: 0 };
    }
    if (
      (down && down.y === -1) ||
      k === M ||
      (slide && slide.y) > (down && down.y) + 1
    ) {
      const prev = slide.id;
      ptr++;
      routes[ptr] = prev;
      routes[ptr + diffTypesPtrOffset] = ADDED;
      return { y: slide.y, id: ptr };
    } else {
      const prev = down.id;
      ptr++;
      routes[ptr] = prev;
      routes[ptr + diffTypesPtrOffset] = REMOVED;
      return { y: down.y + 1, id: ptr };
    }
  }

  function snake<T>(
    k: number,
    slide: FarthestPoint,
    down: FarthestPoint,
    _offset: number,
    A: T[],
    B: T[],
  ): FarthestPoint {
    const M = A.length;
    const N = B.length;
    if (k < -N || M < k) return { y: -1, id: -1 };
    const fp = createFP(slide, down, k, M);
    while (fp.y + k < M && fp.y < N && A[fp.y + k] === B[fp.y]) {
      const prev = fp.id;
      ptr++;
      fp.id = ptr;
      fp.y += 1;
      routes[ptr] = prev;
      routes[ptr + diffTypesPtrOffset] = COMMON;
    }
    return fp;
  }

  while (fp[delta + offset].y < N) {
    p = p + 1;
    for (let k = -p; k < delta; ++k) {
      fp[k + offset] = snake(
        k,
        fp[k - 1 + offset],
        fp[k + 1 + offset],
        offset,
        A,
        B,
      );
    }
    for (let k = delta + p; k > delta; --k) {
      fp[k + offset] = snake(
        k,
        fp[k - 1 + offset],
        fp[k + 1 + offset],
        offset,
        A,
        B,
      );
    }
    fp[delta + offset] = snake(
      delta,
      fp[delta - 1 + offset],
      fp[delta + 1 + offset],
      offset,
      A,
      B,
    );
  }
  return [
    ...new SafeArrayIterator(
      ArrayPrototypeMap(
        prefixCommon,
        (c: T): DiffResult<typeof c> => ({ type: DiffType.common, value: c }),
      ),
    ),
    ...new SafeArrayIterator(backTrace(A, B, fp[delta + offset], swapped)),
    ...new SafeArrayIterator(
      ArrayPrototypeMap(
        suffixCommon,
        (c: T): DiffResult<typeof c> => ({ type: DiffType.common, value: c }),
      ),
    ),
  ];
}

const ESCAPE_PATTERN = new SafeRegExp(/([\b\f\t\v])/g);
const ESCAPE_MAP = ObjectFreeze({
  "\b": "\\b",
  "\f": "\\f",
  "\t": "\\t",
  "\v": "\\v",
});
const LINE_BREAK_GLOBAL_PATTERN = new SafeRegExp(/\r\n|\r|\n/g);

const LINE_BREAK_PATTERN = new SafeRegExp(/(\n|\r\n)/);
const WHITESPACE_PATTERN = new SafeRegExp(/\s+/);
const WHITESPACE_SYMBOL_PATTERN = new SafeRegExp(
  /([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/,
);
const LATIN_CHARACTER_PATTERN = new SafeRegExp(
  /^[a-zA-Z\u{C0}-\u{FF}\u{D8}-\u{F6}\u{F8}-\u{2C6}\u{2C8}-\u{2D7}\u{2DE}-\u{2FF}\u{1E00}-\u{1EFF}]+$/u,
);

/**
 * Renders the differences between the actual and expected strings
 * Partially inspired from https://github.com/kpdecker/jsdiff
 * @param A Actual string
 * @param B Expected string
 */
export function diffstr(A: string, B: string) {
  function unescape(string: string): string {
    // unescape invisible characters.
    // ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences
    return StringPrototypeReplace(
      StringPrototypeReplace(
        string,
        ESCAPE_PATTERN,
        (c: string) => ESCAPE_MAP[c],
      ),
      LINE_BREAK_GLOBAL_PATTERN, // does not remove line breaks
      (str: string) =>
        str === "\r" ? "\\r" : str === "\n" ? "\\n\n" : "\\r\\n\r\n",
    );
  }

  function tokenize(
    string: string,
    { wordDiff = false } = { __proto__: null },
  ): string[] {
    if (wordDiff) {
      // Split string on whitespace symbols
      const tokens = StringPrototypeSplit(string, WHITESPACE_SYMBOL_PATTERN);

      // Join boundary splits that we do not consider to be boundaries and merge empty strings surrounded by word chars
      for (let i = 0; i < tokens.length - 1; i++) {
        if (
          !tokens[i + 1] && tokens[i + 2] &&
          LATIN_CHARACTER_PATTERN.test(tokens[i]) &&
          LATIN_CHARACTER_PATTERN.test(tokens[i + 2])
        ) {
          tokens[i] += tokens[i + 2];
          ArrayPrototypeSplice(tokens, i + 1, 2);
          i--;
        }
      }
      return ArrayPrototypeFilter(tokens, (token: string) => token);
    } else {
      // Split string on new lines symbols
      const tokens: string[] = [],
        lines: string[] = StringPrototypeSplit(string, LINE_BREAK_PATTERN);

      // Ignore final empty token when text ends with a newline
      if (lines[lines.length - 1] === "") {
        ArrayPrototypePop(lines);
      }

      // Merge the content and line separators into single tokens
      for (let i = 0; i < lines.length; i++) {
        if (i % 2) {
          tokens[tokens.length - 1] += lines[i];
        } else {
          ArrayPrototypePush(tokens, lines[i]);
        }
      }
      return tokens;
    }
  }

  // Create details by filtering relevant word-diff for current line
  // and merge "space-diff" if surrounded by word-diff for cleaner displays
  function createDetails(
    line: DiffResult<string>,
    tokens: DiffResult<string>[],
  ) {
    return ArrayPrototypeMap(
      ArrayPrototypeFilter(
        tokens,
        ({ type }: DiffResult<string>) =>
          type === line.type || type === DiffType.common,
      ),
      (result: DiffResult<string>, i: number, t: DiffResult<string>[]) => {
        if (
          (result.type === DiffType.common) && (t[i - 1]) &&
          (t[i - 1]?.type === t[i + 1]?.type) &&
          WHITESPACE_PATTERN.test(result.value)
        ) {
          return {
            ...result,
            type: t[i - 1].type,
          };
        }
        return result;
      },
    );
  }

  // Compute multi-line diff
  const diffResult = diff(
    tokenize(`${unescape(A)}\n`),
    tokenize(`${unescape(B)}\n`),
  );

  const added: DiffResult<string>[] = [], removed: DiffResult<string>[] = [];
  for (let i = 0; i < diffResult.length; ++i) {
    const result = diffResult[i];
    if (result.type === DiffType.added) {
      ArrayPrototypePush(added, result);
    }
    if (result.type === DiffType.removed) {
      ArrayPrototypePush(removed, result);
    }
  }

  // Compute word-diff
  const aLines = added.length < removed.length ? added : removed;
  const bLines = aLines === removed ? added : removed;
  for (let i = 0; i < aLines.length; ++i) {
    const a = aLines[i];
    let tokens = [] as DiffResult<string>[],
      b: undefined | DiffResult<string>;
    // Search another diff line with at least one common token
    while (bLines.length !== 0) {
      b = ArrayPrototypeShift(bLines);
      tokens = diff(
        tokenize(a.value, { wordDiff: true }),
        tokenize(b?.value ?? "", { wordDiff: true }),
      );
      if (
        ArrayPrototypeSome(
          tokens,
          ({ type, value }) =>
            type === DiffType.common && StringPrototypeTrim(value).length,
        )
      ) {
        break;
      }
    }
    // Register word-diff details
    a.details = createDetails(a, tokens);
    if (b) {
      b.details = createDetails(b, tokens);
    }
  }

  return diffResult;
}

/**
 * Colors the output of assertion diffs
 * @param diffType Difference type, either added or removed
 */
function createColor(
  diffType: DiffType,
  { background = false } = { __proto__: null },
): (s: string) => string {
  // TODO(@littledivy): Remove this when we can detect
  // true color terminals.
  // https://github.com/denoland/deno_std/issues/2575
  background = false;
  switch (diffType) {
    case DiffType.added:
      return (s: string): string =>
        background ? bgGreen(white(s)) : green(bold(s));
    case DiffType.removed:
      return (s: string): string => background ? bgRed(white(s)) : red(bold(s));
    default:
      return white;
  }
}

/**
 * Prefixes `+` or `-` in diff output
 * @param diffType Difference type, either added or removed
 */
function createSign(diffType: DiffType): string {
  switch (diffType) {
    case DiffType.added:
      return "+   ";
    case DiffType.removed:
      return "-   ";
    default:
      return "    ";
  }
}

export function buildMessage(
  diffResult: ReadonlyArray<DiffResult<string>>,
  { stringDiff = false } = { __proto__: null },
): string[] {
  const messages: string[] = [], diffMessages: string[] = [];
  ArrayPrototypePush(messages, "");
  ArrayPrototypePush(messages, "");
  ArrayPrototypePush(
    messages,
    `    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${
      green(bold("Expected"))
    }`,
  );
  ArrayPrototypePush(messages, "");
  ArrayPrototypePush(messages, "");
  ArrayPrototypeForEach(diffResult, (result: DiffResult<string>) => {
    const c = createColor(result.type);

    const line = result.details != null
      ? ArrayPrototypeJoin(
        ArrayPrototypeMap(result.details, (detail) =>
          detail.type !== DiffType.common
            ? createColor(detail.type, { background: true })(detail.value)
            : detail.value),
        "",
      )
      : result.value;
    ArrayPrototypePush(diffMessages, c(`${createSign(result.type)}${line}`));
  });
  ArrayPrototypePushApply(
    messages,
    stringDiff ? [ArrayPrototypeJoin(diffMessages, "")] : diffMessages,
  );
  ArrayPrototypePush(messages, "");

  return messages;
}
