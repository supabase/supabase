import { PostgresMaterializedView, PostgresTable, PostgresView } from '@supabase/postgres-meta'
import { PostgresForeignTable } from '@supabase/postgres-meta/dist/lib/types'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'

// [Joshen] We just need name, description, rows, size, and the number of columns
// Just missing partitioned tables as missing pg-meta support
export const formatAllEntities = ({
  tables = [],
  views = [],
  materializedViews = [],
  foreignTables = [],
}: {
  tables?: PostgresTable[]
  views?: PostgresView[]
  materializedViews?: PostgresMaterializedView[]
  foreignTables?: PostgresForeignTable[]
}) => {
  const formattedTables = tables.map((x) => {
    return {
      ...x,
      type: ENTITY_TYPE.TABLE as const,
      rows: x.live_rows_estimate,
      columns: x.columns ?? [],
    }
  })

  const formattedViews = views.map((x) => {
    return {
      type: ENTITY_TYPE.VIEW as const,
      id: x.id,
      name: x.name,
      comment: x.comment,
      rows: undefined,
      size: undefined,
      columns: x.columns ?? [],
    }
  })

  const formattedMaterializedViews = materializedViews.map((x) => {
    return {
      type: ENTITY_TYPE.MATERIALIZED_VIEW as const,
      id: x.id,
      name: x.name,
      comment: x.comment,
      rows: undefined,
      size: undefined,
      columns: x.columns ?? [],
    }
  })

  const formattedForeignTables = foreignTables.map((x) => {
    return {
      type: ENTITY_TYPE.FOREIGN_TABLE as const,
      id: x.id,
      name: x.name,
      comment: x.comment,
      rows: undefined,
      size: undefined,
      columns: x.columns ?? [],
    }
  })

  return [
    ...formattedTables,
    ...formattedViews,
    ...formattedMaterializedViews,
    ...formattedForeignTables,
  ].sort((a, b) => a.name.localeCompare(b.name))
}
