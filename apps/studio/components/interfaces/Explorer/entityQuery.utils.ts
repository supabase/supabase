import { ident, safeSql } from '@supabase/pg-meta'
import { z } from 'zod'

import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

/** Entity types the sidebar's Tables level lists, and that open as a `select *` query. */
export const TABLE_ENTITY_TYPES: ENTITY_TYPE[] = [ENTITY_TYPE.TABLE, ENTITY_TYPE.PARTITIONED_TABLE]

/**
 * The database entity a query was opened from. A query opened this way is an ordinary
 * editable query — the binding records only where it came from, which is what lets its tab
 * show the entity's icon, lets closing it skip the discard prompt, and is where in-place
 * editing of the results will hang off once the query editor supports it.
 */
export const queryEntityBindingSchema = z.object({
  schema: z.string(),
  name: z.string(),
  type: z.nativeEnum(ENTITY_TYPE),
})

export type QueryEntityBinding = z.infer<typeof queryEntityBindingSchema>

/**
 * Deterministic draft id for an entity, so clicking the same table twice returns to the one
 * tab — and to whatever the user had edited in it — rather than stacking up new drafts.
 * Both parts are percent-encoded, which escapes the separator, so no pair of identifiers
 * can produce the same id. The `entity:` prefix keeps these out of the uuid namespace that
 * ad-hoc queries use.
 */
export const entityQueryId = ({ schema, name }: Pick<QueryEntityBinding, 'schema' | 'name'>) =>
  `entity:${encodeURIComponent(schema)}:${encodeURIComponent(name)}`

/** The query an entity opens with. Regenerated rather than stored, so it stays reproducible. */
export const buildEntitySelectSql = ({
  schema,
  name,
}: Pick<QueryEntityBinding, 'schema' | 'name'>) =>
  safeSql`select * from ${ident(schema)}.${ident(name)}`
