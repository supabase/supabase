import type { ComponentType } from 'react'

import { GenericRowDetails } from './GenericRowDetails'
import { UserRowDetails } from './UserRowDetails'
import type { QueryRelation } from '@/data/sql/query-relations-query'

export type RowDetailsProps = {
  relation: QueryRelation
  /** The row as the result shows it, keyed by result column. */
  row: Record<string, unknown>
  /** The row's primary key values, keyed by table column. */
  rowIdentifiers: Record<string, unknown>
  /** For details that can delete their row, to take it out of the result too. */
  onRowDeleted?: () => void
}

/**
 * Tables whose rows mean more than their columns, described their own way. Any other row
 * gets the generic column list, so a table joins this map only when it has a better story.
 */
const ROW_DETAILS_BY_RELATION: Record<string, ComponentType<RowDetailsProps>> = {
  'auth.users': UserRowDetails,
}

export const DatabaseRowDetails = (props: RowDetailsProps) => {
  const Details =
    ROW_DETAILS_BY_RELATION[`${props.relation.schema}.${props.relation.name}`] ?? GenericRowDetails
  return <Details {...props} />
}
