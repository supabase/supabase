import { PostgresMaterializedView, PostgresTable, PostgresView } from '@supabase/postgres-meta'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'

// [Joshen] We just need name, description, rows, size, and the number of columns
// Eventually we can look into adding more entities like materialized views, partitioned tables, foreign tables
export const formatAllEntities = ({
  tables = [],
  views = [],
  materializedViews = [],
}: {
  tables?: PostgresTable[]
  views?: PostgresView[]
  materializedViews?: PostgresMaterializedView[]
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

  return [...formattedTables, ...formattedViews, ...formattedMaterializedViews].sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}
