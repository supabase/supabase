import { isMsSqlForeignTable, type Entity } from 'data/table-editor/table-editor-types'
import type { ComponentType, ReactNode } from 'react'

import { Admonition } from 'ui-patterns'
import type { Filter, Sort } from './types'

type ValidateMsSqlSortingParams = {
  filters: Filter[]
  sorts: Sort[]
  table: Entity
}

type MsSqlWarning = 'ConflictingSort' | 'NoValidSortPossible'

/**
 * There is an edge case with the Postgres query planner and MS SQL foreign
 * tables, where the Postgres query planner will drop sort clauses that are
 * redundant with filters, resulting in invalid MS SQL syntax. We want to
 * detect any conflicting or impossible sorts on filtered columns when the
 * table is an MS SQL foreign table, and warn the user.
 */
export const validateMsSqlSorting = ({
  filters,
  sorts,
  table,
}: ValidateMsSqlSortingParams):
  | { warning: MsSqlWarning; Component: ComponentType }
  | { warning: null } => {
  const isMsSql = isMsSqlForeignTable(table)
  if (!isMsSql) return { warning: null }

  const equalityFilterColumns = new Set(
    filters
      .filter((filter) => filter.operator === '=' || filter.operator === 'is')
      .map((filter) => filter.column)
  )

  const conflictingSort =
    sorts.length > 0 && sorts.every((sort) => equalityFilterColumns.has(sort.column))
  const showMsSqlSortWarning = equalityFilterColumns.size > 0 && !!conflictingSort
  if (showMsSqlSortWarning)
    return { warning: 'ConflictingSort', Component: MsSqlSortWarningAdmonition }

  const noSortColumnsRemaining =
    table.columns.length > 0 &&
    table.columns.every((col) => col.data_type === 'json' || equalityFilterColumns.has(col.name))
  const showMsSqlNoValidSortWarning = filters.length > 0 && noSortColumnsRemaining
  if (showMsSqlNoValidSortWarning)
    return { warning: 'NoValidSortPossible', Component: MsSqlNoValidSortAdmonition }

  return { warning: null }
}

type MsSqlAdmonitionProps = {
  title: string
  children: string
}

const MsSqlAdmonition = ({ title, children }: MsSqlAdmonitionProps): ReactNode => (
  <div className="mt-2 px-3 pb-2">
    <Admonition type="warning" title={title} description={children} />
  </div>
)

const MsSqlSortWarningAdmonition = (): ReactNode => (
  <MsSqlAdmonition title="Cannot sort by filtered column">
    Sorting only by columns filtered with "=" or "is" doesn't work on MSSQL tables. Pick a different
    sorting column, or add a column not in your filter.
  </MsSqlAdmonition>
)

const MsSqlNoValidSortAdmonition = (): ReactNode => (
  <MsSqlAdmonition title="No valid sort column remaining">
    All columns that can be sorted have been filtered with "=" or "is", which doesn't work on MSSQL
    tables. Remove a column from your filter to continue.
  </MsSqlAdmonition>
)
