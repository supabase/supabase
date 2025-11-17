import { uniq } from 'lodash'
import { Loader2, MoreVertical, Pause, Play, Trash } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import {
  convertKVStringArrayToJson,
  formatWrapperTables,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { getDecryptedParameters } from 'components/interfaces/Storage/ImportForeignSchemaDialog.utils'
import { DotPing } from 'components/ui/DotPing'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { useReplicationPipelineStatusQuery } from 'data/etl/pipeline-status-query'
import { useUpdatePublicationMutation } from 'data/etl/publication-update-mutation'
import { useStartPipelineMutation } from 'data/etl/start-pipeline-mutation'
import { useReplicationTablesQuery } from 'data/etl/tables-query'
import { useFDWUpdateMutation } from 'data/fdw/fdw-update-mutation'
import { useIcebergNamespaceTableDeleteMutation } from 'data/storage/iceberg-namespace-table-delete-mutation'
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  getAnalyticsBucketFDWServerName,
  getNamespaceTableNameFromPostgresTableName,
} from '../AnalyticsBucketDetails.utils'
import { useAnalyticsBucketAssociatedEntities } from '../useAnalyticsBucketAssociatedEntities'
import { useAnalyticsBucketWrapperInstance } from '../useAnalyticsBucketWrapperInstance'
import { inferPostgresTableFromNamespaceTable } from './NamespaceWithTables.utils'

interface TableRowComponentProps {
  table: { id: number; name: string; isConnected: boolean }
  schema: string
  namespace: string
  isLoading?: boolean
}

