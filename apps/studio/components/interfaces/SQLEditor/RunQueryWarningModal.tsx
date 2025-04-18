import { Separator } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface RunQueryWarningModalProps {
  visible: boolean
  hasDestructiveOperations: boolean
  hasUpdateWithoutWhere: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const RunQueryWarningModal = ({
  visible,
  hasDestructiveOperations,
  hasUpdateWithoutWhere,
  onCancel,
  onConfirm,
}: RunQueryWarningModalProps) => {
  return (
    <ConfirmationModal
      visible={visible}
      size="large"
      title={`Potential issue${hasDestructiveOperations && hasUpdateWithoutWhere ? 's' : ''} detected with your query`}
      confirmLabel="Run this query"
      variant="warning"
      alert={{
        base: {
          variant: 'warning',
        },
        title:
          hasDestructiveOperations && hasUpdateWithoutWhere
            ? 'The following potential issues have been detected:'
            : 'The following potential issue has been detected:',
        description: 'Ensure that these are intentional before executing this query',
      }}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="text-sm">
        <ul className="border rounded-md grid bg-surface-200">
          {hasDestructiveOperations && (
            <li className="grid pt-3 pb-2 px-4">
              <span className="font-bold">Query has destructive operation</span>
              <span className="text-foreground-lighter">
                Make sure you are not accidentally removing something important.
              </span>
            </li>
          )}
          {hasDestructiveOperations && hasUpdateWithoutWhere && <Separator />}
          {hasUpdateWithoutWhere && (
            <li className="grid pt-2 pb-3 px-4 gap-1">
              <span className="font-bold">Query uses update without a where clause</span>
              <span className="text-foreground-lighter">
                Without a <code className="text-xs">where</code> clause, this could update all rows
                in the table.
              </span>
            </li>
          )}
        </ul>
      </div>
      <p className="mt-4 text-sm text-foreground-light">
        Please confirm that you would like to execute this query.
      </p>
    </ConfirmationModal>
  )
}
