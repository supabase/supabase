import dayjs from 'dayjs'
import { MoreVertical, Play, Trash } from 'lucide-react'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

import { DatabaseTest } from 'data/database-tests/database-tests-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useDatabaseTestDeleteMutation } from 'data/database-tests/database-test-delete-mutation'

export interface TestRowHandle {
  runTest: () => Promise<{ error: any | null }>
  setStatus: (status: 'queued' | 'passed' | 'failed' | undefined) => void
  setIsRunning: (running: boolean) => void
}

interface TestRowProps {
  test: DatabaseTest
  prependQuery?: DatabaseTest | null
  canRun?: boolean
  onSelectTest: (test: DatabaseTest) => void
}

// Utility function to validate test query format
const isValidTestQuery = (query: string): boolean => {
  const trimmedQuery = query.trim().toLowerCase()
  return trimmedQuery.startsWith('begin;') && trimmedQuery.endsWith('rollback;')
}

const TestRow = forwardRef<TestRowHandle, TestRowProps>(
  ({ test, prependQuery, canRun = false, onSelectTest }, ref) => {
    const project = useSelectedProject()
    const [isRunning, setIsRunning] = useState(false)
    const [status, setStatus] = useState<'queued' | 'passed' | 'failed' | undefined>()
    const [lastRun, setLastRun] = useState<string | undefined>()
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const { mutateAsync: runTestMutation } = useExecuteSqlMutation()
    const { mutate: deleteTest, isLoading: isDeleting } = useDatabaseTestDeleteMutation({
      onSuccess: () => {
        setIsDeleteModalOpen(false)
      },
    })

    const isTestQueryValid = isValidTestQuery(test.query)

    const handleRunTest = async () => {
      if (!isTestQueryValid) {
        toast.error(
          `Test "${test.name}" has invalid format. Must start with BEGIN; and end with ROLLBACK;`
        )
        return { error: new Error('Invalid test format') }
      }

      setIsRunning(true)
      setStatus(undefined)
      try {
        // Determine the SQL to run
        let sqlToRun = test.query

        // If a setup test exists, prepend it to regular tests
        if (prependQuery && canRun) {
          sqlToRun = `${prependQuery.query}\n\n${test.query}`
        }

        const res = await runTestMutation({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          sql: sqlToRun,
        })
        const { result } = res
        console.log('result', res)
        const hasFailedTests = result.some((r: any) => r.finish?.includes('failed'))
        if (hasFailedTests) {
          toast.error(`Test "${test.name}" failed.`)
          setStatus('failed')
        } else {
          toast.success(`Test "${test.name}" passed!`)
          setStatus('passed')
        }
        setLastRun(new Date().toISOString())
        return { error: null }
      } catch (error: any) {
        toast.error(`Failed to run test "${test.name}": ${error.message}`)
        setStatus('failed')
        setLastRun(new Date().toISOString())
        return { error }
      } finally {
        setIsRunning(false)
      }
    }

    useImperativeHandle(ref, () => ({
      runTest: handleRunTest,
      setStatus,
      setIsRunning,
    }))

    const onDelete = () => {
      if (!project) return
      deleteTest({ projectRef: project.ref, id: test.id })
    }

    const getStatusBadge = () => {
      if (isRunning) {
        return <Badge variant="outline">Running</Badge>
      }
      if (status === 'queued') {
        return <Badge variant="outline">Queued</Badge>
      }
      if (status === 'passed') {
        return <Badge variant="success">Passed</Badge>
      }
      if (status === 'failed') {
        return <Badge variant="destructive">Failed</Badge>
      }
      return <Badge variant="outline">Not run</Badge>
    }

    return (
      <>
        <TableRow key={test.id}>
          <TableCell>
            <p className="text-sm cursor-pointer" onClick={() => onSelectTest(test)}>
              {test.name}
            </p>
          </TableCell>
          <TableCell>{getStatusBadge()}</TableCell>
          <TableCell>{lastRun ? dayjs(lastRun).fromNow() : 'Never'}</TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-2">
              {canRun && (
                <ButtonTooltip
                  type="default"
                  icon={<Play />}
                  loading={isRunning}
                  disabled={isRunning || status === 'queued' || !isTestQueryValid}
                  onClick={handleRunTest}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: !isTestQueryValid
                        ? 'Test query must start with BEGIN; and end with ROLLBACK;'
                        : undefined,
                    },
                  }}
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="text" icon={<MoreVertical />} />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)}>
                    <Trash size={14} />
                    <span className="ml-2">Remove test</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        </TableRow>
        <ConfirmationModal
          visible={isDeleteModalOpen}
          title="Delete test"
          confirmLabel="Delete test"
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={onDelete}
          loading={isDeleting}
        >
          <p className="text-sm text-foreground-light">
            Are you sure you want to delete the test "{test.name}"? This action cannot be undone.
          </p>
        </ConfirmationModal>
      </>
    )
  }
)
TestRow.displayName = 'TestRow'

export default TestRow
