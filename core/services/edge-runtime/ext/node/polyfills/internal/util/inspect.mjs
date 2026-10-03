// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import {
  validateObject,
  validateOneOf,
  validateString,
} from "ext:deno_node/internal/validators.mjs";
import { codes } from "ext:deno_node/internal/error_codes.ts";
import {
  colors,
  createStylizeWithColor,
  formatBigInt,
  formatNumber,
  formatValue,
  styles,
} from "ext:deno_console/01_console.js";

// Set Graphics Rendition https://en.wikipedia.org/wiki/ANSI_escape_code#graphics
// Each color consists of an array with the color code as first entry and the
// reset code as second entry.
const defaultFG = 39;
const defaultBG = 49;
inspect.colors = {
  reset: [0, 0],
  bold: [1, 22],
  dim: [2, 22], // Alias: faint
  italic: [3, 23],
  underline: [4, 24],
  blink: [5, 25],
  // Swap foreground and background colors
  inverse: [7, 27], // Alias: swapcolors, swapColors
  hidden: [8, 28], // Alias: conceal
  strikethrough: [9, 29], // Alias: strikeThrough, crossedout, crossedOut
  doubleunderline: [21, 24], // Alias: doubleUnderline
  black: [30, defaultFG],
  red: [31, defaultFG],
  green: [32, defaultFG],
  yellow: [33, defaultFG],
  blue: [34, defaultFG],
  magenta: [35, defaultFG],
  cyan: [36, defaultFG],
  white: [37, defaultFG],
  bgBlack: [40, defaultBG],
  bgRed: [41, defaultBG],
  bgGreen: [42, defaultBG],
  bgYellow: [43, defaultBG],
  bgBlue: [44, defaultBG],
  bgMagenta: [45, defaultBG],
  bgCyan: [46, defaultBG],
  bgWhite: [47, defaultBG],
  framed: [51, 54],
  overlined: [53, 55],
  gray: [90, defaultFG], // Alias: grey, blackBright
  redBright: [91, defaultFG],
  greenBright: [92, defaultFG],
  yellowBright: [93, defaultFG],
  blueBright: [94, defaultFG],
  magentaBright: [95, defaultFG],
  cyanBright: [96, defaultFG],
  whiteBright: [97, defaultFG],
  bgGray: [100, defaultBG], // Alias: bgGrey, bgBlackBright
  bgRedBright: [101, defaultBG],
  bgGreenBright: [102, defaultBG],
  bgYellowBright: [103, defaultBG],
  bgBlueBright: [104, defaultBG],
  bgMagentaBright: [105, defaultBG],
  bgCyanBright: [106, defaultBG],
  bgWhiteBright: [107, defaultBG],
};

function defineColorAlias(target, alias) {
  Object.defineProperty(inspect.colors, alias, {
    get() {
      return this[target];
    },
    set(value) {
      this[target] = value;
    },
    configurable: true,
    enumerable: false,
  });
}

defineColorAlias("gray", "grey");
defineColorAlias("gray", "blackBright");
defineColorAlias("bgGray", "bgGrey");
defineColorAlias("bgGray", "bgBlackBright");
defineColorAlias("dim", "faint");
defineColorAlias("strikethrough", "crossedout");
defineColorAlias("strikethrough", "strikeThrough");
defineColorAlias("strikethrough", "crossedOut");
defineColorAlias("hidden", "conceal");
defineColorAlias("inverse", "swapColors");
defineColorAlias("inverse", "swapcolors");
defineColorAlias("doubleunderline", "doubleUnderline");

// TODO(BridgeAR): Add function style support for more complex styles.
// Don't use 'blue' not visible on cmd.exe
inspect.styles = Object.assign(Object.create(null), {
  special: "cyan",
  number: "yellow",
  bigint: "yellow",
  boolean: "yellow",
  undefined: "grey",
  null: "bold",
  string: "green",
  symbol: "green",
  date: "magenta",
  // "name": intentionally not styling
  // TODO(BridgeAR): Highlight regular expressions properly.
  regexp: "red",
  module: "underline",
});

const inspectDefaultOptions = {
  indentationLvl: 0,
  currentDepth: 0,
  stylize: stylizeNoColor,

  showHidden: false,
  depth: 2,
  colors: false,
  showProxy: false,
  breakLength: 80,
  escapeSequences: true,
  compact: 3,
  sorted: false,
  getters: false,

  // node only
  maxArrayLength: 100,
  maxStringLength: 10000, // deno: strAbbreviateSize: 100
  customInspect: true,

  // deno only
  /** You can override the quotes preference in inspectString.
   * Used by util.inspect() */
  // TODO(kt3k): Consider using symbol as a key to hide this from the public
  // API.
  quotes: ["'", '"', "`"],
  iterableLimit: Infinity, // similar to node's maxArrayLength, but doesn't only apply to arrays
  trailingComma: false,

  inspect,

  // TODO(@crowlKats): merge into indentationLvl
  indentLevel: 0,
};

