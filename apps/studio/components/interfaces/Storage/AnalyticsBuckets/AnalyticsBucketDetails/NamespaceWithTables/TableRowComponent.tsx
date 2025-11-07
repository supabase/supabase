import { snakeCase } from 'lodash'
import { MoreVertical, Pause, Play } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useUpdatePublicationMutation } from 'data/etl/publication-update-mutation'
import { useStartPipelineMutation } from 'data/etl/start-pipeline-mutation'
import { useReplicationTablesQuery } from 'data/etl/tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { SqlEditor } from 'icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useAnalyticsBucketAssociatedEntities } from '../useAnalyticsBucketAssociatedEntities'

export const TableRowComponent = ({
  index,
  table,
  schema,
  isLoading,
}: {
  index: number
  table: { id: number; name: string; isConnected: boolean }
  schema: string
  isLoading?: boolean
}) => {
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [showStopReplicationModal, setShowStopReplicationModal] = useState(false)
  const [showStartReplicationModal, setShowStartReplicationModal] = useState(false)
  const [isUpdatingReplication, setIsUpdatingReplication] = useState(false)

  const { sourceId, publication, pipeline } = useAnalyticsBucketAssociatedEntities({
    projectRef,
    bucketId,
  })

  const { data: tables } = useReplicationTablesQuery({ projectRef, sourceId })

  const { mutateAsync: updatePublication } = useUpdatePublicationMutation()
  const { mutateAsync: startPipeline } = useStartPipelineMutation()

  const isReplicating = publication?.tables.find(
    (x) => table.name === snakeCase(`${x.schema}.${x.name}_changelog`)
  )

  const onConfirmStopReplication = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucketId) return console.error('Bucket ID is required')
    if (!sourceId) return toast.error('Source ID is required')
    if (!publication) return toast.error('Unable to find existing publication')
    if (!pipeline) return toast.error('Unable to find existing pipeline')

    try {
      setIsUpdatingReplication(true)
      // [Joshen ALPHA] Assumption here is that all the namespace tables have _changelog as suffix
      // May need to update if that assumption falls short (e.g for those dealing with iceberg APIs directly)
      const updatedTables = publication.tables.filter(
        (x) => table.name !== snakeCase(`${x.schema}.${x.name}_changelog`)
      )
      await updatePublication({
        projectRef,
        sourceId,
        publicationName: publication.name,
        tables: updatedTables,
      })
      await startPipeline({ projectRef, pipelineId: pipeline.id })
      setShowStopReplicationModal(false)
      toast.success('Successfully stopped replication for table! Pipeline is being restarted.')
    } catch (error: any) {
      toast.error(`Failed to stop replication for table: ${error.message}`)
    } finally {
      setIsUpdatingReplication(false)
    }
  }

  const onConfirmStartReplication = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucketId) return console.error('Bucket ID is required')
    if (!sourceId) return toast.error('Source ID is required')
    if (!publication) return toast.error('Unable to find existing publication')
    if (!pipeline) return toast.error('Unable to find existing pipeline')

    // [Joshen ALPHA] This has potential to be flaky - we should see how we can get the table name and schema better
    const pgTable = tables?.find((t) => snakeCase(`${t.schema}.${t.name}_changelog`) === table.name)
    if (!pgTable) return toast.error('Unable to find corresponding Postgres table')

    try {
      setIsUpdatingReplication(true)
      const updatedTables = publication.tables.concat([
        { schema: pgTable.schema, name: pgTable.name },
      ])
      await updatePublication({
        projectRef,
        sourceId,
        publicationName: publication.name,
        tables: updatedTables,
      })
      await startPipeline({ projectRef, pipelineId: pipeline.id })
      setShowStartReplicationModal(false)
      toast.success('Successfully stopped replication for table! Pipeline is being restarted.')
    } catch (error: any) {
      toast.error(`Failed to stop replication for table: ${error.message}`)
    } finally {
      setIsUpdatingReplication(false)
    }
  }

  return (
    <>
      <TableRow>
        <TableCell className="min-w-[120px]">{table.name}</TableCell>
        {!!publication && (
          <TableCell colSpan={table.isConnected ? 1 : 2} className="min-w-[150px]">
            <div className="flex flex-row items-center text-foregroung-lighter">
              <div className="relative mr-2 align-middle w-3 h-3">
                <span
                  className={`absolute inset-0 rounded-full ${
                    isReplicating
                      ? isLoading
                        ? 'bg-brand/20 animate-ping'
                        : 'bg-brand/20 animate-ping'
                      : isLoading
                        ? 'bg-selection/20 animate-ping'
                        : 'hidden'
                  }`}
                  style={{
                    animationDelay: `${1 + index * 0.15}s`,
                    animationDuration: '2s',
                  }}
                />
                <span
                  className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 inline-block w-2 h-2 rounded-full ${
                    isReplicating ? 'bg-brand' : 'bg-selection'
                  }`}
                />
              </div>
              <span className="text-foreground-lighter">
                {isLoading && !isReplicating
                  ? '-'
                  : isReplicating
                    ? 'Replicating'
                    : 'Not replicating'}
              </span>
            </div>
          </TableCell>
        )}

        {table.isConnected && (
          <TableCell className="text-right flex flex-row items-center gap-x-2 justify-end">
            <>
              <Button asChild type="default" size="tiny">
                <Link href={`/project/${project?.ref}/editor/${table.id}?schema=${schema}`}>
                  <p>View table</p>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" className="px-1" icon={<MoreVertical />} />
                </DropdownMenuTrigger>

                <DropdownMenuContent side="bottom" align="end" className="w-fit min-w-[180px]">
                  <DropdownMenuItem asChild className="flex items-center gap-x-2">
                    <Link
                      href={`/project/${project?.ref}/sql/new?content=${encodeURIComponent(`select * from ${schema}.${table.name};`)}`}
                    >
                      <SqlEditor size={12} className="text-foreground-lighter" />
                      <p>Query in SQL Editor</p>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {isReplicating ? (
                    <DropdownMenuItem
                      className="flex items-center gap-x-2"
                      onClick={() => setShowStopReplicationModal(true)}
                    >
                      <Pause size={12} className="text-foreground-lighter" />
                      <p>Stop replication</p>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="flex items-center gap-x-2"
                      onClick={() => setShowStartReplicationModal(true)}
                    >
                      <Play size={12} className="text-foreground-lighter" />
                      <p>Start replication</p>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          </TableCell>
        )}
      </TableRow>
      <ConfirmationModal
        size="medium"
        variant="warning"
        visible={showStopReplicationModal}
        loading={isUpdatingReplication}
        title="Confirm to stop replication for table"
        confirmLabel="Stop replication"
        onCancel={() => setShowStopReplicationModal(false)}
        onConfirm={() => onConfirmStopReplication()}
      >
        <p className="text-sm text-foreground-light">
          Data within the "{table.name}" table will stop replicating. However do note that,
          restarting replication on the table will clear and re-sync all data in it. Are you sure?
        </p>
      </ConfirmationModal>
      <ConfirmationModal
        size="medium"
        variant="warning"
        visible={showStartReplicationModal}
        loading={isUpdatingReplication}
        title="Confirm to start replication for table"
        confirmLabel="Start replication"
        onCancel={() => setShowStartReplicationModal(false)}
        onConfirm={() => onConfirmStartReplication()}
      >
        <p className="text-sm text-foreground-light">
          Restarting replication on the "{table.name}" table will clear and re-sync all data in it.
          Are you sure?
        </p>
      </ConfirmationModal>
    </>
  )
}
