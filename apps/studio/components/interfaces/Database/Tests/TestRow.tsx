import { MoreVertical, Play, Trash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabaseTestQuery } from 'data/database-tests/database-test-query'
import { useState } from 'react'
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
import { DatabaseTestStatus } from './Tests.types'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useDatabaseTestDeleteMutation } from 'data/database-tests/database-test-delete-mutation'

interface TestRowProps {
  test: DatabaseTest & { status: DatabaseTestStatus }
  canRun?: boolean
  onSelectTest: (test: DatabaseTest) => void
  onRun: () => void
  isActive: boolean
  index: number
  isLast: boolean
  status?: DatabaseTestStatus
}

const TestRow = ({
  test,
  canRun = false,
  onSelectTest,
  onRun,
  index,
  isLast,
  isActive,
  status = test.status,
}: TestRowProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const shouldFetchDetail = isActive

  const { data: testDetail, refetch } = useDatabaseTestQuery(
    { projectRef: project?.ref, id: test.id },
    { enabled: shouldFetchDetail }
  )

  const { mutate: deleteTest, isLoading: isDeleting } = useDatabaseTestDeleteMutation({
    onSuccess: () => {
      setIsDeleteModalOpen(false)
    },
  })

  const ensureQuery = async (): Promise<string> => {
    if (testDetail?.query) return testDetail.query
    if (test.query && test.query.length > 0) return test.query

    // Fetch latest if needed
    const { data } = await refetch()
    return data?.query ?? ''
  }

  const onDelete = () => {
    if (!project) return
    deleteTest({ projectRef: project.ref, id: test.id })
  }

  const getStatusBadge = () => {
    if (status === 'running') return { label: 'Running', variant: 'warning' as const }
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
    if (status === 'running') return 'bg-surface-300 border-default text-foreground'
    return 'bg border text-foreground-lighter'
  }

  return (
    <>
      <div key={test.id} className="relative">
        <AnimatePresence>
          {status === 'running' && (
            <motion.div
              layoutId="running"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-300/50 pointer-events-none z-0"
            />
          )}
        </AnimatePresence>
        <div className="relative z-10 hover:bg-surface-200 flex items-center px-4 transition-all duration-300 border-b border-muted gap-1">
          <div className="flex items-center gap-3 flex-1">
            {/* Step number / status circle */}
            <div className="relative py-4">
              <motion.span
                animate={{ scale: status === 'running' ? 1.25 : 1 }}
                className={`test-circle flex items-center justify-center w-5 h-5 rounded-full border text-[10px] relative z-10 ${getCircleClasses()}`}
              >
                {index + 1}
              </motion.span>

              {/* Dotted connective line */}
              <div
                className={`absolute left-1/2 w-px border-l border-dotted -translate-x-1/2 z-0 ${
                  index === 0 ? 'top-1/2 bottom-0' : isLast ? 'top-0 bottom-1/2' : 'top-0 bottom-0'
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
            status={status}
            lastRun={undefined}
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
              loading={status === 'running'}
              disabled={status === 'running' || status === 'queued'}
              onClick={onRun}
              tooltip={{ content: { side: 'bottom' } }}
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

export default TestRow