/**
 * Echos the value of any input. Tries to print the value out
 * in the best way possible given the different types.
 */
/* Legacy: value, showHidden, depth, colors */
export function inspect(value, opts) {
  // Default options
  const ctx = {
    budget: {},
    seen: [],
    ...inspectDefaultOptions,
  };
  if (arguments.length > 1) {
    // Legacy...
    if (arguments.length > 2) {
      if (arguments[2] !== undefined) {
        ctx.depth = arguments[2];
      }
      if (arguments.length > 3 && arguments[3] !== undefined) {
        ctx.colors = arguments[3];
      }
    }
    // Set user-specified options
    if (typeof opts === "boolean") {
      ctx.showHidden = opts;
    } else if (opts) {
      const optKeys = Object.keys(opts);
      for (let i = 0; i < optKeys.length; ++i) {
        const key = optKeys[i];
        // TODO(BridgeAR): Find a solution what to do about stylize. Either make
        // this function public or add a new API with a similar or better
        // functionality.
        if (
          // deno-lint-ignore no-prototype-builtins
          inspectDefaultOptions.hasOwnProperty(key) ||
          key === "stylize"
        ) {
          ctx[key] = opts[key];
        } else if (ctx.userOptions === undefined) {
          // This is required to pass through the actual user input.
          ctx.userOptions = opts;
        }
      }
    }
  }
  if (ctx.colors) {
    ctx.stylize = createStylizeWithColor(inspect.styles, inspect.colors);
  }
  if (ctx.maxArrayLength === null) ctx.maxArrayLength = Infinity;
  if (ctx.maxStringLength === null) ctx.maxStringLength = Infinity;
  return formatValue(ctx, value, 0);
}
const customInspectSymbol = Symbol.for("nodejs.util.inspect.custom");
inspect.custom = customInspectSymbol;

Object.defineProperty(inspect, "defaultOptions", {
  get() {
    return inspectDefaultOptions;
  },
  set(options) {
    validateObject(options, "options");
    return Object.assign(inspectDefaultOptions, options);
  },
});

function stylizeNoColor(str) {
  return str;
}

const builtInObjects = new Set(
  Object.getOwnPropertyNames(globalThis).filter((e) =>
    /^[A-Z][a-zA-Z0-9]+$/.test(e)
  ),
);

// Regex used for ansi escape code splitting
// Adopted from https://github.com/chalk/ansi-regex/blob/HEAD/index.js
// License: MIT, authors: @sindresorhus, Qix-, arjunmehta and LitoMore
// Matches all ansi escape code sequences in a string
const ansiPattern = "[\\u001B\\u009B][[\\]()#;?]*" +
  "(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*" +
  "|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)" +
  "|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))";
const ansi = new RegExp(ansiPattern, "g");

/**
 * Returns the number of columns required to display the given string.
 */
export function getStringWidth(str, removeControlChars = true) {
  let width = 0;

  if (removeControlChars) {
    str = stripVTControlCharacters(str);
  }
  str = str.normalize("NFC");
  for (const char of str[Symbol.iterator]()) {
    const code = char.codePointAt(0);
    if (isFullWidthCodePoint(code)) {
      width += 2;
    } else if (!isZeroWidthCodePoint(code)) {
      width++;
    }
  }

  return width;
}

/**
 * Returns true if the character represented by a given
 * Unicode code point is full-width. Otherwise returns false.
 */
