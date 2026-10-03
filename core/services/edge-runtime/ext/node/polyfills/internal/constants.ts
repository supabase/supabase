// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { isWindows } from "ext:deno_node/_util/os.ts";

// Alphabet chars.
export const CHAR_UPPERCASE_A = 65; /* A */
export const CHAR_LOWERCASE_A = 97; /* a */
export const CHAR_UPPERCASE_Z = 90; /* Z */
export const CHAR_LOWERCASE_Z = 122; /* z */
export const CHAR_UPPERCASE_C = 67; /* C */
export const CHAR_LOWERCASE_B = 98; /* b */
export const CHAR_LOWERCASE_E = 101; /* e */
export const CHAR_LOWERCASE_N = 110; /* n */

// Non-alphabetic chars.
export const CHAR_DOT = 46; /* . */
export const CHAR_FORWARD_SLASH = 47; /* / */
export const CHAR_BACKWARD_SLASH = 92; /* \ */
export const CHAR_VERTICAL_LINE = 124; /* | */
export const CHAR_COLON = 58; /* = */
export const CHAR_QUESTION_MARK = 63; /* ? */
export const CHAR_UNDERSCORE = 95; /* _ */
export const CHAR_LINE_FEED = 10; /* \n */
export const CHAR_CARRIAGE_RETURN = 13; /* \r */
export const CHAR_TAB = 9; /* \t */
export const CHAR_FORM_FEED = 12; /* \f */
export const CHAR_EXCLAMATION_MARK = 33; /* ! */
export const CHAR_HASH = 35; /* # */
export const CHAR_SPACE = 32; /*   */
export const CHAR_NO_BREAK_SPACE = 160; /* \u00A0 */
export const CHAR_ZERO_WIDTH_NOBREAK_SPACE = 65279; /* \uFEFF */
export const CHAR_LEFT_SQUARE_BRACKET = 91; /* [ */
export const CHAR_RIGHT_SQUARE_BRACKET = 93; /* ] */
export const CHAR_LEFT_ANGLE_BRACKET = 60; /* < */
export const CHAR_RIGHT_ANGLE_BRACKET = 62; /* > */
export const CHAR_LEFT_CURLY_BRACKET = 123; /* { */
export const CHAR_RIGHT_CURLY_BRACKET = 125; /* } */
export const CHAR_HYPHEN_MINUS = 45; /* - */
export const CHAR_PLUS = 43; /* + */
export const CHAR_DOUBLE_QUOTE = 34; /* " */
export const CHAR_SINGLE_QUOTE = 39; /* ' */
export const CHAR_PERCENT = 37; /* % */
export const CHAR_SEMICOLON = 59; /* ; */
export const CHAR_CIRCUMFLEX_ACCENT = 94; /* ^ */
export const CHAR_GRAVE_ACCENT = 96; /* ` */
export const CHAR_AT = 64; /* @ */
export const CHAR_AMPERSAND = 38; /* & */
export const CHAR_EQUAL = 61; /* = */

// Digits
export const CHAR_0 = 48; /* 0 */
export const CHAR_9 = 57; /* 9 */

export const EOL = isWindows ? "\r\n" : "\n";

export default {
  CHAR_UPPERCASE_A,
  CHAR_LOWERCASE_A,
  CHAR_UPPERCASE_Z,
  CHAR_LOWERCASE_Z,
  CHAR_UPPERCASE_C,
  CHAR_LOWERCASE_B,
  CHAR_LOWERCASE_E,
  CHAR_LOWERCASE_N,
  CHAR_DOT,
  CHAR_FORWARD_SLASH,
  CHAR_BACKWARD_SLASH,
  CHAR_VERTICAL_LINE,
  CHAR_COLON,
  CHAR_QUESTION_MARK,
  CHAR_UNDERSCORE,
  CHAR_LINE_FEED,
  CHAR_CARRIAGE_RETURN,
  CHAR_TAB,
  CHAR_FORM_FEED,
  CHAR_EXCLAMATION_MARK,
  CHAR_HASH,
  CHAR_SPACE,
  CHAR_NO_BREAK_SPACE,
  CHAR_ZERO_WIDTH_NOBREAK_SPACE,
  CHAR_LEFT_SQUARE_BRACKET,
  CHAR_RIGHT_SQUARE_BRACKET,
  CHAR_LEFT_ANGLE_BRACKET,
  CHAR_RIGHT_ANGLE_BRACKET,
  CHAR_LEFT_CURLY_BRACKET,
  CHAR_RIGHT_CURLY_BRACKET,
  CHAR_HYPHEN_MINUS,
  CHAR_PLUS,
  CHAR_DOUBLE_QUOTE,
  CHAR_SINGLE_QUOTE,
  CHAR_PERCENT,
  CHAR_SEMICOLON,
  CHAR_CIRCUMFLEX_ACCENT,
  CHAR_GRAVE_ACCENT,
  CHAR_AT,
  CHAR_AMPERSAND,
  CHAR_EQUAL,

  CHAR_0,
  CHAR_9,

  EOL,
};
