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
  title: string
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
      title: 'Query has destructive operations',
      description: 'Ensure these operations are intentional before running this query.',
    })
  }

  if (hasUpdateWithoutWhere) {
    warnings.push({
      title: 'Query updates rows without a WHERE clause',
      description: 'This may update every row in the table.',
    })
  }

  if (hasAlterDatabasePreventConnection) {
    warnings.push({
      title: 'Query prevents database connections',
      description:
        'The dashboard may lose access until this setting is restored from a direct database connection.',
    })
  }

  if (hasMissingRLS) {
    const tableName =
      missingRLSTables.length === 1 ? getMissingRLSTableName(missingRLSTables[0]) : undefined

    warnings.push({
      title:
        missingRLSTables.length === 1
          ? 'New table will not have RLS enabled'
          : 'New tables will not have RLS enabled',
      description: (
        <>
          Without RLS, clients using anon or authenticated keys can access{' '}
          {tableName ? <code className="text-code-inline">{tableName}</code> : 'these tables'}{' '}
          through the API.
        </>
      ),
    })
  }

  const title =
    warnings.length === 0
      ? 'Run query?'
      : warnings.length === 1
        ? `${warnings[0].title}.`
        : `Query has ${warnings.length} potential issues.`

  return (
    <AlertDialog open={visible} onOpenChange={handleOpenChange}>
      <AlertDialogContent size="small">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            {warnings.length === 0 ? (
              <div>Confirm that you want to run this query.</div>
            ) : warnings.length === 1 ? (
              <div>{warnings[0].description}</div>
            ) : (
              <div>
                <p>Review these issues before running this query.</p>
                <ul className="mt-3 grid gap-2">
                  {warnings.map((warning) => (
                    <li key={warning.title}>
                      <span className="font-medium text-foreground">{warning.title}.</span>{' '}
                      <span>{warning.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="warning" onClick={handleConfirm}>
            {hasMissingRLS ? 'Run without RLS' : 'Run query'}
          </AlertDialogAction>
          {hasMissingRLS && onConfirmWithRLS && (
            <AlertDialogAction onClick={handleConfirmWithRLS}>Run and enable RLS</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
