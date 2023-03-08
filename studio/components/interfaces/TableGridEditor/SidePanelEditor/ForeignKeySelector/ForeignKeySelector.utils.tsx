import { FOREIGN_KEY_DELETION_ACTION } from 'data/database/database-query-constants'
import { getForeignKeyDeletionAction } from '../ColumnEditor/ColumnEditor.utils'

export const generateDeletionActionDescription = (deletionAction: string, reference: string) => {
  const actionName = getForeignKeyDeletionAction(deletionAction) ?? 'No action'

  switch (deletionAction) {
    case FOREIGN_KEY_DELETION_ACTION.NO_ACTION:
      return (
        <>
          <span className="text-scale-1100">{actionName}</span>: Deleting a record from{' '}
          <code className="text-xs text-scale-1100">{reference}</code> will{' '}
          <span className="text-amber-900 opacity-75">raise an error</span> if there are records
          existing in this table that reference it
        </>
      )
    case FOREIGN_KEY_DELETION_ACTION.CASCADE:
      return (
        <>
          <span className="text-scale-1100">{actionName}</span>: Deleting a record from{' '}
          <code className="text-xs text-scale-1100">{reference}</code> will{' '}
          <span className="text-amber-900 opacity-75">also delete</span> any records that reference
          it in this table
        </>
      )
    case FOREIGN_KEY_DELETION_ACTION.RESTRICT:
      return (
        <>
          <span className="text-scale-1100">{actionName}</span>: Deleting a record from{' '}
          <code className="text-xs text-scale-1100">{reference}</code> will{' '}
          <span className="text-amber-900 opacity-75">prevent deletion</span> of existing
          referencing rows from this table
        </>
      )
    case FOREIGN_KEY_DELETION_ACTION.SET_DEFAULT:
      return (
        <>
          <span className="text-scale-1100">{actionName}</span>: Deleting a record from{' '}
          <code className="text-xs text-scale-1100">{reference}</code> will set the value of any
          existing records in this table referencing it back to their{' '}
          <span className="text-amber-900 opacity-75">default value</span>
        </>
      )
    case FOREIGN_KEY_DELETION_ACTION.SET_NULL:
      return (
        <>
          <span className="text-scale-1100">{actionName}</span>: Deleting a record from{' '}
          <code className="text-xs text-scale-1100">{reference}</code> will set the value of any
          existing records in this table referencing it{' '}
          <span className="text-amber-900 opacity-75">to NULL</span>
        </>
      )
  }
}
