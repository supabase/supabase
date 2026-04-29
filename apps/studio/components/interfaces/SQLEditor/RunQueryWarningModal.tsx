import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'

import { PotentialIssues } from './SQLEditor.types'
import { DOCS_URL } from '@/lib/constants'

interface RunQueryWarningModalProps {
  visible: boolean
  potentialIssues: PotentialIssues | undefined
  onCancel: () => void
  onConfirm: () => void
  onConfirmWithRLS?: () => void
}

export const RunQueryWarningModal = ({
  visible,
  potentialIssues,
  onCancel,
  onConfirm,
  onConfirmWithRLS,
}: RunQueryWarningModalProps) => {
  const {
    hasDestructiveOperations,
    hasUpdateWithoutWhere,
    hasAlterDatabasePreventConnection,
    createTablesMissingRLS,
  } = potentialIssues || {}

  const missingRLSTables = createTablesMissingRLS ?? []
  const hasMissingRLS = missingRLSTables.length > 0
  const issueCount =
    (hasDestructiveOperations ? 1 : 0) +
    (hasUpdateWithoutWhere ? 1 : 0) +
    (hasAlterDatabasePreventConnection ? 1 : 0) +
    (hasMissingRLS ? 1 : 0)

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent aria-describedby={undefined} className="p-0 gap-0 pb-5 !block" size="large">
        <DialogHeader className={cn('border-b')} padding="small">
          <DialogTitle>
            {`Potential issue${issueCount > 1 ? 's' : ''} detected with your query`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review the warnings below before running this query.
          </DialogDescription>
        </DialogHeader>

        <Admonition
          type="warning"
          label={
            issueCount > 1
              ? 'The following potential issues have been detected:'
              : 'The following potential issue has been detected:'
          }
          description="Ensure that these are intentional before executing this query"
          className="border-x-0 rounded-none -mt-px"
        />

        <DialogSection padding="small">
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
                    Without a <code className="text-code-inline">where</code> clause, this could
                    update all rows in the table.
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
              {hasMissingRLS && (
                <li className="grid pt-2 pb-3 px-4 gap-1">
                  <span className="font-bold">
                    {missingRLSTables.length === 1
                      ? 'New table will not have Row Level Security enabled'
                      : 'New tables will not have Row Level Security enabled'}
                  </span>
                  <span className="text-foreground-light">
                    Without RLS, any client using your project's anon or authenticated keys can read
                    and write to{' '}
                    {missingRLSTables.length === 1 ? (
                      <code className="text-code-inline">
                        {missingRLSTables[0].schema
                          ? `${missingRLSTables[0].schema}.${missingRLSTables[0].tableName}`
                          : missingRLSTables[0].tableName}
                      </code>
                    ) : (
                      'these tables'
                    )}
                    . Enable RLS and add policies before exposing this table via the API.{' '}
                    <a
                      href={`${DOCS_URL}/guides/database/postgres/row-level-security`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Learn more
                    </a>
                    .
                  </span>
                </li>
              )}
            </ul>
          </div>
          <p className="mt-4 text-sm text-foreground-light">
            Please confirm that you would like to execute this query.
          </p>
        </DialogSection>

        <DialogSectionSeparator />

        <div className="flex flex-wrap gap-2 px-5 pt-5">
          <Button size="medium" type="default" onClick={() => onCancel()}>
            Cancel
          </Button>
          <Button size="medium" type="warning" onClick={onConfirm} className="ml-auto">
            {hasMissingRLS ? 'Run without RLS' : 'Run this query'}
          </Button>
          {hasMissingRLS && onConfirmWithRLS && (
            <Button size="medium" type="primary" onClick={onConfirmWithRLS}>
              Run and enable RLS
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
