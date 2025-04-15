// TODO: check if we can move to /data-table-filter-command/utils.ts
import type { ColumnFiltersState } from "@tanstack/react-table";
import { z } from "zod";
import type { DataTableFilterField } from "./types";
import {
  ARRAY_DELIMITER,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
} from "@/lib/delimiters";

export function deserialize<T extends z.AnyZodObject>(schema: T) {
  const castToSchema = z.preprocess((val) => {
    if (typeof val !== "string") return val;
    return val
      .trim()
      .split(" ")
      .reduce((prev, curr) => {
        const [name, value] = curr.split(":");
        if (!value || !name) return prev;
        prev[name] = value;
        return prev;
      }, {} as Record<string, unknown>);
  }, schema);
  return (value: string) => castToSchema.safeParse(value);
}

// export function serialize<T extends z.AnyZodObject>(schema: T) {
//   return (value: z.infer<T>) =>
//     schema
//       .transform((val) => {
//         Object.keys(val).reduce((prev, curr) => {
//           if (Array.isArray(val[curr])) {
//             return `${prev}${curr}:${val[curr].join(",")} `;
//           }
//           return `${prev}${curr}:${val[curr]} `;
//         }, "");
//       })
//       .safeParse(value);
// }

export function serializeColumFilters<TData>(
  columnFilters: ColumnFiltersState,
  filterFields?: DataTableFilterField<TData>[]
) {
  return columnFilters.reduce((prev, curr) => {
    const { type, commandDisabled } = filterFields?.find(
      (field) => curr.id === field.value
    ) || { commandDisabled: true }; // if column filter is not found, disable the command by default

    if (commandDisabled) return prev;

    if (Array.isArray(curr.value)) {
      if (type === "slider") {
        return `${prev}${curr.id}:${curr.value.join(SLIDER_DELIMITER)} `;
      }
      if (type === "checkbox") {
        return `${prev}${curr.id}:${curr.value.join(ARRAY_DELIMITER)} `;
      }
      if (type === "timerange") {
        return `${prev}${curr.id}:${curr.value.join(RANGE_DELIMITER)} `;
      }
    }

    return `${prev}${curr.id}:${curr.value} `;
  }, "");
}
