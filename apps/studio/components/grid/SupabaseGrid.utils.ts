import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { compact } from 'lodash'
import { useEffect, useMemo } from 'react'
import { CalculatedColumn, CellKeyboardEvent } from 'react-data-grid'

import type { Filter, SavedState } from 'components/grid/types'
import { Entity, isTableLike } from 'data/table-editor/table-editor-types'
import { copyToClipboard } from 'ui'
import { FilterOperatorOptions } from './components/header/filter/Filter.constants'
import { STORAGE_KEY_PREFIX } from './constants'
import type { Sort, SupaColumn, SupaTable } from './types'
import { formatClipboardValue } from './utils/common'
import { parseAsNativeArrayOf, parseAsBoolean, parseAsString, useQueryStates } from 'nuqs'
import { useSearchParams } from 'next/navigation'

export const LOAD_TAB_FROM_CACHE_PARAM = 'loadFromCache'

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

export function sortsToUrlParams(sorts: Sort[]) {
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

export function filtersToUrlParams(filters: Filter[]) {
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
    columns: supaColumns,
    estimateRowCount: isTableLike(table) ? table.live_rows_estimate : 0,
  }
}

export function getStorageKey(prefix: string, ref: string) {
  return `${prefix}_${ref}`
}

export function loadTableEditorStateFromLocalStorage(
  projectRef: string,
  tableName: string,
  schema?: string | null
): SavedState | undefined {
  const storageKey = getStorageKey(STORAGE_KEY_PREFIX, projectRef)
  // Prefer sessionStorage (scoped to current tab) over localStorage
  const jsonStr = sessionStorage.getItem(storageKey) ?? localStorage.getItem(storageKey)
  if (!jsonStr) return
  const json = JSON.parse(jsonStr)
  const tableKey = !schema || schema == 'public' ? tableName : `${schema}.${tableName}`
  return json[tableKey]
}

export function saveTableEditorStateToLocalStorage({
  projectRef,
  tableName,
  schema,
  gridColumns,
  sorts,
  filters,
}: {
  projectRef: string
  tableName: string
  schema?: string | null
  gridColumns?: CalculatedColumn<any, any>[]
  sorts?: string[]
  filters?: string[]
}) {
  const storageKey = getStorageKey(STORAGE_KEY_PREFIX, projectRef)
  const savedStr = sessionStorage.getItem(storageKey) ?? localStorage.getItem(storageKey)
  const tableKey = !schema || schema == 'public' ? tableName : `${schema}.${tableName}`

  const config = {
    ...(gridColumns !== undefined && { gridColumns }),
    ...(sorts !== undefined && { sorts }),
    ...(filters !== undefined && { filters }),
  }

  let savedJson
  if (savedStr) {
    savedJson = JSON.parse(savedStr)
    const previousConfig = savedJson[tableKey]
    savedJson = { ...savedJson, [tableKey]: { ...previousConfig, ...config } }
  } else {
    savedJson = { [tableKey]: config }
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
  const loadFromCache = !!queryParams.get(LOAD_TAB_FROM_CACHE_PARAM)
  return { sort, filter, loadFromCache }
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
      [LOAD_TAB_FROM_CACHE_PARAM]: parseAsBoolean.withDefault(false),
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
    const loadFromCache = !!searchParams.get(LOAD_TAB_FROM_CACHE_PARAM)
    return { sort, filter, loadFromCache }
  }, [searchParams])

  useEffect(() => {
    if (!projectRef || !table) {
      return
    }

    // `urlParams` from `useQueryStates` can be stale so always get the latest from the URL
    const latestUrlParams = getLatestParams()

    if (latestUrlParams.loadFromCache) {
      const savedState = loadTableEditorStateFromLocalStorage(projectRef, table.name, table.schema)
      updateUrlParams(
        {
          sort: savedState?.sorts ?? [],
          filter: savedState?.filters ?? [],
          loadFromCache: false,
        },
        { clearOnDefault: true }
      )
    } else {
      saveTableEditorStateToLocalStorage({
        projectRef,
        tableName: table.name,
        schema: table.schema,
        sorts: latestUrlParams.sort,
        filters: latestUrlParams.filter,
      })
    }
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
