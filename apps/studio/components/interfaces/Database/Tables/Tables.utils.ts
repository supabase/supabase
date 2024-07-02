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
      type: ENTITY_TYPE.TABLE,
      id: x.id,
      name: x.name,
      comment: x.comment,
      rows: x.live_rows_estimate,
      size: x.size,
      numColumns: x.columns?.length ?? 0,
    }
  })

  const formattedViews = views.map((x) => {
    return {
      type: ENTITY_TYPE.VIEW,
      id: x.id,
      name: x.name,
      comment: x.comment,
      rows: undefined,
      size: undefined,
      numColumns: x.columns?.length ?? 0,
    }
  })

  const formattedMaterializedViews = materializedViews.map((x) => {
    return {
      type: ENTITY_TYPE.MATERIALIZED_VIEW,
      id: x.id,
      name: x.name,
      comment: x.comment,
      rows: undefined,
      size: undefined,
      numColumns: x.columns?.length ?? 0,
    }
  })

  const formattedForeignTables = foreignTables.map((x) => {
    return {
      type: ENTITY_TYPE.FOREIGN_TABLE,
      id: x.id,
      name: x.name,
      comment: x.comment,
      rows: undefined,
      size: undefined,
      numColumns: x.columns?.length ?? 0,
    }
  })

  return [
    ...formattedTables,
    ...formattedViews,
    ...formattedMaterializedViews,
    ...formattedForeignTables,
  ].sort((a, b) => a.name.localeCompare(b.name))
}