export const TableRowComponent = ({
  table,
  schema,
  namespace,
  isLoading,
}: TableRowComponentProps) => {
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [showStopReplicationModal, setShowStopReplicationModal] = useState(false)
  const [showStartReplicationModal, setShowStartReplicationModal] = useState(false)
  const [showRemoveTableModal, setShowRemoveTableModal] = useState(false)
  const [isUpdatingReplication, setIsUpdatingReplication] = useState(false)
  const [isRemovingTable, setIsRemovingTable] = useState(false)

  const { sourceId, publication, pipeline } = useAnalyticsBucketAssociatedEntities({
    projectRef,
    bucketId,
  })
  const { data } = useReplicationPipelineStatusQuery({ projectRef, pipelineId: pipeline?.id })
  const pipelineStatus = data?.status.name

  const { data: tables } = useReplicationTablesQuery({ projectRef, sourceId })
  const { data: wrapperInstance, meta: wrapperMeta } = useAnalyticsBucketWrapperInstance({
    bucketId: bucketId,
  })

  const { mutateAsync: updateFDW } = useFDWUpdateMutation()
  const { mutateAsync: deleteNamespaceTable } = useIcebergNamespaceTableDeleteMutation({
    projectRef,
  })
  const { mutateAsync: updatePublication } = useUpdatePublicationMutation()
  const { mutateAsync: startPipeline } = useStartPipelineMutation()

  const inferredPostgresTable = inferPostgresTableFromNamespaceTable({
    publication,
    tableName: table.name,
  })
  const isTableUnderReplicationPublication = !!inferredPostgresTable
  const hasReplication = !!pipeline && !!publication
  const isPipelineRunning = pipelineStatus === 'started'
  const isReplicating = isTableUnderReplicationPublication && isPipelineRunning

  // [Joshen] Considers both the replication pipeline status + if the table is in the replication publication
  const replicationStatusLabel = useMemo(() => {
    if (isLoading) return 'Checking'

    if (hasReplication) {
      if (!isPipelineRunning) {
        return '-'
      } else if (isTableUnderReplicationPublication) {
        return 'Running'
      } else {
        return 'Disabled'
      }
    }
  }, [hasReplication, isLoading, isPipelineRunning, isTableUnderReplicationPublication])

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
        (x) => table.name !== getNamespaceTableNameFromPostgresTableName(x)
      )
      await updatePublication({
        projectRef,
        sourceId,
        publicationName: publication.name,
        tables: updatedTables,
      })
      await startPipeline({ projectRef, pipelineId: pipeline.id })
      setShowStopReplicationModal(false)
      toast.success('Successfully disabled replication for table! Pipeline is being restarted.')
    } catch (error: any) {
      toast.error(`Failed to disable replication for table: ${error.message}`)
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
    const pgTable = tables?.find(
      (t) => getNamespaceTableNameFromPostgresTableName(t) === table.name
    )
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
      toast.success('Successfully enabled replication for table! Pipeline is being restarted.')
    } catch (error: any) {
      toast.error(`Failed to enable replication for table: ${error.message}`)
    } finally {
      setIsUpdatingReplication(false)
    }
  }

  const onConfirmRemoveTable = async () => {
    if (!bucketId) return console.error('Bucket ID is required')
    if (!wrapperInstance || !wrapperMeta) return toast.error('Unable to find wrapper')

    try {
      setIsRemovingTable(true)

      // [Joshen] Update FDW instance only if table is in FDW instance's tables
      // e.g for a namespace table that was added outside of the dashboard, it wouldn't be
      const isTableInWrapperInstance = wrapperInstance.tables.some((x) => x.name === table.name)
      if (isTableInWrapperInstance) {
        const serverName = getAnalyticsBucketFDWServerName(bucketId)
        const serverOptions = await getDecryptedParameters({
          ref: project?.ref,
          connectionString: project?.connectionString ?? undefined,
          wrapper: wrapperInstance,
        })
        const formValues: Record<string, string> = {
          wrapper_name: wrapperInstance.name,
          server_name: wrapperInstance.server_name,
          ...serverOptions,
        }
        const targetSchemas = (formValues['supabase_target_schema'] || '')
          .split(',')
          .map((s) => s.trim())
        const wrapperTables = formatWrapperTables(wrapperInstance, wrapperMeta).filter(
          (x) => x.table_name !== table.name
        )

        // [Joshen] Once Ivan's PR goes through, swap these out to just use useFDWDropForeignTableMutation
        // https://github.com/supabase/supabase/pull/40206
        await updateFDW({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          wrapper: wrapperInstance,
          wrapperMeta,
          formState: {
            ...formValues,
            server_name: serverName,
            supabase_target_schema: uniq([...targetSchemas])
              .filter(Boolean)
              .join(','),
          },
          tables: wrapperTables,
        })
      }

      const wrapperValues = convertKVStringArrayToJson(wrapperInstance?.server_options ?? [])
      await deleteNamespaceTable({
        catalogUri: wrapperValues.catalog_uri,
        warehouse: wrapperValues.warehouse,
        namespace: namespace,
        table: table.name,
      })

      toast.success('Successfully removed table!')
      setShowRemoveTableModal(false)
    } catch (error: any) {
      toast.error(`Failed to remove table: ${error.message}`)
    } finally {
      setIsRemovingTable(false)
    }
  }

  return (
    <>
      <TableRow>
        <TableCell className="min-w-[120px]">{table.name}</TableCell>
        {!!hasReplication && (
          <TableCell colSpan={table.isConnected ? 1 : 2} className="min-w-[150px]">
            <div className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-x-2">
                    {isLoading ? (
                      <Loader2 size={12} className="animate-spin text-foreground-lighter" />
                    ) : isPipelineRunning ? (
                      <DotPing
                        animate={isReplicating}
                        variant={isReplicating ? 'primary' : 'default'}
                      />
                    ) : null}
                    <span className="text-foreground-lighter capitalize">
                      {replicationStatusLabel}
                    </span>
                  </div>
                </TooltipTrigger>
                {isPipelineRunning && (
                  <TooltipContent side="bottom">
                    {isReplicating
                      ? `Table data is currently replicating${!!inferredPostgresTable ? ` from ${inferredPostgresTable.schema}.${inferredPostgresTable.name}` : ''}`
                      : !isTableUnderReplicationPublication
                        ? 'Replication is disabled for this table'
                        : undefined}
                  </TooltipContent>
                )}
              </Tooltip>
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

                  {!!publication && (
                    <>
                      {isTableUnderReplicationPublication ? (
                        <DropdownMenuItem
                          className="flex items-center gap-x-2"
                          onClick={() => setShowStopReplicationModal(true)}
                        >
                          <Pause size={12} className="text-foreground-lighter" />
                          <p>Disable replication</p>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="flex items-center gap-x-2"
                          onClick={() => setShowStartReplicationModal(true)}
                        >
                          <Play size={12} className="text-foreground-lighter" />
                          <p>Enable replication</p>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItemTooltip
                    disabled={isReplicating}
                    className="flex items-center gap-x-2"
                    onClick={() => setShowRemoveTableModal(true)}
                    tooltip={{
                      content: {
                        side: 'left',
                        text: 'Stop replication on this table before removing',
                      },
                    }}
                  >
                    <Trash size={12} className="text-foreground-lighter" />
                    <p>Remove table</p>
                  </DropdownMenuItemTooltip>
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
        title="Confirm to disable replication for table"
        confirmLabel="Disable replication"
        onCancel={() => setShowStopReplicationModal(false)}
        onConfirm={() => onConfirmStopReplication()}
      >
        <p className="text-sm text-foreground-light">
          Data within the "{table.name}" table will stop replicating. However do note that,
          re-enabling replication on this table will clear and re-sync all data in it. Are you sure?
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        size="medium"
        variant="warning"
        visible={showStartReplicationModal}
        loading={isUpdatingReplication}
        title="Confirm to enable replication for table"
        confirmLabel="Enable replication"
        onCancel={() => setShowStartReplicationModal(false)}
        onConfirm={() => onConfirmStartReplication()}
      >
        <p className="text-sm text-foreground-light">
          Re-enabling replication on the "{table.name}" table will clear and re-sync all data in it.
          Are you sure?
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        size="small"
        variant="warning"
        visible={showRemoveTableModal}
        loading={isRemovingTable}
        title="Confirm to remove table"
        description="Data from the analytics table will be lost"
        confirmLabel="Remove table"
        onCancel={() => setShowRemoveTableModal(false)}
        onConfirm={() => onConfirmRemoveTable()}
      >
        <p className="text-sm text-foreground-light">Are you sure? This action cannot be undone.</p>
      </ConfirmationModal>
    </>
  )
}
