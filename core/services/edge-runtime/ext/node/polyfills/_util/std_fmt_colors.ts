// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This file is vendored from std/fmt/colors.ts

import { primordials } from "ext:core/mod.js";
const {
  ArrayPrototypeJoin,
  MathMax,
  MathMin,
  MathTrunc,
  SafeRegExp,
  StringPrototypeReplace,
} = primordials;

// TODO(kt3k): Initialize this at the start of runtime
// based on Deno.noColor
const noColor = false;

interface Code {
  open: string;
  close: string;
  regexp: RegExp;
}

/** RGB 8-bits per channel. Each in range `0->255` or `0x00->0xff` */
interface Rgb {
  r: number;
  g: number;
  b: number;
}

let enabled = !noColor;

/**
 * Set changing text color to enabled or disabled
 * @param value
 */
export function setColorEnabled(value: boolean) {
  if (noColor) {
    return;
  }

  enabled = value;
}

/** Get whether text color change is enabled or disabled. */
export function getColorEnabled(): boolean {
  return enabled;
}

/**
 * Builds color code
 * @param open
 * @param close
 */
function code(open: number[], close: number): Code {
  return {
    open: `\x1b[${ArrayPrototypeJoin(open, ";")}m`,
    close: `\x1b[${close}m`,
    regexp: new SafeRegExp(`\\x1b\\[${close}m`, "g"),
  };
}

/**
 * Applies color and background based on color code and its associated text
 * @param str text to apply color settings to
 * @param code color code to apply
 */
function run(str: string, code: Code): string {
  return enabled
    ? `${code.open}${
      StringPrototypeReplace(str, code.regexp, code.open)
    }${code.close}`
    : str;
}

/**
 * Reset the text modified
 * @param str text to reset
 */
export function reset(str: string): string {
  return run(str, code([0], 0));
}

/**
 * Make the text bold.
 * @param str text to make bold
 */
export function bold(str: string): string {
  return run(str, code([1], 22));
}

/**
 * The text emits only a small amount of light.
 * @param str text to dim
 */
export function dim(str: string): string {
  return run(str, code([2], 22));
}

/**
 * Make the text italic.
 * @param str text to make italic
 */
export function italic(str: string): string {
  return run(str, code([3], 23));
}

/**
 * Make the text underline.
 * @param str text to underline
 */
export function underline(str: string): string {
  return run(str, code([4], 24));
}

/**
 * Invert background color and text color.
 * @param str text to invert its color
 */
export function inverse(str: string): string {
  return run(str, code([7], 27));
}

/**
 * Make the text hidden.
 * @param str text to hide
 */
export function hidden(str: string): string {
  return run(str, code([8], 28));
}

/**
 * Put horizontal line through the center of the text.
 * @param str text to strike through
 */
export function strikethrough(str: string): string {
  return run(str, code([9], 29));
}

/**
 * Set text color to black.
 * @param str text to make black
 */
export function black(str: string): string {
  return run(str, code([30], 39));
}

/**
 * Set text color to red.
 * @param str text to make red
 */
export function red(str: string): string {
  return run(str, code([31], 39));
}

/**
 * Set text color to green.
 * @param str text to make green
 */
export function green(str: string): string {
  return run(str, code([32], 39));
}

/**
 * Set text color to yellow.
 * @param str text to make yellow
 */
export function yellow(str: string): string {
  return run(str, code([33], 39));
}

/**
 * Set text color to blue.
 * @param str text to make blue
 */
export function blue(str: string): string {
  return run(str, code([34], 39));
}

/**
 * Set text color to magenta.
 * @param str text to make magenta
 */
export function magenta(str: string): string {
  return run(str, code([35], 39));
}

/**
 * Set text color to cyan.
 * @param str text to make cyan
 */
export function cyan(str: string): string {
  return run(str, code([36], 39));
}

/**
 * Set text color to white.
 * @param str text to make white
 */
export function white(str: string): string {
  return run(str, code([37], 39));
}

/**
 * Set text color to gray.
 * @param str text to make gray
 */
export function gray(str: string): string {
  return brightBlack(str);
}

/**
 * Set text color to bright black.
 * @param str text to make bright-black
 */
export function brightBlack(str: string): string {
  return run(str, code([90], 39));
}

/**
 * Set text color to bright red.
 * @param str text to make bright-red
 */
export function brightRed(str: string): string {
  return run(str, code([91], 39));
}

/**
 * Set text color to bright green.
 * @param str text to make bright-green
 */
export function brightGreen(str: string): string {
  return run(str, code([92], 39));
}

/**
 * Set text color to bright yellow.
 * @param str text to make bright-yellow
 */
export function brightYellow(str: string): string {
  return run(str, code([93], 39));
}

/**
 * Set text color to bright blue.
 * @param str text to make bright-blue
 */
export function brightBlue(str: string): string {
  return run(str, code([94], 39));
}

/**
 * Set text color to bright magenta.
 * @param str text to make bright-magenta
 */
