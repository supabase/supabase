import dayjs from 'dayjs'
import { RefreshCw, StopCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import AlertError from 'components/ui/AlertError'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useQueryAbortMutation } from 'data/sql/abort-query-mutation'
import { useOngoingQueriesQuery } from 'data/sql/ongoing-queries-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useUrlState } from 'hooks/ui/useUrlState'
import { IS_PLATFORM } from 'lib/constants'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { ResponseError } from 'types'
import {
  Button,
  CodeBlock,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSection,
  SheetTitle,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface OngoingQueriesPanel {
  visible: boolean
  onClose: () => void
}

export const OngoingQueriesPanel = ({ visible, onClose }: OngoingQueriesPanel) => {
  const [_, setParams] = useUrlState({ replace: true })
  const project = useSelectedProject()
  const state = useDatabaseSelectorStateSnapshot()
  const [selectedId, setSelectedId] = useState<number>()

  const { data: databases } = useReadReplicasQuery({ projectRef: project?.ref })
  const database = (databases ?? []).find((db) => db.identifier === state.selectedDatabaseId)

  const {
    data,
    error,
    isError,
    isLoading: isLoadingOngoingQueries,
    isFetching: isFetchingOngoingQueries,
    refetch,
  } = useOngoingQueriesQuery(
    {
      projectRef: project?.ref,
      connectionString: database?.connectionString,
    },
    {
      enabled: !IS_PLATFORM || (IS_PLATFORM && database?.connectionString !== undefined),
      staleTime: 5000,
    }
  )
  const queries = data ?? []

  const { mutate: abortQuery, isLoading } = useQueryAbortMutation({
    onSuccess: () => {
      toast.success(`Successfully aborted query (ID: ${selectedId})`)
      setSelectedId(undefined)
    },
  })

  const closePanel = () => {
    setParams({ viewOngoingQueries: undefined })
    onClose()
  }

  return (
    <>
      <Sheet open={visible} onOpenChange={() => closePanel()}>
        <SheetContent size="lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-x-2">
              Running queries on{' '}
              {database?.identifier === project?.ref ? 'primary database' : 'read replica'}
              <Button
                type="default"
                className="px-1.5"
                loading={isLoadingOngoingQueries || isFetchingOngoingQueries}
                icon={<RefreshCw />}
                onClick={() => refetch()}
              />
            </SheetTitle>
            <SheetDescription>
              There {queries.length === 1 ? 'is' : 'are'}{' '}
              <span className="text-foreground-light">{queries.length}</span> quer
              {queries.length === 1 ? 'y' : 'ies'} currently running{' '}
              {database?.identifier !== project?.ref ? `on replica ${database?.identifier}` : ''}
            </SheetDescription>
          </SheetHeader>
          <div className="max-h-full h-full divide-y overflow-y-auto">
            {isError && (
              <div className="flex items-center justify-center h-full px-16">
                <AlertError
                  subject="Failed to retrieve ongoing queries"
                  error={error as ResponseError}
                />
              </div>
            )}
            {queries.length === 0 && (
              <div className="flex flex-col gap-y-2 items-center justify-center h-full text-foreground-light text-sm">
                <span>
                  No queries are currently running on the{' '}
                  {database?.identifier !== project?.ref
                    ? `read replica ${database?.identifier}`
                    : (databases ?? []).length > 1
                      ? 'primary database'
                      : 'database'}
                </span>
                <Button
                  type="default"
                  loading={isLoadingOngoingQueries || isFetchingOngoingQueries}
                  icon={<RefreshCw />}
                  onClick={() => refetch()}
                >
                  Refresh
                </Button>
              </div>
            )}
            {queries.map((query) => (
              <SheetSection key={query.pid} className="flex justify-between gap-x-4">
                <div className="flex flex-col gap-y-2 w-full">
                  <CodeBlock
                    hideLineNumbers
                    value={query.query}
                    language="sql"
                    className={cn(
                      'max-w-none max-h-52 w-full',
                      '!bg-transparent !py-3 !px-3.5 prose dark:prose-dark',
                      '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
                    )}
                  />
                  <div className="flex items-center gap-x-2">
                    <p className="text-foreground-light text-xs">PID: {query.pid}</p>
                    <p className="text-foreground-light text-xs">•</p>
                    <p className="text-foreground-light text-xs">
                      Started since: {dayjs(query.query_start).format('DD MMM YYYY HH:mm (ZZ)')}
                    </p>
                  </div>
                </div>

                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>
                    <Button
                      type="warning"
                      className="px-1.5"
                      icon={<StopCircle />}
                      onClick={() => setSelectedId(query.pid)}
                    />
                  </TooltipTrigger_Shadcn_>
                  <TooltipContent_Shadcn_ side="bottom">Abort query</TooltipContent_Shadcn_>
                </Tooltip_Shadcn_>
              </SheetSection>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmationModal
        loading={isLoading}
        variant="warning"
        title={`Confirm to abort this query? (ID: ${selectedId})`}
        visible={selectedId !== undefined}
        onCancel={() => setSelectedId(undefined)}
        onConfirm={() => {
          if (selectedId !== undefined)
            abortQuery({
              pid: selectedId,
              projectRef: project?.ref,
              connectionString: database?.connectionString,
            })
        }}
      >
        <p className="text-sm">This will force the query to stop running.</p>
      </ConfirmationModal>
    </>
  )
}
