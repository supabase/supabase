import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { compact } from 'lodash'
import { useEffect } from 'react'
import { CalculatedColumn } from 'react-data-grid'

import type { Filter, SavedState } from 'components/grid/types'
import { Entity, isTableLike } from 'data/table-editor/table-editor-types'
import { useUrlState } from 'hooks/ui/useUrlState'
import { FilterOperatorOptions } from './components/header/filter/Filter.constants'
import { STORAGE_KEY_PREFIX } from './constants'
import type { Sort, SupaColumn, SupaTable } from './types'

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
}: {
  projectRef: string
  tableName: string
  schema?: string | null
  gridColumns?: CalculatedColumn<any, any>[]
  sorts?: string[]
  filters?: string[]
}) {
  const storageKey = getStorageKey(STORAGE_KEY_PREFIX, projectRef)
  const savedStr = localStorage.getItem(storageKey)
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
  localStorage.setItem(storageKey, JSON.stringify(savedJson))
}

export const saveTableEditorStateToLocalStorageDebounced = AwesomeDebouncePromise(
  saveTableEditorStateToLocalStorage,
  500
)

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
    if (!projectRef || !table) {
      return
    }

    const searchParams = new URLSearchParams(window.location.search)

    const savedState = loadTableEditorStateFromLocalStorage(projectRef, table.name, table.schema)

    // If no sort params are set, use saved state

    let params: { sort?: string[]; filter?: string[] } | undefined

    if (searchParams.getAll('sort').length <= 0 && savedState?.sorts) {
      params = { ...params, sort: savedState.sorts }
    }

    if (searchParams.getAll('filter').length <= 0 && savedState?.filters) {
      params = { ...params, filter: savedState.filters }
    }

    if (params) {
      setParams((prevParams) => ({ ...prevParams, ...params }))
    }
  }, [projectRef, table])
}
