// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// vendored from std/assert/mod.ts

import { primordials } from "ext:core/mod.js";
const {
  DatePrototype,
  ArrayPrototypeJoin,
  ArrayPrototypeMap,
  DatePrototypeGetTime,
  Error,
  NumberIsNaN,
  Object,
  ObjectIs,
  ObjectKeys,
  ObjectPrototypeIsPrototypeOf,
  ReflectHas,
  ReflectOwnKeys,
  RegExpPrototype,
  RegExpPrototypeTest,
  SafeMap,
  SafeRegExp,
  String,
  StringPrototypeReplace,
  StringPrototypeSplit,
  SymbolIterator,
  TypeError,
  WeakMapPrototype,
  WeakSetPrototype,
  WeakRefPrototype,
  WeakRefPrototypeDeref,
} = primordials;

import { URLPrototype } from "ext:deno_url/00_url.js";
import { red } from "ext:deno_node/_util/std_fmt_colors.ts";
import {
  buildMessage,
  diff,
  diffstr,
} from "ext:deno_node/_util/std_testing_diff.ts";

const FORMAT_PATTERN = new SafeRegExp(/(?=["\\])/g);

/** Converts the input into a string. Objects, Sets and Maps are sorted so as to
 * make tests less flaky */
export function format(v: unknown): string {
  // deno-lint-ignore no-explicit-any
  const { Deno } = globalThis as any;
  return typeof Deno?.inspect === "function"
    ? Deno.inspect(v, {
      depth: Infinity,
      sorted: true,
      trailingComma: true,
      compact: false,
      iterableLimit: Infinity,
      // getters should be true in assertEquals.
      getters: true,
    })
    : `"${StringPrototypeReplace(String(v), FORMAT_PATTERN, "\\")}"`;
}

const CAN_NOT_DISPLAY = "[Cannot display]";

export class AssertionError extends Error {
  override name = "AssertionError";
  constructor(message: string) {
    super(message);
  }
}

function isKeyedCollection(
  x: unknown,
): x is { size: number; entries(): Iterable<[unknown, unknown]> } {
  return ReflectHas(x, SymbolIterator) && ReflectHas(x, "size");
}

/** Deep equality comparison used in assertions */
export function equal(c: unknown, d: unknown): boolean {
  const seen = new SafeMap();
  return (function compare(a: unknown, b: unknown): boolean {
    // Have to render RegExp & Date for string comparison
    // unless it's mistreated as object
    if (
      a &&
      b &&
      ((ObjectPrototypeIsPrototypeOf(RegExpPrototype, a) &&
        ObjectPrototypeIsPrototypeOf(RegExpPrototype, b)) ||
        (ObjectPrototypeIsPrototypeOf(URLPrototype, a) &&
          ObjectPrototypeIsPrototypeOf(URLPrototype, b)))
    ) {
      return String(a) === String(b);
    }
    if (
      ObjectPrototypeIsPrototypeOf(DatePrototype, a) &&
      ObjectPrototypeIsPrototypeOf(DatePrototype, b)
    ) {
      const aTime = DatePrototypeGetTime(a);
      const bTime = DatePrototypeGetTime(b);
      // Check for NaN equality manually since NaN is not
      // equal to itself.
      if (NumberIsNaN(aTime) && NumberIsNaN(bTime)) {
        return true;
      }
      return aTime === bTime;
    }
    if (typeof a === "number" && typeof b === "number") {
      return NumberIsNaN(a) && NumberIsNaN(b) || a === b;
    }
    if (ObjectIs(a, b)) {
      return true;
    }
    if (a && typeof a === "object" && b && typeof b === "object") {
      if (a && b && !constructorsEqual(a, b)) {
        return false;
      }
      if (
        ObjectPrototypeIsPrototypeOf(WeakMapPrototype, a) ||
        ObjectPrototypeIsPrototypeOf(WeakMapPrototype, b)
      ) {
        if (
          !(ObjectPrototypeIsPrototypeOf(WeakMapPrototype, a) &&
            ObjectPrototypeIsPrototypeOf(WeakMapPrototype, b))
        ) return false;
        throw new TypeError("cannot compare WeakMap instances");
      }
      if (
        ObjectPrototypeIsPrototypeOf(WeakSetPrototype, a) ||
        ObjectPrototypeIsPrototypeOf(WeakSetPrototype, b)
      ) {
        if (
          !(ObjectPrototypeIsPrototypeOf(WeakSetPrototype, a) &&
            ObjectPrototypeIsPrototypeOf(WeakSetPrototype, b))
        ) return false;
        throw new TypeError("cannot compare WeakSet instances");
      }
      if (seen.get(a) === b) {
        return true;
      }
      if (ObjectKeys(a || {}).length !== ObjectKeys(b || {}).length) {
        return false;
      }
      seen.set(a, b);
      if (isKeyedCollection(a) && isKeyedCollection(b)) {
        if (a.size !== b.size) {
          return false;
        }

        let unmatchedEntries = a.size;

        // TODO(petamoriken): use primordials
        // deno-lint-ignore prefer-primordials
        for (const [aKey, aValue] of a.entries()) {
          // deno-lint-ignore prefer-primordials
          for (const [bKey, bValue] of b.entries()) {
            /* Given that Map keys can be references, we need
             * to ensure that they are also deeply equal */
            if (
              (aKey === aValue && bKey === bValue && compare(aKey, bKey)) ||
              (compare(aKey, bKey) && compare(aValue, bValue))
            ) {
              unmatchedEntries--;
              break;
            }
          }
        }
        return unmatchedEntries === 0;
      }

      const merged = { ...a, ...b };
      const keys = ReflectOwnKeys(merged);
      for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        type Key = keyof typeof merged;
        if (!compare(a && a[key as Key], b && b[key as Key])) {
          return false;
        }
        if (
          (ReflectHas(a, key) && !ReflectHas(b, key)) ||
          (ReflectHas(b, key) && !ReflectHas(a, key))
        ) {
          return false;
        }
      }

      if (
        ObjectPrototypeIsPrototypeOf(WeakRefPrototype, a) ||
        ObjectPrototypeIsPrototypeOf(WeakRefPrototype, b)
      ) {
        if (
          !(ObjectPrototypeIsPrototypeOf(WeakRefPrototype, a) &&
            ObjectPrototypeIsPrototypeOf(WeakRefPrototype, b))
        ) return false;
        return compare(WeakRefPrototypeDeref(a), WeakRefPrototypeDeref(b));
      }
      return true;
    }
    return false;
  })(c, d);
}

function constructorsEqual(a: object, b: object) {
  return a.constructor === b.constructor ||
    a.constructor === Object && !b.constructor ||
    !a.constructor && b.constructor === Object;
}

/** Make an assertion, error will be thrown if `expr` does not have truthy value. */
export function assert(expr: unknown, msg = ""): asserts expr {
  if (!expr) {
    throw new AssertionError(msg);
  }
}

/** Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw. */
export function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (equal(actual, expected)) {
    return;
  }
  let message = "";
  const actualString = format(actual);
  const expectedString = format(expected);
  try {
    const stringDiff = (typeof actual === "string") &&
      (typeof expected === "string");
    const diffResult = stringDiff
      ? diffstr(actual as string, expected as string)
      : diff(
        StringPrototypeSplit(actualString, "\n"),
        StringPrototypeSplit(expectedString, "\n"),
      );
    const diffMsg = ArrayPrototypeJoin(
      buildMessage(diffResult, { stringDiff }),
      "\n",
    );
    message = `Values are not equal:\n${diffMsg}`;
  } catch {
    message = `\n${red(red(CAN_NOT_DISPLAY))} + \n\n`;
  }
  if (msg) {
    message = msg;
  }
  throw new AssertionError(message);
}

/** Make an assertion that `actual` and `expected` are not equal, deeply.
 * If not then throw. */
export function assertNotEquals<T>(actual: T, expected: T, msg?: string) {
  if (!equal(actual, expected)) {
    return;
  }
  let actualString: string;
  let expectedString: string;
  try {
    actualString = String(actual);
  } catch {
    actualString = "[Cannot display]";
  }
  try {
    expectedString = String(expected);
  } catch {
    expectedString = "[Cannot display]";
  }
  if (!msg) {
    msg = `actual: ${actualString} expected not to be: ${expectedString}`;
  }
  throw new AssertionError(msg);
}

/** Make an assertion that `actual` and `expected` are strictly equal. If
 * not then throw. */
export function assertStrictEquals<T>(
  actual: unknown,
  expected: T,
  msg?: string,
): asserts actual is T {
  if (ObjectIs(actual, expected)) {
    return;
  }

  let message: string;

  if (msg) {
    message = msg;
  } else {
    const actualString = format(actual);
    const expectedString = format(expected);

    if (actualString === expectedString) {
      const withOffset = ArrayPrototypeJoin(
        ArrayPrototypeMap(
          StringPrototypeSplit(actualString, "\n"),
          (l: string) => `    ${l}`,
        ),
        "\n",
      );
      message =
        `Values have the same structure but are not reference-equal:\n\n${
          red(withOffset)
        }\n`;
    } else {
      try {
        const stringDiff = (typeof actual === "string") &&
          (typeof expected === "string");
        const diffResult = stringDiff
          ? diffstr(actual as string, expected as string)
          : diff(
            StringPrototypeSplit(actualString, "\n"),
            StringPrototypeSplit(expectedString, "\n"),
          );
        const diffMsg = ArrayPrototypeJoin(
          buildMessage(diffResult, { stringDiff }),
          "\n",
        );
        message = `Values are not strictly equal:\n${diffMsg}`;
      } catch {
        message = `\n${CAN_NOT_DISPLAY} + \n\n`;
      }
    }
  }

  throw new AssertionError(message);
}

/** Make an assertion that `actual` and `expected` are not strictly equal.
 * If the values are strictly equal then throw. */
export function assertNotStrictEquals<T>(
  actual: T,
  expected: T,
  msg?: string,
) {
  if (!ObjectIs(actual, expected)) {
    return;
  }

  throw new AssertionError(
    msg ?? `Expected "actual" to be strictly unequal to: ${format(actual)}\n`,
  );
}

/** Make an assertion that `actual` match RegExp `expected`. If not
 * then throw. */
export function assertMatch(
  actual: string,
  expected: RegExp,
  msg?: string,
) {
  if (!RegExpPrototypeTest(expected, actual)) {
    if (!msg) {
      msg = `actual: "${actual}" expected to match: "${expected}"`;
    }
    throw new AssertionError(msg);
  }
}

/** Make an assertion that `actual` not match RegExp `expected`. If match
 * then throw. */
export function assertNotMatch(
  actual: string,
  expected: RegExp,
  msg?: string,
) {
  if (RegExpPrototypeTest(expected, actual)) {
    if (!msg) {
      msg = `actual: "${actual}" expected to not match: "${expected}"`;
    }
    throw new AssertionError(msg);
  }
}
