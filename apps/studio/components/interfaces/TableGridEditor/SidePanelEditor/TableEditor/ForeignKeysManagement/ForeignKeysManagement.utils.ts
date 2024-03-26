import type { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'
import type { ForeignKey } from '../../ForeignKeySelector/ForeignKeySelector.types'
import { isEqual } from 'lodash'

export const checkIfRelationChanged = (existing: ForeignKeyConstraint, state: ForeignKey) => {
  const stateSourceColumns = state.columns.map((x) => x.source)
  const stateTargetColumns = state.columns.map((x) => x.target)
  return (
    existing.deletion_action !== state.deletionAction ||
    existing.update_action !== state.updateAction ||
    existing.target_schema !== state.schema ||
    existing.target_table !== state.table ||
    !isEqual(existing.source_columns, stateSourceColumns) ||
    !isEqual(existing.target_columns, stateTargetColumns)
  )
}
