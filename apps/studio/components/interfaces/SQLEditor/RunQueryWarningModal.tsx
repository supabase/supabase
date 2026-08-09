import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import { type PotentialIssues } from './SQLEditor.types'

interface RunQueryWarningModalProps {
  visible: boolean
  potentialIssues: PotentialIssues | undefined
  onCancel: () => void
  onConfirm: () => void
  onConfirmWithRLS?: () => void
}

type WarningMessage = {
  id: string
  summary: ReactNode
  description: ReactNode
}

type MissingRLSTable = NonNullable<PotentialIssues['createTablesMissingRLS']>[number]

const getMissingRLSTableName = (table: MissingRLSTable) =>
  table.schema ? `${table.schema}.${table.tableName}` : table.tableName

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
  const isConfirmingRef = useRef(false)

  useEffect(() => {
    if (visible) {
      isConfirmingRef.current = false
    }
  }, [visible])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return

      if (isConfirmingRef.current) {
        isConfirmingRef.current = false
        return
      }

      onCancel()
    },
    [onCancel]
  )

  const handleConfirm = useCallback(() => {
    isConfirmingRef.current = true
    onConfirm()
  }, [onConfirm])

  const handleConfirmWithRLS = useCallback(() => {
    if (!onConfirmWithRLS) return

    isConfirmingRef.current = true
    onConfirmWithRLS()
  }, [onConfirmWithRLS])

  const warnings: WarningMessage[] = []

  if (hasDestructiveOperations) {
    warnings.push({
      id: 'destructive-operations',
      summary: 'This query includes destructive operations',
      description: 'It may permanently change or remove data, tables, schemas, or other objects.',
    })
  }

  if (hasUpdateWithoutWhere) {
    warnings.push({
      id: 'update-without-where',
      summary: (
        <>
          This query runs an <code className="text-code-inline">UPDATE</code> without a{' '}
          <code className="text-code-inline">WHERE</code> clause
        </>
      ),
      description: 'It may update every row in the target table.',
    })
  }

  if (hasAlterDatabasePreventConnection) {
    warnings.push({
      id: 'prevent-database-connections',
      summary: 'This query may prevent new database connections',
      description:
        'The dashboard may lose access until the setting is restored from a direct database connection.',
    })
  }

  if (hasMissingRLS) {
    const tableName =
      missingRLSTables.length === 1 ? getMissingRLSTableName(missingRLSTables[0]) : undefined

    warnings.push({
      id: 'missing-rls',
      summary:
        missingRLSTables.length === 1
          ? 'This query creates a table without enabling Row Level Security'
          : 'This query creates tables without enabling Row Level Security',
      description: (
        <>
          Clients using anon or authenticated keys may be able to access{' '}
          {tableName ? <code className="text-code-inline">{tableName}</code> : 'these tables'}.
        </>
      ),
    })
  }

  const canEnableRLS = hasMissingRLS && onConfirmWithRLS !== undefined
  const confirmationCopy = canEnableRLS
    ? warnings.length > 1
      ? 'Review each issue, then choose whether to enable Row Level Security before running this query.'
      : 'Choose whether to enable Row Level Security before running this query.'
    : 'Run this query only if you intend these changes and understand the risks.'
  const title = warnings.length > 1 ? 'Potential issues detected' : 'Potential issue detected'

  return (
    <AlertDialog open={visible} onOpenChange={handleOpenChange}>
      <AlertDialogContent size="small">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            {warnings.length === 0 ? (
              <div>
                <p>Are you sure you want to run this query?</p>
              </div>
            ) : warnings.length === 1 ? (
              <div>
                <p>
                  {warnings[0].summary}. {warnings[0].description}
                </p>
                <p className="mt-3">{confirmationCopy}</p>
              </div>
            ) : (
              <div>
                <p>This query has multiple potential issues:</p>
                <ul>
                  {warnings.map((warning) => (
                    <li key={warning.id} className="mt-3">
                      <span className="font-medium text-foreground">{warning.summary}.</span>{' '}
                      <span>{warning.description}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3">{confirmationCopy}</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="warning" onClick={handleConfirm}>
            {canEnableRLS ? 'Run without RLS' : 'Run query'}
          </AlertDialogAction>
          {canEnableRLS && (
            <AlertDialogAction onClick={handleConfirmWithRLS}>Run and enable RLS</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
