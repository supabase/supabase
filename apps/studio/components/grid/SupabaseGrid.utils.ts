import type { PostgresRelationship, PostgresTable } from '@supabase/postgres-meta'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { compact } from 'lodash'

import type { Filter } from 'components/grid/types'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import {
  ForeignKeyConstraint,
  ForeignKeyConstraintsData,
} from 'data/database/foreign-key-constraints-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { TableLike } from 'hooks/misc/useTable'
import type { Dictionary, SchemaView } from 'types'
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

export function parseSupaTable(
  data: {
    table: Dictionary<any>
    columns: Dictionary<any>[]
    primaryKeys: Dictionary<any>[]
    relationships: Dictionary<any>[]
  },
  encryptedColumns: string[] = []
): SupaTable {
  const { table, columns, primaryKeys, relationships } = data

  const supaColumns: SupaColumn[] = columns.map((column) => {
    const temp = {
      position: column.ordinal_position,
      name: column.name,
      defaultValue: column.default_value,
      dataType: column.data_type,
      format: column.format,
      isPrimaryKey: false,
      isIdentity: column.is_identity,
      isGeneratable: column.identity_generation == 'BY DEFAULT',
      isNullable: column.is_nullable,
      isUpdatable: column.is_updatable,
      isEncrypted: encryptedColumns.includes(column.name),
      enum: column.enums,
      comment: column.comment,
      foreignKey: {
        targetTableSchema: null,
        targetTableName: null,
        targetColumnName: null,
        deletionAction: undefined,
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
    }
    return temp
  })

  return {
    id: table.id,
    name: table.name,
    comment: table.comment,
    schema: table.schema,
    columns: supaColumns,
    estimateRowCount: table.live_rows_estimate,
  }
}

export function getSupaTable({
  selectedTable,
  entityType,
  foreignKeyMeta,
  encryptedColumns,
}: {
  selectedTable: TableLike
  entityType?: ENTITY_TYPE
  foreignKeyMeta: ForeignKeyConstraintsData
  encryptedColumns: string[]
}) {
  // [Joshen] We can tweak below to eventually support composite keys as the data
  // returned from foreignKeyMeta should be easy to deal with, rather than pg-meta
  const formattedRelationships = (
    ('relationships' in selectedTable && selectedTable.relationships) ||
    []
  ).map((relationship: PostgresRelationship) => {
    const relationshipMeta = foreignKeyMeta.find(
      (fk: ForeignKeyConstraint) => fk.id === relationship.id
    )
    return {
      ...relationship,
      deletion_action: relationshipMeta?.deletion_action ?? FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
    }
  })

  const isViewSelected =
    entityType === ENTITY_TYPE.VIEW || entityType === ENTITY_TYPE.MATERIALIZED_VIEW
  const isForeignTableSelected = entityType === ENTITY_TYPE.FOREIGN_TABLE

  return !isViewSelected && !isForeignTableSelected
    ? parseSupaTable(
        {
          table: selectedTable as PostgresTable,
          columns: (selectedTable as PostgresTable).columns ?? [],
          primaryKeys: (selectedTable as PostgresTable).primary_keys ?? [],
          relationships: formattedRelationships,
        },
        encryptedColumns
      )
    : parseSupaTable({
        table: selectedTable as SchemaView,
        columns: (selectedTable as SchemaView).columns ?? [],
        primaryKeys: [],
        relationships: [],
      })
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