export function brightMagenta(str: string): string {
  return run(str, code([95], 39));
}

/**
 * Set text color to bright cyan.
 * @param str text to make bright-cyan
 */
export function brightCyan(str: string): string {
  return run(str, code([96], 39));
}

/**
 * Set text color to bright white.
 * @param str text to make bright-white
 */
export function brightWhite(str: string): string {
  return run(str, code([97], 39));
}

/**
 * Set background color to black.
 * @param str text to make its background black
 */
export function bgBlack(str: string): string {
  return run(str, code([40], 49));
}

/**
 * Set background color to red.
 * @param str text to make its background red
 */
export function bgRed(str: string): string {
  return run(str, code([41], 49));
}

/**
 * Set background color to green.
 * @param str text to make its background green
 */
export function bgGreen(str: string): string {
  return run(str, code([42], 49));
}

/**
 * Set background color to yellow.
 * @param str text to make its background yellow
 */
export function bgYellow(str: string): string {
  return run(str, code([43], 49));
}

/**
 * Set background color to blue.
 * @param str text to make its background blue
 */
export function bgBlue(str: string): string {
  return run(str, code([44], 49));
}

/**
 *  Set background color to magenta.
 * @param str text to make its background magenta
 */
export function bgMagenta(str: string): string {
  return run(str, code([45], 49));
}

/**
 * Set background color to cyan.
 * @param str text to make its background cyan
 */
export function bgCyan(str: string): string {
  return run(str, code([46], 49));
}

/**
 * Set background color to white.
 * @param str text to make its background white
 */
export function bgWhite(str: string): string {
  return run(str, code([47], 49));
}

/**
 * Set background color to bright black.
 * @param str text to make its background bright-black
 */
export function bgBrightBlack(str: string): string {
  return run(str, code([100], 49));
}

/**
 * Set background color to bright red.
 * @param str text to make its background bright-red
 */
export function bgBrightRed(str: string): string {
  return run(str, code([101], 49));
}

/**
 * Set background color to bright green.
 * @param str text to make its background bright-green
 */
export function bgBrightGreen(str: string): string {
  return run(str, code([102], 49));
}

/**
 * Set background color to bright yellow.
 * @param str text to make its background bright-yellow
 */
export function bgBrightYellow(str: string): string {
  return run(str, code([103], 49));
}

/**
 * Set background color to bright blue.
 * @param str text to make its background bright-blue
 */
export function bgBrightBlue(str: string): string {
  return run(str, code([104], 49));
}

/**
 * Set background color to bright magenta.
 * @param str text to make its background bright-magenta
 */
export function bgBrightMagenta(str: string): string {
  return run(str, code([105], 49));
}

/**
 * Set background color to bright cyan.
 * @param str text to make its background bright-cyan
 */
export function bgBrightCyan(str: string): string {
  return run(str, code([106], 49));
}

/**
 * Set background color to bright white.
 * @param str text to make its background bright-white
 */
export function bgBrightWhite(str: string): string {
  return run(str, code([107], 49));
}

/* Special Color Sequences */

/**
 * Clam and truncate color codes
 * @param n
 * @param max number to truncate to
 * @param min number to truncate from
 */
function clampAndTruncate(n: number, max = 255, min = 0): number {
  return MathTrunc(MathMax(MathMin(n, max), min));
}

/**
 * Set text color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit colors to
 * @param color code
 */
export function rgb8(str: string, color: number): string {
  return run(str, code([38, 5, clampAndTruncate(color)], 39));
}

/**
 * Set background color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit background colors to
 * @param color code
 */
export function bgRgb8(str: string, color: number): string {
  return run(str, code([48, 5, clampAndTruncate(color)], 49));
}

/**
 * Set text color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 *      import { rgb24 } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";
 *      rgb24("foo", 0xff00ff);
 *      rgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */
export function rgb24(str: string, color: number | Rgb): string {
  if (typeof color === "number") {
    return run(
      str,
      code(
        [38, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff],
        39,
      ),
    );
  }
  return run(
    str,
    code(
      [
        38,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b),
      ],
      39,
    ),
  );
}

/**
 * Set background color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 *      import { bgRgb24 } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";
 *      bgRgb24("foo", 0xff00ff);
 *      bgRgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */
export function bgRgb24(str: string, color: number | Rgb): string {
  if (typeof color === "number") {
    return run(
      str,
      code(
        [48, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff],
        49,
      ),
    );
  }
  return run(
    str,
    code(
      [
        48,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b),
      ],
      49,
    ),
  );
}

// https://github.com/chalk/ansi-regex/blob/02fa893d619d3da85411acc8fd4e2eea0e95a9d9/index.js
const ANSI_PATTERN = new SafeRegExp(
  ArrayPrototypeJoin([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
  ], "|"),
  "g",
);

/**
 * Remove ANSI escape codes from the string.
 * @param string to remove ANSI escape codes from
 */
export function stripColor(string: string): string {
  return StringPrototypeReplace(string, ANSI_PATTERN, "");
}
