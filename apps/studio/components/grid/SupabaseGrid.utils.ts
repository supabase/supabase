import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { compact } from 'lodash'

import type { Filter } from 'components/grid/types'
import { Entity, isTableLike } from 'data/table-editor/table-editor-types'
import { FilterOperatorOptions } from './components/header/filter/Filter.constants'
import { STORAGE_KEY_PREFIX } from './constants'
import { InitialStateType } from './store/reducers'
import type { Sort, SupabaseGridProps, SupaColumn, SupaTable } from './types'
/**
 * Ensure that if editable is false, we should remove all editing actions
 * to prevent rare-case bugs with the UI
 */
export function cleanupProps(props: SupabaseGridProps) {
  const { editable } = props
  if (!editable) {
    return {
      ...props,
      onAddColumn: undefined,
      onAddRow: undefined,
      onEditColumn: undefined,
      onDeleteColumn: undefined,
      onEditRow: undefined,
    }
  } else {
    return props
  }
}

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

export const saveStorageDebounced = AwesomeDebouncePromise(saveStorage, 500)

function saveStorage(
  state: InitialStateType,
  storageRef: string,
  sorts?: string[],
  filters?: string[]
) {
  if (!state.table) return

  const config = {
    gridColumns: state.gridColumns,
    ...(sorts !== undefined && { sorts }),
    ...(filters !== undefined && { filters }),
  }
  const storageKey = getStorageKey(STORAGE_KEY_PREFIX, storageRef)
  const savedStr = localStorage.getItem(storageKey)

  let savedJson
  const { name, schema } = state.table
  const tableKey = !schema || schema == 'public' ? name : `${schema}.${name}`
  if (savedStr) {
    savedJson = JSON.parse(savedStr)
    savedJson = { ...savedJson, [tableKey]: config }
  } else {
    savedJson = { [tableKey]: config }
  }
  localStorage.setItem(storageKey, JSON.stringify(savedJson))
}

export function getStorageKey(prefix: string, ref: string) {
  return `${prefix}_${ref}`
}
