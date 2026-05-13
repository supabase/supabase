import type { PGForeignTable, PGMaterializedView, PGTable, PGView } from '@supabase/pg-meta'

import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

// [Joshen] We just need name, schema, description, rows, size, and the number of columns
// Just missing partitioned tables as missing pg-meta support
export const formatAllEntities = ({
  tables = [],
  views = [],
  materializedViews = [],
  foreignTables = [],
}: {
  tables?: PGTable[]
  views?: PGView[]
  materializedViews?: PGMaterializedView[]
  foreignTables?: PGForeignTable[]
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
      schema: x.schema,
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
      schema: x.schema,
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
      schema: x.schema,
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
