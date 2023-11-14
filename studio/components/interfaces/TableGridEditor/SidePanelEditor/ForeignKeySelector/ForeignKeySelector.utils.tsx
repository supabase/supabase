import * as Tooltip from '@radix-ui/react-tooltip'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { IconHelpCircle } from 'ui'
import { getForeignKeyCascadeAction } from '../ColumnEditor/ColumnEditor.utils'

export const generateCascadeActionDescription = (
  action: 'update' | 'delete',
  cascadeAction: string,
  reference: string
) => {
  const actionVerb = action === 'update' ? 'Updating' : 'Deleting'
  const actionName = getForeignKeyCascadeAction(cascadeAction) ?? 'No action'

  switch (cascadeAction) {
    case FOREIGN_KEY_CASCADE_ACTION.NO_ACTION:
      return (
        <>
          <span className="text-foreground-light">{actionName}</span>: {actionVerb} a record from{' '}
          <code className="text-xs text-foreground-light">{reference}</code> will{' '}
          <span className="text-amber-900 opacity-75">raise an error</span> if there are records
          existing in this table that reference it
        </>
      )
    case FOREIGN_KEY_CASCADE_ACTION.CASCADE:
      return (
        <>
          <span className="text-foreground-light">{actionName}</span>: {actionVerb} a record from{' '}
          <code className="text-xs text-foreground-light">{reference}</code> will{' '}
          <span className="text-amber-900 opacity-75">also {action}</span> any records that
          reference it in this table
        </>
      )
    case FOREIGN_KEY_CASCADE_ACTION.RESTRICT:
      return (
        <>
          <span className="text-foreground-light">{actionName}</span>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger className="translate-y-[3px] mx-1">
              <IconHelpCircle className="text-foreground-light" size={16} strokeWidth={1.5} />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'w-[300px] space-y-2 border border-background',
                  ].join(' ')}
                >
                  <p className="text-xs text-foreground">
                    This is similar to no action, but the restrict check cannot be deferred till
                    later in the transaction
                  </p>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
          : {actionVerb} a record from{' '}
          <code className="text-xs text-foreground-light">{reference}</code> will{' '}
          <span className="text-amber-900 opacity-75">prevent {actionVerb.toLowerCase()}</span>{' '}
          existing referencing rows from this table.
        </>
      )
    case FOREIGN_KEY_CASCADE_ACTION.SET_DEFAULT:
      return (
        <>
          <span className="text-foreground-light">{actionName}</span>: {actionVerb} a record from{' '}
          <code className="text-xs text-foreground-light">{reference}</code> will set the value of
          any existing records in this table referencing it to their{' '}
          <span className="text-amber-900 opacity-75">default value</span>
        </>
      )
    case FOREIGN_KEY_CASCADE_ACTION.SET_NULL:
      return (
        <>
          <span className="text-foreground-light">{actionName}</span>: {actionVerb} a record from{' '}
          <code className="text-xs text-foreground-light">{reference}</code> will set the value of
          any existing records in this table referencing it{' '}
          <span className="text-amber-900 opacity-75">to NULL</span>
        </>
      )
  }
}
