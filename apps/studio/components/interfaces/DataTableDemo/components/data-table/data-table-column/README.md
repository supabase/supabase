Reusable Column Components

This folder is dedicated for components that can be used as within the `columns.tsx` structure.

Components:

- `DataTableColumnTimestamp`: A hover card with the _Unix timestamp_, _UTC_, _timezone_ and _relative_ (x days ago) values
- `DataTableLevelIndicator`: A simple colored square to indicate `"error" | "warning" | "success" | "info"` data

Usage Example:

```tsx
"use client";

import { DataTableColumnLevelIndicator } from "@/components/data-table/data-table-column/data-table-column-level-indicator";
import type { ColumnDef } from "@tanstack/react-table";

export type ColumnSchema = {
  // ...
};

export const columns: ColumnDef<ColumnSchema>[] = [
  {
    accessorKey: "level",
    header: "",
    cell: ({ row }) => {
      const level = row.getValue("level") as (typeof LEVELS)[number];
      return <DataTableColumnLevelIndicator level={level} />;
    },
  },
];
```
