import { POSTGRES_DATA_TYPE_OPTIONS } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.constants'

type TableConstraintSource = {
  schema: string
  name: string
  primary_keys: ReadonlyArray<{ name: string }>
  relationships: ReadonlyArray<{
    source_schema: string
    source_table_name: string
    source_column_name: string
  }>
  unique_indexes?: ReadonlyArray<{ columns: ReadonlyArray<string> }>
}

export type ColumnAffordanceKind = 'number' | 'time' | 'text' | 'json' | 'bool' | 'other'

export interface ColumnTypeAffordance {
  kind: ColumnAffordanceKind
  label: string
}

const COLUMN_AFFORDANCE_LABELS: Record<ColumnAffordanceKind, string> = {
  number: 'Numeric',
  time: 'Date / time',
  text: 'Text',
  json: 'JSON',
  bool: 'Boolean',
  other: 'Other',
}

const normalizeColumnFormat = (format: string) => format.replaceAll('"', '').replace(/\[\]$/, '')

export function getColumnTypeAffordance(format: string): ColumnTypeAffordance {
  const normalizedFormat = normalizeColumnFormat(format)
  const optionType = POSTGRES_DATA_TYPE_OPTIONS.find(
    (option) => option.name === normalizedFormat
  )?.type

  switch (optionType) {
    case 'number':
    case 'time':
    case 'text':
    case 'json':
    case 'bool':
      return { kind: optionType, label: COLUMN_AFFORDANCE_LABELS[optionType] }
    default:
      return { kind: 'other', label: COLUMN_AFFORDANCE_LABELS.other }
  }
}

export function getPrimaryKeyColumnNames(table?: TableConstraintSource) {
  return new Set(table?.primary_keys.map((primaryKey) => primaryKey.name) ?? [])
}

export function getForeignKeyColumnNames(table?: TableConstraintSource) {
  if (!table) {
    return new Set<string>()
  }

  const { schema, name, relationships } = table

  return new Set(
    relationships
      .filter(
        (relationship) =>
          relationship.source_schema === schema && relationship.source_table_name === name
      )
      .map((relationship) => relationship.source_column_name)
  )
}

export function getUniqueIndexColumnNames(table?: TableConstraintSource) {
  return new Set(
    table?.unique_indexes
      ?.filter((uniqueIndex) => uniqueIndex.columns.length === 1)
      .flatMap((uniqueIndex) => uniqueIndex.columns) ?? []
  )
}
