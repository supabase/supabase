import { SavedState, Sort, SupaTable } from '../types';

export function getInitialSorts(
  table: SupaTable,
  savedState?: SavedState
): Sort[] {
  if (savedState?.sorts) {
    // verify column still exists
    const sorts = savedState.sorts.filter((x) => {
      const found = table.columns.find((y) => y.name === x.column);
      return found ? true : false;
    });
    if (sorts?.length > 0) return sorts;
  }

  // default sorts
  if (!table?.columns || table?.columns?.length <= 0) return [];
  const firstColumn = table?.columns[0];
  return [{ column: firstColumn.name, ascending: true }];
}
