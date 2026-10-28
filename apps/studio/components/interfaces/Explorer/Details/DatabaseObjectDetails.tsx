import type { ComponentType } from 'react'

import { RelationDetails } from './RelationDetails'
import { TableDetails } from './TableDetails'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { QueryRelation } from '@/data/sql/query-relations-query'

/**
 * How each kind of database object is described. Surfaces that show details — a query's
 * sidebar, the schema visualizer — name the object and leave the rendering to this map, so
 * describing another kind of object means adding its renderer here.
 */
const DETAILS_BY_TYPE: Record<ENTITY_TYPE, ComponentType<{ relation: QueryRelation }>> = {
  [ENTITY_TYPE.TABLE]: TableDetails,
  [ENTITY_TYPE.PARTITIONED_TABLE]: TableDetails,
  [ENTITY_TYPE.VIEW]: RelationDetails,
  [ENTITY_TYPE.MATERIALIZED_VIEW]: RelationDetails,
  [ENTITY_TYPE.FOREIGN_TABLE]: RelationDetails,
}

export const DatabaseObjectDetails = ({ relation }: { relation: QueryRelation }) => {
  const Details = DETAILS_BY_TYPE[relation.type]
  return <Details relation={relation} />
}
