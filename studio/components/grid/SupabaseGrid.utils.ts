import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { STORAGE_KEY_PREFIX } from './constants'
import { IMetaService } from './services/meta'
import { InitialStateType } from './store/reducers'
import { Dictionary, Sort, SupabaseGridProps, SupaColumn, SupaTable } from './types'
import { getGridColumns } from './utils/gridColumns'
import { FilterOperatorOptions } from './components/header/filter'
import { Filter } from 'components/grid/types'

export function defaultErrorHandler(error: any) {
  console.error('Supabase grid error: ', error)
}

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

export function formatSortURLParams(sort?: string[]) {
  return (
    Array.isArray(sort)
      ? sort
          .map((s) => {
            const [column, order] = s.split(':')
            // Reject any possible malformed sort param
            if (!column || !order) return undefined
            else return { column, ascending: order === 'asc' }
          })
          .filter((s) => s !== undefined)
      : []
  ) as Sort[]
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

export function initTable(
  props: SupabaseGridProps,
  state: InitialStateType,
  dispatch: (value: any) => void,
  sort?: string[], // Come directly from URL param
  filter?: string[] // Come directly from URL param
): { savedState: { sorts?: string[]; filters?: string[] } } {
  function onInitTable(table: SupaTable, props: SupabaseGridProps) {
    const savedState = props.storageRef
      ? onLoadStorage(props.storageRef, table.name, table.schema)
      : undefined

    // Load sort and filters via URL param only if given
    // Otherwise load from local storage to resume user session
    if (sort === undefined && filter === undefined && (savedState?.sorts || savedState?.filters)) {
      return { savedState: { sorts: savedState.sorts, filters: savedState.filters } }
    }

    const gridColumns = getGridColumns(table, {
      editable: props.editable,
      defaultWidth: props.gridProps?.defaultColumnWidth,
      onAddColumn: props.editable ? props.onAddColumn : undefined,
    })

    dispatch({
      type: 'INIT_TABLE',
      payload: {
        table,
        gridProps: props.gridProps,
        gridColumns,
        savedState,
        editable: props.editable,
        onSqlQuery: props.onSqlQuery,
        onError: props.onError ?? defaultErrorHandler,
      },
    })

    return { savedState: {} }
  }

  if (typeof props.table === 'string') {
    const fetchMethod = props.editable
      ? fetchEditableInfo(state.metaService!, props.table, props.schema)
      : fetchReadOnlyInfo(state.metaService!, props.table, props.schema)

    fetchMethod.then((res) => {
      if (res) {
        return onInitTable(res, props)
      } else {
        if (props.onError) {
          props.onError({ message: 'fetch table info failed' })
        }
      }
    })
  } else {
    return onInitTable(props.table, props)
  }

  return { savedState: {} }
}

async function fetchEditableInfo(
  service: IMetaService,
  tableName: string,
  schema?: string
): Promise<SupaTable | null> {
  const resTable = await service.fetchInfo(tableName, schema)
  const resColumns = await service.fetchColumns(tableName, schema)
  const resPrimaryKeys = await service.fetchPrimaryKeys(tableName, schema)
  const resRelationships = await service.fetchRelationships(tableName, schema)
  if (
    resTable.data &&
    resColumns.data &&
    resPrimaryKeys.data &&
    resRelationships.data &&
    resColumns.data.length > 0
  ) {
    const supaTable = parseSupaTable({
      table: resTable.data,
      columns: resColumns.data,
      primaryKeys: resPrimaryKeys.data,
      relationships: resRelationships.data,
    })
    return supaTable
  }
  return null
}

async function fetchReadOnlyInfo(
  service: IMetaService,
  name: string,
  schema?: string
): Promise<SupaTable | null> {
  const { data } = await service.fetchColumns(name, schema)

  if (data) {
    const supaColumns: SupaColumn[] = data.map((x, index) => {
      return {
        name: x.name,
        dataType: x.format,
        format: x.format,
        position: index,
        isUpdatable: false,
      }
    })

    return {
      name: name,
      schema: schema,
      columns: supaColumns,
    }
  }
  return null
}

export function parseSupaTable(data: {
  table: Dictionary<any>
  columns: Dictionary<any>[]
  primaryKeys: Dictionary<any>[]
  relationships: Dictionary<any>[]
}): SupaTable {
  const { table, columns, primaryKeys, relationships } = data
  const supaColumns: SupaColumn[] = columns.map((x) => {
    const temp = {
      position: x.ordinal_position,
      name: x.name,
      defaultValue: x.default_value,
      dataType: x.data_type,
      format: x.format,
      isPrimaryKey: false,
      isIdentity: x.is_identity,
      isGeneratable: x.identity_generation == 'BY DEFAULT',
      isNullable: x.is_nullable,
      isUpdatable: x.is_updatable,
      enum: x.enums,
      comment: x.comment,
      targetTableSchema: null,
      targetTableName: null,
      targetColumnName: null,
    }
    const primaryKey = primaryKeys.find((pk) => pk.name == x.name)
    temp.isPrimaryKey = !!primaryKey

    const relationship = relationships.find((r) => {
      return r.source_column_name == x.name
    })
    if (relationship) {
      temp.targetTableSchema = relationship.target_table_schema
      temp.targetTableName = relationship.target_table_name
      temp.targetColumnName = relationship.target_column_name
    }
    return temp
  })

  return {
    name: table.name,
    comment: table.comment,
    schema: table.schema,
    columns: supaColumns,
  }
}

export function onLoadStorage(storageRef: string, tableName: string, schema?: string | null) {
  const storageKey = getStorageKey(STORAGE_KEY_PREFIX, storageRef)
  const jsonStr = localStorage.getItem(storageKey)
  if (!jsonStr) return
  const json = JSON.parse(jsonStr)
  const tableKey = !schema || schema == 'public' ? tableName : `${schema}.${tableName}`
  return json[tableKey]
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

function getStorageKey(prefix: string, ref: string) {
  return `${prefix}_${ref}`
}
