import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { useQueuesQuery } from 'data/database-queues/database-queues-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { RefreshCw, Search, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import DataGrid, { Row } from 'react-data-grid'
import { Button, cn, LoadingLine } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { CreateQueueSheet } from './CreateQueueSheet'
import { formatQueueColumns, prepareQueuesForDataGrid } from './Queues.utils'

export const QueuesTab = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))
  const [search, setSearch] = useState(searchQuery)

  const [createQueueSheetShown, setCreateQueueSheetShown] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const {
    data: queues,
    error,
    isPending: isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQueuesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // Filter queues based on search query
  const filteredQueues = useMemo(() => {
    if (!queues) return []
    if (!searchQuery) return queues
    return queues.filter((queue) =>
      queue.queue_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [queues, searchQuery])

  // Prepare queues for DataGrid
  const queueData = useMemo(() => prepareQueuesForDataGrid(filteredQueues), [filteredQueues])

  // Get columns configuration
  const columns = useMemo(() => formatQueueColumns(), [])

  return (
    <>
      <div className="h-full w-full space-y-4">
        <div className="h-full w-full flex flex-col relative">
          <div className="bg-surface-200 py-3 px-10 flex items-center justify-between flex-wrap">
            <Input
              size="tiny"
              className="w-52"
              placeholder="Search for a queue"
              icon={<Search />}
              value={search ?? ''}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.code === 'Enter' || e.code === 'NumpadEnter') setSearchQuery(search.trim())
              }}
              actions={[
                search && (
                  <Button
                    key="clear"
                    size="tiny"
                    type="text"
                    icon={<X />}
                    onClick={() => {
                      setSearch('')
                      setSearchQuery('')
                    }}
                    className="p-0 h-5 w-5"
                  />
                ),
              ]}
            />

            <div className="flex items-center gap-x-2">
              <Button
                type="default"
                icon={<RefreshCw />}
                loading={isRefetching}
                onClick={() => refetch()}
              >
                Refresh
              </Button>
              <Button onClick={() => setCreateQueueSheetShown(true)}>Create queue</Button>
            </div>
          </div>

          <LoadingLine loading={isLoading || isRefetching} />

          <DataGrid
            className="flex-grow border-t-0"
            rowHeight={44}
            headerRowHeight={36}
            columns={columns}
            rows={queueData}
            rowKeyGetter={(row) => row.id}
            rowClass={() => {
              return cn(
                'cursor-pointer',
                '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                '[&>.rdg-cell:first-child>div]:ml-8'
              )
            }}
            renderers={{
              renderRow(_, props) {
                return (
                  <Row
                    key={props.row.queue_name}
                    {...props}
                    onClick={() => {
                      const { queue_name } = props.row
                      const url = `/project/${ref}/integrations/queues/queues/${queue_name}`
                      router.push(url)
                    }}
                  />
                )
              },
            }}
          />

          {/* Render 0 rows state outside of the grid */}
          {queueData.length === 0 ? (
            isLoading ? (
              <div className="absolute top-28 px-10 w-full">
                <GenericSkeletonLoader />
              </div>
            ) : isError ? (
              <div className="absolute top-28 px-10 flex flex-col items-center justify-center w-full">
                <AlertError subject="Failed to retrieve database queues" error={error} />
              </div>
            ) : (
              <div className="absolute top-32 px-6 w-full">
                <div className="text-center text-sm flex flex-col gap-y-1">
                  <p className="text-foreground">
                    {!!searchQuery ? 'No queues found' : 'No queues created yet'}
                  </p>
                  <p className="text-foreground-light">
                    {!!searchQuery
                      ? 'There are currently no queues based on the search applied'
                      : 'There are currently no queues created yet in your project'}
                  </p>
                </div>
              </div>
            )
          ) : null}

          <div className="flex justify-between min-h-9 h-9 overflow-hidden items-center px-6 w-full border-t text-xs text-foreground-light">
            {`Total: ${queueData.length} queues`}
          </div>
        </div>
      </div>

      <CreateQueueSheet
        visible={createQueueSheetShown}
        onClose={() => {
          setCreateQueueSheetShown(false)
        }}
      />
    </>
  )
}
