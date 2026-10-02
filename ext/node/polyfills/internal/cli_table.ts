// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { getStringWidth } from "ext:deno_node/internal/util/inspect.mjs";

const tableChars = {
  middleMiddle: "\u2500",
  rowMiddle: "\u253c",
  topRight: "\u2510",
  topLeft: "\u250c",
  leftMiddle: "\u251c",
  topMiddle: "\u252c",
  bottomRight: "\u2518",
  bottomLeft: "\u2514",
  bottomMiddle: "\u2534",
  rightMiddle: "\u2524",
  left: "\u2502 ",
  right: " \u2502",
  middle: " \u2502 ",
};

const renderRow = (row: string[], columnWidths: number[]) => {
  let out = tableChars.left;
  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    const len = getStringWidth(cell);
    const needed = columnWidths[i] - len;
    // round(needed) + ceil(needed) will always add up to the amount
    // of spaces we need while also left justifying the output.
    out += cell + " ".repeat(Math.ceil(needed));
    if (i !== row.length - 1) {
      out += tableChars.middle;
    }
  }
  out += tableChars.right;
  return out;
};

const table = (head: string[], columns: string[][]) => {
  const rows: string[][] = [];
  const columnWidths = head.map((h) => getStringWidth(h));
  const longestColumn = Math.max(...columns.map((a) => a.length));

  for (let i = 0; i < head.length; i++) {
    const column = columns[i];
    for (let j = 0; j < longestColumn; j++) {
      if (rows[j] === undefined) {
        rows[j] = [];
      }
      const value = rows[j][i] = Object.hasOwn(column, j) ? column[j] : "";
      const width = columnWidths[i] || 0;
      const counted = getStringWidth(value);
      columnWidths[i] = Math.max(width, counted);
    }
  }

  const divider = columnWidths.map((i) =>
    tableChars.middleMiddle.repeat(i + 2)
  );

  let result = tableChars.topLeft +
    divider.join(tableChars.topMiddle) +
    tableChars.topRight + "\n" +
    renderRow(head, columnWidths) + "\n" +
    tableChars.leftMiddle +
    divider.join(tableChars.rowMiddle) +
    tableChars.rightMiddle + "\n";

  for (const row of rows) {
    result += `${renderRow(row, columnWidths)}\n`;
  }

  result += tableChars.bottomLeft +
    divider.join(tableChars.bottomMiddle) +
    tableChars.bottomRight;

  return result;
};
export default table;
