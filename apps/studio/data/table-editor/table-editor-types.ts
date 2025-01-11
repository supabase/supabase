import type {
  PostgresColumn,
  PostgresMaterializedView,
  PostgresRelationship,
  PostgresTable,
  PostgresView,
} from '@supabase/postgres-meta'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'

interface TableRelationship extends PostgresRelationship {
  deletion_action: 'a' | 'r' | 'c' | 'n' | 'd'
  update_action: 'a' | 'r' | 'c' | 'n' | 'd'
}

export interface Table extends PostgresTable {
  entity_type: ENTITY_TYPE.TABLE
  columns: PostgresColumn[]
  relationships: TableRelationship[]
}

export interface PartitionedTable extends PostgresTable {
  entity_type: ENTITY_TYPE.PARTITIONED_TABLE
  columns: PostgresColumn[]
  relationships: TableRelationship[]
}

export interface View extends PostgresView {
  entity_type: ENTITY_TYPE.VIEW
  columns: PostgresColumn[]
}

export interface MaterializedView extends PostgresMaterializedView {
  entity_type: ENTITY_TYPE.MATERIALIZED_VIEW
  columns: PostgresColumn[]
}

export interface ForeignTable {
  entity_type: ENTITY_TYPE.FOREIGN_TABLE
  id: number
  schema: string
  name: string
  comment: string | null
  columns: PostgresColumn[]
}

export type Entity = Table | PartitionedTable | View | MaterializedView | ForeignTable

export function isTable(entity?: Entity): entity is Table {
  return entity?.entity_type === ENTITY_TYPE.TABLE
}

export function isPartitionedTable(entity?: Entity): entity is PartitionedTable {
  return entity?.entity_type === ENTITY_TYPE.PARTITIONED_TABLE
}

/**
 * Returns true if the entity is a Table or a PartitionedTable.
 * Foreign tables are not considered table-like.
 */
export function isTableLike(entity?: Entity): entity is Table | PartitionedTable {
  return isTable(entity) || isPartitionedTable(entity)
}

export function isForeignTable(entity?: Entity): entity is ForeignTable {
  return entity?.entity_type === ENTITY_TYPE.FOREIGN_TABLE
}

export function isView(entity?: Entity): entity is View {
  return entity?.entity_type === ENTITY_TYPE.VIEW
}

export function isMaterializedView(entity?: Entity): entity is MaterializedView {
  return entity?.entity_type === ENTITY_TYPE.MATERIALIZED_VIEW
}

/**
 * Returns true if the entity is a View or a MaterializedView.
 */
export function isViewLike(entity?: Entity): entity is View | MaterializedView {
  return isView(entity) || isMaterializedView(entity)
}
