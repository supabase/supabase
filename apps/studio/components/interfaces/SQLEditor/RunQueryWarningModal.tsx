import { DialogSectionSeparator, Separator } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { PotentialIssues } from './SQLEditor.types'

interface RunQueryWarningModalProps {
  visible: boolean
  potentialIssues: PotentialIssues | undefined
  onCancel: () => void
  onConfirm: () => void
}

export const RunQueryWarningModal = ({
  visible,
  potentialIssues,
  onCancel,
  onConfirm,
}: RunQueryWarningModalProps) => {
  const { hasDestructiveOperations, hasUpdateWithoutWhere, hasAlterDatabasePreventConnection } =
    potentialIssues || {}

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
        <ul className="border rounded-md grid bg-surface-200 divide-y">
          {hasDestructiveOperations && (
            <li className="grid pt-3 pb-2 px-4">
              <span className="font-bold">Query has destructive operations</span>
              <span className="text-foreground-light">
                Make sure you are not accidentally removing something important.
              </span>
            </li>
          )}
          {hasUpdateWithoutWhere && (
            <li className="grid pt-2 pb-3 px-4 gap-1">
              <span className="font-bold">Query uses update without a where clause</span>
              <span className="text-foreground-light">
                Without a <code className="text-code-inline">where</code> clause, this could update
                all rows in the table.
              </span>
            </li>
          )}
          {hasAlterDatabasePreventConnection && (
            <li className="grid pt-2 pb-3 px-4 gap-1">
              <span className="font-bold">Query will prevent connections to your database</span>
              <span className="text-foreground-light">
                The dashboard will no longer have access to your database, and you will need a
                direct connection to your database to reconfigure this setting
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
