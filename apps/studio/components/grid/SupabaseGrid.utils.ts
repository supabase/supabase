import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { compact } from 'lodash'
import { useEffect, useMemo } from 'react'
import { CalculatedColumn, CellKeyboardEvent } from 'react-data-grid'

import type { Filter, SavedState } from 'components/grid/types'
import { Entity, isTableLike } from 'data/table-editor/table-editor-types'
import { BASE_PATH } from 'lib/constants'
import { useSearchParams } from 'next/navigation'
import { parseAsNativeArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { copyToClipboard } from 'ui'
import { FilterOperatorOptions } from './components/header/filter/Filter.constants'
import { STORAGE_KEY_PREFIX } from './constants'
import type { Sort, SupaColumn, SupaTable } from './types'
import { formatClipboardValue } from './utils/common'

export function formatSortURLParams(tableName: string, sort?: string[]): Sort[] {
  if (Array.isArray(sort)) {
    return compact(
      sort.map((s) => {
        const [column, order] = s.split(':')
        // Reject any possible malformed sort param
        if (!column || !order) return undefined
        else return { table: tableName, column, ascending: order === 'asc' }
      })
    )
  }
  return []
}

export function sortsToUrlParams(sorts: { column: string; ascending?: boolean }[]) {
  return sorts.map((sort) => `${sort.column}:${sort.ascending ? 'asc' : 'desc'}`)
}

export function formatFilterURLParams(filter?: string[]): Filter[] {
  return (
    Array.isArray(filter)
      ? filter
          .map((f) => {
            const [column, operatorAbbrev, ...value] = f.split(':')

            // Allow usage of : in value, so join them back after spliting
            const formattedValue = value.join(':')
            const operator = FilterOperatorOptions.find(
              (option) => option.abbrev === operatorAbbrev
            )
            // Reject any possible malformed filter param
            if (!column || !operatorAbbrev || !operator) return undefined
            else return { column, operator: operator.value, value: formattedValue || '' }
          })
          .filter((f) => f !== undefined)
      : []
  ) as Filter[]
}

export function filtersToUrlParams(
  filters: { column: string | Array<string>; operator: string; value: string }[]
) {
  return filters.map((filter) => {
    const selectedOperator = FilterOperatorOptions.find(
      (option) => option.value === filter.operator
    )

    return `${filter.column}:${selectedOperator?.abbrev}:${filter.value}`
  })
}

export function parseSupaTable(table: Entity): SupaTable {
  const columns = table.columns
  const primaryKeys = isTableLike(table) ? table.primary_keys : []
  const uniqueIndexes = isTableLike(table) ? table.unique_indexes : []
  const relationships = isTableLike(table) ? table.relationships : []

  const supaColumns: SupaColumn[] = columns.map((column) => {
    const temp = {
      position: column.ordinal_position,
      name: column.name,
      defaultValue: column.default_value as string | null | undefined,
      dataType: column.data_type,
      format: column.format,
      isPrimaryKey: false,
      isIdentity: column.is_identity,
      isGeneratable: column.identity_generation == 'BY DEFAULT',
      isNullable: column.is_nullable,
      isUpdatable: column.is_updatable,
      enum: column.enums,
      comment: column.comment,
      foreignKey: {
        targetTableSchema: null as string | null,
        targetTableName: null as string | null,
        targetColumnName: null as string | null,
        deletionAction: undefined as string | undefined,
        updateAction: undefined as string | undefined,
      },
    }
    const primaryKey = primaryKeys.find((pk) => pk.name == column.name)
    temp.isPrimaryKey = !!primaryKey

    const relationship = relationships.find((relation) => {
      return (
        relation.source_schema === column.schema &&
        relation.source_table_name === column.table &&
        relation.source_column_name === column.name
      )
    })
    if (relationship) {
      temp.foreignKey.targetTableSchema = relationship.target_table_schema
      temp.foreignKey.targetTableName = relationship.target_table_name
      temp.foreignKey.targetColumnName = relationship.target_column_name
      temp.foreignKey.deletionAction = relationship.deletion_action
      temp.foreignKey.updateAction = relationship.update_action
    }
    return temp
  })

  return {
    id: table.id,
    name: table.name,
    comment: table.comment,
    schema: table.schema,
    type: table.entity_type,
    columns: supaColumns,
    estimateRowCount: isTableLike(table) ? table.live_rows_estimate : 0,
    primaryKey: primaryKeys?.length > 0 ? primaryKeys.map((col) => col.name) : undefined,
    uniqueIndexes:
      !!uniqueIndexes && uniqueIndexes.length > 0
        ? uniqueIndexes.map(({ columns }) => columns)
        : undefined,
  }
}

export function getStorageKey(prefix: string, ref: string) {
  return `${prefix}_${ref}`
}

export function loadTableEditorStateFromLocalStorage(
  projectRef: string,
  tableId: number
): SavedState | undefined {
  const storageKey = getStorageKey(STORAGE_KEY_PREFIX, projectRef)
  // Prefer sessionStorage (scoped to current tab) over localStorage
  const jsonStr = sessionStorage.getItem(storageKey) ?? localStorage.getItem(storageKey)
  if (!jsonStr) return
  const json = JSON.parse(jsonStr)
  return json[tableId]
}

/**
 * Builds a table editor URL with the given project reference, table ID. It will load the saved state from local storage
 * and add the sort and filter parameters to the URL.
 */
export function buildTableEditorUrl({
  projectRef = 'default',
  tableId,
  schema,
}: {
  projectRef?: string
  tableId: number
  schema?: string
}) {
  const url = new URL(`${BASE_PATH}/project/${projectRef}/editor/${tableId}`, location.origin)

  // If the schema is provided, add it to the URL so that the left sidebar is opened to the correct schema
  if (schema) {
    url.searchParams.set('schema', schema)
  }

  const savedState = loadTableEditorStateFromLocalStorage(projectRef, tableId)
  if (savedState?.sorts && savedState.sorts.length > 0) {
    savedState.sorts?.forEach((sort) => url.searchParams.append('sort', sort))
  }
  if (savedState?.filters && savedState.filters.length > 0) {
    savedState.filters?.forEach((filter) => url.searchParams.append('filter', filter))
  }
  return url.toString()
}

export function saveTableEditorStateToLocalStorage({
  projectRef,
  tableId,
  gridColumns,
  sorts,
  filters,
}: {
  projectRef: string
  tableId: number
  gridColumns?: CalculatedColumn<any, any>[]
  sorts?: string[]
  filters?: string[]
}) {
  const storageKey = getStorageKey(STORAGE_KEY_PREFIX, projectRef)
  const savedStr = sessionStorage.getItem(storageKey) ?? localStorage.getItem(storageKey)

  const config = {
    ...(gridColumns !== undefined && { gridColumns }),
    ...(sorts !== undefined && { sorts: sorts.filter((sort) => sort !== '') }),
    ...(filters !== undefined && { filters: filters.filter((filter) => filter !== '') }),
  }

  let savedJson
  if (savedStr) {
    savedJson = JSON.parse(savedStr)
    const previousConfig = savedJson[tableId]
    savedJson = { ...savedJson, [tableId]: { ...previousConfig, ...config } }
  } else {
    savedJson = { [tableId]: config }
  }
  // Save to both localStorage and sessionStorage so it's consistent to current tab
  localStorage.setItem(storageKey, JSON.stringify(savedJson))
  sessionStorage.setItem(storageKey, JSON.stringify(savedJson))
}

export const saveTableEditorStateToLocalStorageDebounced = AwesomeDebouncePromise(
  saveTableEditorStateToLocalStorage,
  500
)

function getLatestParams() {
  const queryParams = new URLSearchParams(window.location.search)
  const sort = queryParams.getAll('sort')
  const filter = queryParams.getAll('filter')
  return { sort, filter }
}

export function useSyncTableEditorStateFromLocalStorageWithUrl({
  projectRef,
  table,
}: {
  projectRef: string | undefined
  table: Entity | undefined
}) {
  // Warning: nuxt url state often fails to update to changes to URL
  const [, updateUrlParams] = useQueryStates(
    {
      sort: parseAsNativeArrayOf(parseAsString),
      filter: parseAsNativeArrayOf(parseAsString),
    },
    {
      history: 'replace',
    }
  )
  // Use nextjs useSearchParams to get the latest URL params
  const searchParams = useSearchParams()
  const urlParams = useMemo(() => {
    const sort = searchParams.getAll('sort')
    const filter = searchParams.getAll('filter')
    return { sort, filter }
  }, [searchParams])

  useEffect(() => {
    if (!projectRef || !table) {
      return
    }

    // `urlParams` from `useQueryStates` can be stale so always get the latest from the URL
    const latestUrlParams = getLatestParams()

    saveTableEditorStateToLocalStorage({
      projectRef,
      tableId: table.id,
      sorts: latestUrlParams.sort,
      filters: latestUrlParams.filter,
    })
  }, [urlParams, table, projectRef])
}

export const handleCopyCell = (
  {
    mode,
    column,
    row,
  }: { mode: 'SELECT' | 'EDIT'; column: CalculatedColumn<any, unknown>; row: any },
  event: CellKeyboardEvent
) => {
  if (mode === 'SELECT' && event.code === 'KeyC' && (event.metaKey || event.ctrlKey)) {
    const colKey = column.key
    const cellValue = row[colKey] ?? ''
    const value = formatClipboardValue(cellValue)
    copyToClipboard(value)
  }
}
