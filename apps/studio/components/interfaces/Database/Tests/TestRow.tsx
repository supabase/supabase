import { MoreVertical, Play, Trash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabaseTestQuery } from 'data/database-tests/database-test-query'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Badge,
} from 'ui'
import TestStatusHoverCard from './TestStatusHoverCard'
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
  index: number
  isLast: boolean
}

// Utility function to validate test query format
const isValidTestQuery = (query: string): boolean => {
  const trimmedQuery = query.trim().toLowerCase()
  return trimmedQuery.startsWith('begin;') && trimmedQuery.endsWith('rollback;')
}

const TestRow = forwardRef<TestRowHandle, TestRowProps>(
  ({ test, prependQuery, canRun = false, onSelectTest, index, isLast }, ref) => {
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

    const [fullQuery, setFullQuery] = useState<string>(test.query ?? '')

    const { refetch } = useDatabaseTestQuery(
      { projectRef: project?.ref, id: test.id },
      { enabled: false }
    )

    const fetchQuery = async () => {
      try {
        const { data, error } = await refetch()
        if (error) throw error
        if (data?.query) setFullQuery(data.query)
        return data?.query ?? ''
      } catch (e: any) {
        toast.error(`Failed to load test: ${e.message}`)
        return ''
      }
    }

    const ensureQuery = async (): Promise<string> => {
      if (fullQuery && fullQuery.length > 0) return fullQuery
      return await fetchQuery()
    }

    const isTestQueryValid = isValidTestQuery(fullQuery)

    const handleRunTest = async () => {
      setIsRunning(true)
      setStatus(undefined)
      try {
        // Determine the SQL to run
        let sqlToRun = await ensureQuery()

        // If query failed to load
        if (sqlToRun.length === 0) {
          return { error: new Error('Empty query') }
        }

        // If a setup test exists, prepend it to regular tests
        if (prependQuery && canRun) {
          sqlToRun = `${prependQuery.query}\n\n${sqlToRun}`
        }

        if (!isValidTestQuery(sqlToRun)) {
          toast.error(
            `Test "${test.name}" has invalid format. Must start with BEGIN; and end with ROLLBACK;`
          )
          return { error: new Error('Invalid test format') }
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
      if (isRunning) return { label: 'Running', variant: 'warning' as const }
      switch (status) {
        case 'passed':
          return { label: 'Passing', variant: 'success' as const }
        case 'failed':
          return { label: 'Failing', variant: 'destructive' as const }
        case 'queued':
          return { label: 'Queued', variant: 'secondary' as const }
        default:
          return undefined
      }
    }

    const getCircleClasses = () => {
      if (isRunning) return 'bg-surface-300 border-default text-foreground'
      return 'bg border text-foreground-lighter'
    }

    return (
      <>
        <div key={test.id} className="relative">
          <AnimatePresence>
            {isRunning && (
              <motion.div
                layoutId="running"
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-0 bg-surface-300/50 pointer-events-none z-0"
              />
            )}
          </AnimatePresence>
          <div
            className={`relative z-10 flex items-center px-4 transition-all duration-300 border-b border-muted gap-1 ${
              isRunning
                ? 'bg-muted'
                : status === 'passed' || status === 'failed'
                  ? 'bg-surface-100'
                  : 'hover:bg-surface-200'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              {/* Step number / status circle */}
              <div className="relative py-4">
                <motion.span
                  animate={{ scale: isRunning ? 1.25 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`test-circle flex items-center justify-center w-4 h-4 rounded-full border text-[10px] relative z-10 ${getCircleClasses()}`}
                >
                  {index + 1}
                </motion.span>

                {/* Dotted connective line */}
                <div
                  className={`absolute left-1/2 w-px border-l border-dotted -translate-x-1/2 z-0 ${
                    index === 0
                      ? 'top-1/2 bottom-0'
                      : isLast
                        ? 'top-0 bottom-1/2'
                        : 'top-0 bottom-0'
                  }`}
                />
              </div>

              {/* Test name */}
              <p
                className="flex-1 text-sm cursor-pointer text-foreground"
                onClick={async () => {
                  const sql = await ensureQuery()
                  onSelectTest({ ...test, query: sql })
                }}
              >
                {test.name}
              </p>
            </div>

            {/* Status hover card */}
            <TestStatusHoverCard
              name={test.name}
              status={isRunning ? 'running' : status}
              lastRun={lastRun}
              errorMessage={undefined}
            >
              {(() => {
                const badge = getStatusBadge()
                if (!badge) return <div className="w-3" />
                return (
                  <Badge variant={badge.variant} className="mr-2 capitalize">
                    {badge.label}
                  </Badge>
                )
              })()}
            </TestStatusHoverCard>

            {/* Run button */}
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
                className="h-7 w-7"
              />
            )}

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="text" icon={<MoreVertical />} className="h-7 w-7" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)}>
                  <Trash size={14} />
                  <span className="ml-2">Remove test</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
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
