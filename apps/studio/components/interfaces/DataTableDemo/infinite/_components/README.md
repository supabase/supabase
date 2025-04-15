### Non-standard components

All components within the `_components` folder are non-standard and are specific for the `/infinite` example.

The goal is to create a collection of components that can be used in any project. The components will be mostly used for very specific use cases either in the `filterFields[number].component` (see `constants.tsx`), `columns[0].cell` (see `columns.tsx`) or in the `DataTableSheetDetails` (`popover-percentile.tsx`).

The components are not part of the `@/components` folder because they are not generic enough to be used in other projects.

For more generic components, we use the `@/components/custom` and `@/components/data-table/{data-table-column}` folders.
