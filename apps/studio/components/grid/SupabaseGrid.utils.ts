import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { compact } from 'lodash'
import { useEffect } from 'react'
import { CalculatedColumn, CellKeyboardEvent } from 'react-data-grid'

import type { Filter, SavedState } from 'components/grid/types'
import { Entity, isTableLike } from 'data/table-editor/table-editor-types'
import { useUrlState } from 'hooks/ui/useUrlState'
import { copyToClipboard } from 'ui'
import { FilterOperatorOptions } from './components/header/filter/Filter.constants'
import { STORAGE_KEY_PREFIX, SELECT_COLUMN_KEY } from './constants'
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
  const jsonStr = localStorage.getItem(storageKey)
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
  colOrderString,
  hiddenColsString,
}: {
  projectRef: string
  tableName: string
  schema?: string | null
  gridColumns?: CalculatedColumn<any, any>[]
  sorts?: string[]
  filters?: string[]
  colOrderString: string
  hiddenColsString: string
}) {
  const storageKey = getStorageKey(STORAGE_KEY_PREFIX, projectRef)
  const savedStr = localStorage.getItem(storageKey)
  const tableKey = !schema || schema == 'public' ? tableName : `${schema}.${tableName}`

  const config = {
    ...(gridColumns !== undefined && { gridColumns }),
    ...(sorts !== undefined && { sorts }),
    ...(filters !== undefined && { filters }),
    ...(colOrderString && { colOrderString }),
    ...(hiddenColsString && { hiddenColsString }),
  }

  let savedJson
  if (savedStr) {
    savedJson = JSON.parse(savedStr)
    const previousConfig = savedJson[tableKey]
    savedJson = { ...savedJson, [tableKey]: { ...previousConfig, ...config } }
  } else {
    savedJson = { [tableKey]: config }
  }
  localStorage.setItem(storageKey, JSON.stringify(savedJson))
}

export const saveTableEditorStateToLocalStorageDebounced = AwesomeDebouncePromise(
  saveTableEditorStateToLocalStorage,
  500
)

/**
 * Hook that runs on initial page load.
 * Ensures URL parameters reflect the desired initial state for sorts, filters, column order, and visibility.
 * Priority is given to parameters already present in the URL.
 * If a parameter is missing in the URL, its value is loaded from local storage (if available).
 * Finally, it updates local storage to match this determined initial state, ensuring consistency.
 */
export function useLoadTableEditorStateFromLocalStorageIntoUrl({
  projectRef,
  table,
}: {
  projectRef: string | undefined
  table: Entity | undefined
}) {
  const [_, setParams] = useUrlState({
    arrayKeys: ['sort', 'filter'],
  })

  useEffect(() => {
    if (!projectRef || !table || !table.columns) {
      return
    }

    // Get the set of currently valid column keys from the table prop
    const validColumnKeys = new Set(table.columns.map((c) => c.name))

    const searchParams = new URLSearchParams(window.location.search)
    const savedState = loadTableEditorStateFromLocalStorage(projectRef, table.name, table.schema)

    let needsUrlUpdate = false
    const paramsForUrl: {
      sort?: string[]
      filter?: string[]
      col_order?: string
      hidden_cols?: string
    } = {}

    // --- Determine final state, prioritizing URL over Local Storage ---

    // Sorts (Assuming validation isn't strictly needed here unless columns are removed)
    const urlSorts = searchParams.getAll('sort')
    let finalSorts = urlSorts.length > 0 ? urlSorts : savedState?.sorts ?? []
    if (urlSorts.length === 0 && finalSorts.length > 0) {
      paramsForUrl.sort = finalSorts
      needsUrlUpdate = true
    }

    // Filters (Assuming validation isn't strictly needed here unless columns are removed)
    const urlFilters = searchParams.getAll('filter')
    let finalFilters = urlFilters.length > 0 ? urlFilters : savedState?.filters ?? []
    if (urlFilters.length === 0 && finalFilters.length > 0) {
      paramsForUrl.filter = finalFilters
      needsUrlUpdate = true
    }

    // Column Order - Determine initial value (URL > LS)
    const urlColOrder = searchParams.get('col_order')
    let initialColOrderString = urlColOrder // URL has priority
    if (urlColOrder === null && savedState?.gridColumns) {
      const savedOrder = savedState.gridColumns
        .map((col: any) => col.key)
        .filter((key: string) => key !== SELECT_COLUMN_KEY)
      if (savedOrder.length > 0) {
        initialColOrderString = savedOrder.join(',')
      }
    }
    // Validate initial string and encode commas
    const finalColOrderString = (initialColOrderString ?? '')
      .split(',')
      .filter((key) => key && validColumnKeys.has(key))
      .join('%2C') // Join with encoded comma
    // Check if URL needs update
    if (
      (urlColOrder === null && finalColOrderString !== '') ||
      (urlColOrder !== null && urlColOrder.replace(/,/g, '%2C') !== finalColOrderString)
    ) {
      // Compare encoded versions
      paramsForUrl.col_order = finalColOrderString
      needsUrlUpdate = true
    }

    // Hidden Columns - Determine initial value (URL > LS)
    const urlHiddenCols = searchParams.get('hidden_cols')
    let initialHiddenColsString = urlHiddenCols // URL has priority
    if (urlHiddenCols === null && savedState?.gridColumns) {
      const hiddenKeys = savedState.gridColumns
        .filter((col: any) => col.visible === false)
        .map((col: any) => col.key)
      if (hiddenKeys.length > 0) {
        initialHiddenColsString = hiddenKeys.join(',')
      }
    }
    // Validate initial string and encode commas
    const finalHiddenColsString = (initialHiddenColsString ?? '')
      .split(',')
      .filter((key) => key && validColumnKeys.has(key))
      .join('%2C') // Join with encoded comma
    // Check if URL needs update
    if (
      (urlHiddenCols === null && finalHiddenColsString !== '') ||
      (urlHiddenCols !== null && urlHiddenCols.replace(/,/g, '%2C') !== finalHiddenColsString)
    ) {
      // Compare encoded versions
      paramsForUrl.hidden_cols = finalHiddenColsString
      needsUrlUpdate = true
    }

    // --- Update URL if necessary --- (Passes encoded strings if needed)
    if (needsUrlUpdate) {
      console.log(
        '[useLoadTableEditorStateFromLocalStorageIntoUrl] Updating URL with validated/loaded params:',
        paramsForUrl
      )
      setParams((prevParams) => ({ ...prevParams, ...paramsForUrl }))
    }

    // --- Sync Local Storage --- (Passes encoded strings)
    console.log(
      '[useLoadTableEditorStateFromLocalStorageIntoUrl] Syncing LocalStorage to match effective state'
    )
    saveTableEditorStateToLocalStorage({
      projectRef,
      tableName: table.name,
      schema: table.schema,
      sorts: finalSorts,
      filters: finalFilters,
      // TODO: Adapt save function for these strings
      gridColumns: undefined,
      colOrderString: finalColOrderString, // Pass encoded string
      hiddenColsString: finalHiddenColsString, // Pass encoded string
    })
  }, [projectRef, table, setParams])
}

export const handleCopyCell = (
  { column, row }: { column: CalculatedColumn<any, unknown>; row: any },
  event: CellKeyboardEvent
) => {
  if (event.code === 'KeyC' && (event.metaKey || event.ctrlKey)) {
    const colKey = column.key
    const cellValue = row[colKey] ?? ''
    const value = formatClipboardValue(cellValue)
    copyToClipboard(value)
  }
}
