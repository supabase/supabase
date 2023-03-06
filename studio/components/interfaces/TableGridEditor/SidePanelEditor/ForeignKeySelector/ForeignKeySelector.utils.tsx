import { FOREIGN_KEY_DELETION_ACTION } from 'data/database/database-query-constants'

export const generateDeletionActionDescription = (deletionAction: string, reference: string) => {
  switch (deletionAction) {
    case FOREIGN_KEY_DELETION_ACTION.NO_ACTION:
      return (
        <>
          Deleting a record from <code className="text-xs text-scale-1100">{reference}</code> will{' '}
          <span className="text-brand-900 opacity-75">raise an error</span> if there exists
          referencing rows from this table
        </>
      )
    case FOREIGN_KEY_DELETION_ACTION.CASCADE:
      return (
        <>
          Deleting a record from <code className="text-xs text-scale-1100">{reference}</code> will{' '}
          <span className="text-brand-900 opacity-75">also delete</span> the referencing records
          from this table
        </>
      )
    case FOREIGN_KEY_DELETION_ACTION.RESTRICT:
      return (
        <>
          Deleting a record from <code className="text-xs text-scale-1100">{reference}</code> will{' '}
          <span className="text-brand-900 opacity-75">raise an error</span> if there exists
          referencing rows from this table
        </>
      )
    case FOREIGN_KEY_DELETION_ACTION.SET_DEFAULT:
      return (
        <>
          Deleting a record from <code className="text-xs text-scale-1100">{reference}</code> will{' '}
          set the values of existing referencing rows to their{' '}
          <span className="text-brand-900 opacity-75">default value</span> from this table
        </>
      )
    case FOREIGN_KEY_DELETION_ACTION.SET_NULL:
      return (
        <>
          Deleting a record from <code className="text-xs text-scale-1100">{reference}</code> will{' '}
          set the values of existing referencing rows{' '}
          <span className="text-brand-900 opacity-75">to NULL</span> from this table
        </>
      )
  }
}