const isFullWidthCodePoint = (code) => {
  // Code points are partially derived from:
  // https://www.unicode.org/Public/UNIDATA/EastAsianWidth.txt
  return code >= 0x1100 && (
    code <= 0x115f || // Hangul Jamo
    code === 0x2329 || // LEFT-POINTING ANGLE BRACKET
    code === 0x232a || // RIGHT-POINTING ANGLE BRACKET
    // CJK Radicals Supplement .. Enclosed CJK Letters and Months
    (code >= 0x2e80 && code <= 0x3247 && code !== 0x303f) ||
    // Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
    (code >= 0x3250 && code <= 0x4dbf) ||
    // CJK Unified Ideographs .. Yi Radicals
    (code >= 0x4e00 && code <= 0xa4c6) ||
    // Hangul Jamo Extended-A
    (code >= 0xa960 && code <= 0xa97c) ||
    // Hangul Syllables
    (code >= 0xac00 && code <= 0xd7a3) ||
    // CJK Compatibility Ideographs
    (code >= 0xf900 && code <= 0xfaff) ||
    // Vertical Forms
    (code >= 0xfe10 && code <= 0xfe19) ||
    // CJK Compatibility Forms .. Small Form Variants
    (code >= 0xfe30 && code <= 0xfe6b) ||
    // Halfwidth and Fullwidth Forms
    (code >= 0xff01 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    // Kana Supplement
    (code >= 0x1b000 && code <= 0x1b001) ||
    // Enclosed Ideographic Supplement
    (code >= 0x1f200 && code <= 0x1f251) ||
    // Miscellaneous Symbols and Pictographs 0x1f300 - 0x1f5ff
    // Emoticons 0x1f600 - 0x1f64f
    (code >= 0x1f300 && code <= 0x1f64f) ||
    // CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
    (code >= 0x20000 && code <= 0x3fffd)
  );
};

const isZeroWidthCodePoint = (code) => {
  return code <= 0x1F || // C0 control codes
    (code >= 0x7F && code <= 0x9F) || // C1 control codes
    (code >= 0x300 && code <= 0x36F) || // Combining Diacritical Marks
    (code >= 0x200B && code <= 0x200F) || // Modifying Invisible Characters
    // Combining Diacritical Marks for Symbols
    (code >= 0x20D0 && code <= 0x20FF) ||
    (code >= 0xFE00 && code <= 0xFE0F) || // Variation Selectors
    (code >= 0xFE20 && code <= 0xFE2F) || // Combining Half Marks
    (code >= 0xE0100 && code <= 0xE01EF); // Variation Selectors
};

function hasBuiltInToString(value) {
  // TODO(wafuwafu13): Implement
  // // Prevent triggering proxy traps.
  // const getFullProxy = false;
  // const proxyTarget = getProxyDetails(value, getFullProxy);
  const proxyTarget = undefined;
  if (proxyTarget !== undefined) {
    value = proxyTarget;
  }

  // Count objects that have no `toString` function as built-in.
  if (typeof value.toString !== "function") {
    return true;
  }

  // The object has a own `toString` property. Thus it's not a built-in one.
  if (Object.prototype.hasOwnProperty.call(value, "toString")) {
    return false;
  }

  // Find the object that has the `toString` property as own property in the
  // prototype chain.
  let pointer = value;
  do {
    pointer = Object.getPrototypeOf(pointer);
  } while (!Object.prototype.hasOwnProperty.call(pointer, "toString"));

  // Check closer if the object is a built-in.
  const descriptor = Object.getOwnPropertyDescriptor(pointer, "constructor");
  return descriptor !== undefined &&
    typeof descriptor.value === "function" &&
    builtInObjects.has(descriptor.value.name);
}

const firstErrorLine = (error) => error.message.split("\n", 1)[0];
let CIRCULAR_ERROR_MESSAGE;
function tryStringify(arg) {
  try {
    return JSON.stringify(arg);
  } catch (err) {
    // Populate the circular error message lazily
    if (!CIRCULAR_ERROR_MESSAGE) {
      try {
        const a = {};
        a.a = a;
        JSON.stringify(a);
      } catch (circularError) {
        CIRCULAR_ERROR_MESSAGE = firstErrorLine(circularError);
      }
    }
    if (
      err.name === "TypeError" &&
      firstErrorLine(err) === CIRCULAR_ERROR_MESSAGE
    ) {
      return "[Circular]";
    }
    throw err;
  }
}

export function format(...args) {
  return formatWithOptionsInternal(undefined, args);
}

export function formatWithOptions(inspectOptions, ...args) {
  if (typeof inspectOptions !== "object" || inspectOptions === null) {
    throw new codes.ERR_INVALID_ARG_TYPE(
      "inspectOptions",
      "object",
      inspectOptions,
    );
  }
  return formatWithOptionsInternal(inspectOptions, args);
}

function formatNumberNoColor(number, options) {
  return formatNumber(
    stylizeNoColor,
    number,
    options?.numericSeparator ?? inspectDefaultOptions.numericSeparator,
  );
}

function formatBigIntNoColor(bigint, options) {
  return formatBigInt(
    stylizeNoColor,
    bigint,
    options?.numericSeparator ?? inspectDefaultOptions.numericSeparator,
  );
}

function formatWithOptionsInternal(inspectOptions, args) {
  const first = args[0];
  let a = 0;
  let str = "";
  let join = "";

  if (typeof first === "string") {
    if (args.length === 1) {
      return first;
    }
    let tempStr;
    let lastPos = 0;

    for (let i = 0; i < first.length - 1; i++) {
      if (first.charCodeAt(i) === 37) { // '%'
        const nextChar = first.charCodeAt(++i);
        if (a + 1 !== args.length) {
          switch (nextChar) {
            // deno-lint-ignore no-case-declarations
            case 115: // 's'
              const tempArg = args[++a];
              if (typeof tempArg === "number") {
                tempStr = formatNumberNoColor(tempArg, inspectOptions);
              } else if (typeof tempArg === "bigint") {
                tempStr = formatBigIntNoColor(tempArg, inspectOptions);
              } else if (
                typeof tempArg !== "object" ||
                tempArg === null ||
                !hasBuiltInToString(tempArg)
              ) {
                tempStr = String(tempArg);
              } else {
                tempStr = inspect(tempArg, {
                  ...inspectOptions,
                  compact: 3,
                  colors: false,
                  depth: 0,
                });
              }
              break;
            case 106: // 'j'
              tempStr = tryStringify(args[++a]);
              break;
            // deno-lint-ignore no-case-declarations
            case 100: // 'd'
              const tempNum = args[++a];
              if (typeof tempNum === "bigint") {
                tempStr = formatBigIntNoColor(tempNum, inspectOptions);
              } else if (typeof tempNum === "symbol") {
                tempStr = "NaN";
              } else {
                tempStr = formatNumberNoColor(Number(tempNum), inspectOptions);
              }
              break;
            case 79: // 'O'
              tempStr = inspect(args[++a], inspectOptions);
              break;
            case 111: // 'o'
              tempStr = inspect(args[++a], {
                ...inspectOptions,
                showHidden: true,
                showProxy: true,
                depth: 4,
              });
              break;
            // deno-lint-ignore no-case-declarations
            case 105: // 'i'
              const tempInteger = args[++a];
              if (typeof tempInteger === "bigint") {
                tempStr = formatBigIntNoColor(tempInteger, inspectOptions);
              } else if (typeof tempInteger === "symbol") {
                tempStr = "NaN";
              } else {
                tempStr = formatNumberNoColor(
                  Number.parseInt(tempInteger),
                  inspectOptions,
                );
              }
              break;
            // deno-lint-ignore no-case-declarations
            case 102: // 'f'
              const tempFloat = args[++a];
              if (typeof tempFloat === "symbol") {
                tempStr = "NaN";
              } else {
                tempStr = formatNumberNoColor(
                  Number.parseFloat(tempFloat),
                  inspectOptions,
                );
              }
              break;
            case 99: // 'c'
              a += 1;
              tempStr = "";
              break;
            case 37: // '%'
              str += first.slice(lastPos, i);
              lastPos = i + 1;
              continue;
            default: // Any other character is not a correct placeholder
              continue;
          }
          if (lastPos !== i - 1) {
            str += first.slice(lastPos, i - 1);
          }
          str += tempStr;
          lastPos = i + 1;
        } else if (nextChar === 37) {
          str += first.slice(lastPos, i);
          lastPos = i + 1;
        }
      }
    }
    if (lastPos !== 0) {
      a++;
      join = " ";
      if (lastPos < first.length) {
        str += first.slice(lastPos);
      }
    }
  }

  while (a < args.length) {
    const value = args[a];
    str += join;
    str += typeof value !== "string" ? inspect(value, inspectOptions) : value;
    join = " ";
    a++;
  }
  return str;
}

/**
 * Remove all VT control characters. Use to estimate displayed string width.
 */
export function stripVTControlCharacters(str) {
  validateString(str, "str");

  return str.replace(ansi, "");
}

export function styleText(format, text) {
  validateString(text, "text");

  if (Array.isArray(format)) {
    for (let i = 0; i < format.length; i++) {
      const item = format[i];
      const formatCodes = inspect.colors[item];
      if (formatCodes == null) {
        validateOneOf(item, "format", Object.keys(inspect.colors));
      }
      text = `\u001b[${formatCodes[0]}m${text}\u001b[${formatCodes[1]}m`;
    }
    return text;
  }

  const formatCodes = inspect.colors[format];
  if (formatCodes == null) {
    validateOneOf(format, "format", Object.keys(inspect.colors));
  }
  return `\u001b[${formatCodes[0]}m${text}\u001b[${formatCodes[1]}m`;
}

export default {
  format,
  getStringWidth,
  inspect,
  stripVTControlCharacters,
  formatWithOptions,
  styleText,
};
