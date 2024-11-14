import { useEffect, useState } from 'react'

import EnableExtensionModal from 'components/interfaces/Database/Extensions/EnableExtensionModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useQueuesQuery } from 'data/database-queues/database-queues-query'
import { Search } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { Button, Input, Sheet, SheetContent } from 'ui'
import { CreateQueueSheet } from './CreateQueueSheet'
import { QueuesDisabledState } from './QueuesDisabledState'
import { QueuesRows } from './QueuesRows'

export const QueuesListing = () => {
  const { project } = useProjectContext()

  const [showEnableExtensionModal, setShowEnableExtensionModal] = useState(false)
  // used for confirmation prompt in the Create Queue Sheet
  const [isClosingCreateQueueSheet, setIsClosingCreateQueueSheet] = useState(false)
  const [createQueueSheetShown, setCreateQueueSheetShown] = useState(false)

  const {
    data: queues,
    error,
    isLoading,
    isError,
    refetch,
  } = useQueuesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: extensions, isLoading: isLoadingExtensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgmqExtension = (extensions ?? []).find((ext) => ext.name === 'pgmq')
  // TODO: Change this to true for local development to work
  const pgmqExtensionInstalled = pgmqExtension?.installed_version

  useEffect(() => {
    // refetch the queues after the pgmq extension has been installed
    if (pgmqExtensionInstalled && isError) {
      refetch()
    }
  }, [isError, pgmqExtensionInstalled, refetch])

  const [searchQuery, setSearchQuery] = useQueryState('search')

  // this avoid showing loading screen when the extension is not installed. Otherwise, we'll have to wait for three
  // retries (which are sure to fail because the extension is not installed)
  if (isLoadingExtensions) return <GenericSkeletonLoader />
  if (!pgmqExtensionInstalled) return <QueuesDisabledState />
  if (isLoading) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject="Failed to retrieve database queues" />

  return (
    <>
      <div className="w-full space-y-4">
        <FormHeader
          title="Queues"
          description="Use message queues to handle asynchronous tasks, manage workloads, and enable reliable communication between different parts of your application."
        />
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
        <SheetContent size="default" tabIndex={undefined}>
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
      {pgmqExtension ? (
        <EnableExtensionModal
          visible={showEnableExtensionModal}
          extension={pgmqExtension}
          onCancel={() => setShowEnableExtensionModal(false)}
        />
      ) : null}
    </>
  )
}
