import { Search } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useQueuesQuery } from 'data/database-queues/database-queues-query'
import { Button, Input, Sheet, SheetContent } from 'ui'
import { CreateQueueSheet } from './CreateQueueSheet'
import { QueuesRows } from './QueuesRows'

export const QueuesTab = () => {
  const { project } = useProjectContext()

  // used for confirmation prompt in the Create Queue Sheet
  const [isClosingCreateQueueSheet, setIsClosingCreateQueueSheet] = useState(false)
  const [createQueueSheetShown, setCreateQueueSheetShown] = useState(false)

  const {
    data: queues,
    error,
    isLoading,
    isError,
  } = useQueuesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const [searchQuery, setSearchQuery] = useQueryState('search')

  if (isLoading)
    return (
      <div className="p-10">
        <GenericSkeletonLoader />
      </div>
    )
  if (isError)
    return (
      <div className="p-10">
        <AlertError error={error} subject="Failed to retrieve database queues" />
      </div>
    )

  return (
    <>
      <div className="w-full space-y-4 p-10">
        {queues.length === 0 ? (
          <div
            className={
              'border rounded border-default px-20 py-16 flex flex-col items-center justify-center space-y-4 border-dashed'
            }
          >
            <p className="text-sm text-foreground">No queues created yet</p>
            <Button onClick={() => setCreateQueueSheetShown(true)}>Add a new queue</Button>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between flex-wrap">
              <Input
                placeholder="Search for a queue"
                size="small"
                icon={<Search size={14} />}
                value={searchQuery || ''}
                className="w-64"
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <Button onClick={() => setCreateQueueSheetShown(true)}>Create a queue</Button>
            </div>

            <Table
              className="table-fixed overflow-x-auto"
              head={
                <>
                  <Table.th key="name">Name</Table.th>
                  <Table.th key="arguments" className="table-cell">
                    Type
                  </Table.th>
                  <Table.th key="rls_enabled" className="table-cell">
                    <div className="flex justify-center">RLS enabled</div>
                  </Table.th>
                  <Table.th key="created_at" className="table-cell w-60">
                    Created at
                  </Table.th>
                  <Table.th key="queue_size" className="table-cell">
                    <div className="flex justify-center">Size</div>
                  </Table.th>
                  <Table.th key="buttons" className="table-cell"></Table.th>
                </>
              }
              body={<QueuesRows queues={queues} filterString={searchQuery || ''} />}
            />
          </div>
        )}
      </div>

      <Sheet open={createQueueSheetShown} onOpenChange={() => setIsClosingCreateQueueSheet(true)}>
        <SheetContent size="default" className="w-[35%]" tabIndex={undefined}>
          <CreateQueueSheet
            onClose={() => {
              setIsClosingCreateQueueSheet(false)
              setCreateQueueSheetShown(false)
            }}
            isClosing={isClosingCreateQueueSheet}
            setIsClosing={setIsClosingCreateQueueSheet}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
