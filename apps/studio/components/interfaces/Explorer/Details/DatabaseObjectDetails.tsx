import type { ComponentType } from 'react'

import { ManagedTableDetails } from './ManagedTableDetails'
import { RelationDetails } from './RelationDetails'
import { TableDetails } from './TableDetails'
import { UsersTableDetails } from './UsersTableDetails'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { QueryRelation } from '@/data/sql/query-relations-query'
import { useIsProtectedSchema } from '@/hooks/useProtectedSchemas'

export type DatabaseObjectDetailsProps = {
  relation: QueryRelation
  /** Receives a row added from the details, so a surface showing the table can show it too. */
  onRowAdded?: (row: Record<string, unknown>) => void
}

type DetailsComponent = ComponentType<DatabaseObjectDetailsProps>

/**
 * How objects are described, most specific first. Surfaces that show details — a query's
 * sidebar, the schema visualizer — name the object and leave the choice to these maps:
 *
 * 1. A particular object, described its own way (`auth.users` as users).
 * 2. A table in a schema Supabase manages, described without the actions and structure that
 *    only matter for tables a user owns.
 * 3. The object's type.
 */
const DETAILS_BY_RELATION: Record<string, DetailsComponent> = {
  'auth.users': UsersTableDetails,
}

const DETAILS_BY_TYPE: Record<ENTITY_TYPE, DetailsComponent> = {
  [ENTITY_TYPE.TABLE]: TableDetails,
  [ENTITY_TYPE.PARTITIONED_TABLE]: TableDetails,
  [ENTITY_TYPE.VIEW]: RelationDetails,
  [ENTITY_TYPE.MATERIALIZED_VIEW]: RelationDetails,
  [ENTITY_TYPE.FOREIGN_TABLE]: RelationDetails,
}

const isTableType = (type: ENTITY_TYPE) =>
  type === ENTITY_TYPE.TABLE || type === ENTITY_TYPE.PARTITIONED_TABLE

export const DatabaseObjectDetails = (props: DatabaseObjectDetailsProps) => {
  const { relation } = props
  const { isSchemaLocked } = useIsProtectedSchema({ schema: relation.schema })

  const Details =
    DETAILS_BY_RELATION[`${relation.schema}.${relation.name}`] ??
    (isSchemaLocked && isTableType(relation.type) ? ManagedTableDetails : undefined) ??
    DETAILS_BY_TYPE[relation.type]
  return <Details {...props} />
}
