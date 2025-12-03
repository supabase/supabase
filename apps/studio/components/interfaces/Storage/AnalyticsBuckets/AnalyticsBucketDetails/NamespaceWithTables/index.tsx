import { ChevronRight, Info, Loader2, MoreVertical, Plus, RefreshCw, Trash } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { FormattedWrapperTable } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { ImportForeignSchemaDialog } from 'components/interfaces/Storage/ImportForeignSchemaDialog'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useFDWDropForeignTableMutation } from 'data/fdw/fdw-drop-foreign-table-mutation'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import { useIcebergNamespaceDeleteMutation } from 'data/storage/iceberg-namespace-delete-mutation'
import { useIcebergNamespaceTableDeleteMutation } from 'data/storage/iceberg-namespace-table-delete-mutation'
import { useIcebergNamespaceTablesQuery } from 'data/storage/iceberg-namespace-tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  LoadingLine,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { HIDE_REPLICATION_USER_FLOW } from '../AnalyticsBucketDetails.constants'
import { getNamespaceTableNameFromPostgresTableName } from '../AnalyticsBucketDetails.utils'
import { InitializeForeignSchemaDialog } from '../InitializeForeignSchemaDialog'
import { UpdateForeignSchemaDialog } from '../UpdateForeignSchemaDialog'
import { useAnalyticsBucketAssociatedEntities } from '../useAnalyticsBucketAssociatedEntities'
import { TableRowComponent } from './TableRowComponent'

type NamespaceWithTablesProps = {
  namespace: string
  sourceType: 'replication' | 'direct'
  schema: string
  tables: (FormattedWrapperTable & { id: number })[]
  wrapperValues: Record<string, string>
  pollIntervalNamespaceTables: number
  setPollIntervalNamespaceTables: (value: number) => void
}

export const NamespaceWithTables = ({
  namespace,
  sourceType = 'direct',
  schema,
  tables,
  wrapperValues,
  pollIntervalNamespaceTables,
  setPollIntervalNamespaceTables,
}: NamespaceWithTablesProps) => {
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [importForeignSchemaShown, setImportForeignSchemaShown] = useState(false)
  const [showConfirmDeleteNamespace, setShowConfirmDeleteNamespace] = useState(false)
  const [isDeletingNamespace, setIsDeletingNamespace] = useState(false)

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef })
  const { publication, icebergWrapper } = useAnalyticsBucketAssociatedEntities({
    projectRef,
    bucketId,
  })

  const {
    data: tablesData = [],
    isLoading: isLoadingNamespaceTables,
    isSuccess: isSuccessNamespaceTables,
  } = useIcebergNamespaceTablesQuery(
    {
      warehouse: wrapperValues.warehouse,
      namespace: namespace,
      projectRef,
    },
    {
      refetchInterval: (_data) => {
        const data = _data ?? []
        if (pollIntervalNamespaceTables === 0) return false

        const publicationTables = publication?.tables ?? []
        const isSynced = !publicationTables.some(
          (x) => !data.includes(getNamespaceTableNameFromPostgresTableName(x))
        )
        if (isSynced) {
          setPollIntervalNamespaceTables(0)
          return false
        }

        return pollIntervalNamespaceTables
      },
    }
  )

  const connectedForeignTablesForNamespace = (icebergWrapper?.tables ?? []).filter((x) =>
    x.options[0].startsWith(`table=${namespace}.`)
  )
  const tablesWithConnectedForeignTables = connectedForeignTablesForNamespace.reduce((a, b) => {
    const table = b.options[0].split(`table=${namespace}.`)[1]
    a.add(table)
    return a
  }, new Set<string>())
  const unconnectedTables = tablesData.filter((x) => !tablesWithConnectedForeignTables.has(x))
  const hasUnconnectedForeignTablesForNamespace = unconnectedTables.length > 0

  const publicationTables = publication?.tables ?? []
  const publicationTablesNotSyncedToNamespaceTables = publicationTables.filter(
    (x) => !tablesData.includes(getNamespaceTableNameFromPostgresTableName(x))
  )
  const isSyncedPublicationTablesAndNamespaceTables =
    publicationTablesNotSyncedToNamespaceTables.length === 0

  const { mutateAsync: importForeignSchema, isPending: isImportingForeignSchema } =
    useFDWImportForeignSchemaMutation()
  const { mutateAsync: deleteNamespace } = useIcebergNamespaceDeleteMutation()
  const { mutateAsync: dropForeignTable } = useFDWDropForeignTableMutation()
  const { mutateAsync: deleteNamespaceTable } = useIcebergNamespaceTableDeleteMutation()

  const rescanNamespace = async () => {
    if (!icebergWrapper) return console.error('Iceberg wrapper cannot be found')

    await importForeignSchema({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      serverName: icebergWrapper.server_name,
      sourceSchema: namespace,
      targetSchema: schema,
    })
  }

  const missingTables = useMemo(() => {
    return (tablesData || []).filter(
      (t) => !tables.find((table) => table.table.split('.')[1] === t)
    )
  }, [tablesData, tables])

  // Get all tables (connected + missing) for display
  const allTables = useMemo(() => {
    const connectedTableNames = tables.map((table) => table.table.split('.')[1])
    const allTableNames = [...new Set([...connectedTableNames, ...missingTables])]

    return allTableNames.map((tableName) => ({
      id: tables.find((t) => t.table_name === tableName)?.id ?? 0,
      name: tableName,
      isConnected: connectedTableNames.includes(tableName),
    }))
  }, [tables, missingTables])

  // Determine if schema is valid (no clashes with Postgres schema)
  // TODO: Replace with actual clash check logic
  const validSchema = useMemo(() => {
    // If schema exists and has tables, it's always valid
    if (schema && tables.length > 0) return true

    // For uploaded namespaces without tables, check for clashes against incoming schema (namespace name)
    // TODO: Replace with actual clash check against Postgres schema
    const hasClashes = false // Mock: no clashes for now

    // Show incoming schema if no clashes (even without tables)
    return !hasClashes
  }, [schema, tables.length])

  const displaySchema = useMemo(() => {
    // If we have a target schema, use it, otherwise show the incoming schema (namespace name)
    if (schema) return schema
    return `fdw_analytics_${namespace.replaceAll('-', '_')}`
  }, [schema, namespace])

  const onConfirmDeleteNamespace = async () => {
    if (!bucketId) return console.error('Bucket ID is required')

    try {
      setIsDeletingNamespace(true)

      // [Joshen] Delete all namespace tables
      await Promise.all(
        allTables.map((table) =>
          deleteNamespaceTable({
            projectRef,
            warehouse: bucketId,
            namespace,
            table: table.name,
          })
        )
      )

      // Delete all foreign tables that corresponding to the namespace tables
      await Promise.all(
        tables.map((table) =>
          dropForeignTable({
            projectRef,
            connectionString: project?.connectionString,
            schemaName: table.schema_name,
            tableName: table.table_name,
          })
        )
      )

      await deleteNamespace({ projectRef, warehouse: bucketId, namespace })

      toast.success(`Successfully deleted namespace "${namespace}"`)
      setShowConfirmDeleteNamespace(false)
    } catch (error: any) {
      toast.error(`Failed to delete namespace: ${error.message}`)
    } finally {
      setIsDeletingNamespace(false)
    }
  }

  useEffect(() => {
    if (isSuccessNamespaceTables && !isSyncedPublicationTablesAndNamespaceTables) {
      setPollIntervalNamespaceTables(4000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessNamespaceTables, isSyncedPublicationTablesAndNamespaceTables])

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center px-4 py-4 space-y-0">
        <CardTitle className="text-sm font-normal font-sans normal-case leading-none flex flex-row items-center gap-x-1">
          <div className="flex flex-row items-center gap-x-3 text-foreground">
            <img
              src={`${BASE_PATH}/img/icons/iceberg-icon.svg`}
              alt="Apache Iceberg icon"
              className="w-5 h-5"
            />
            <div className="flex flex-col gap-y-0.5">
              <p className="text-xs font-mono uppercase text-foreground-lighter">
                Iceberg namespace
              </p>
              <p className="text-sm">{namespace}</p>
            </div>
          </div>

          {!HIDE_REPLICATION_USER_FLOW && validSchema && (
            <>
              <ChevronRight size={12} className="text-foreground-muted" />
              <Tooltip>
                <TooltipTrigger
                  asChild
                  className={tables.length === 0 ? `flex flex-row items-center gap-x-1` : undefined}
                >
                  <span
                    className={
                      tables.length > 0
                        ? `text-foreground`
                        : `text-foreground-muted flex flex-row items-center gap-x-1`
                    }
                  >
                    {displaySchema}
                    {tables.length === 0 && <Info size={12} />}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Postgres schema{tables.length === 0 && ' that will be created'}</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </CardTitle>

        <div className="flex flex-row gap-x-6">
          {pollIntervalNamespaceTables > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-x-2 text-foreground-lighter">
                  <Loader2 size={14} className="animate-spin" />
                  <p className="text-sm">
                    Connecting {publicationTablesNotSyncedToNamespaceTables.length} table
                    {publicationTablesNotSyncedToNamespaceTables.length > 1 ? 's' : ''}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end">
                <p className="mb-1">Waiting for namespace table to be created for:</p>
                <ul className="list-disc pl-6">
                  {publicationTablesNotSyncedToNamespaceTables.map((x) => {
                    const value = `${x.schema}.${x.name}`
                    return <li key={value}>{value}</li>
                  })}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}

          <div className="flex items-center gap-x-2">
            {HIDE_REPLICATION_USER_FLOW ? (
              <>
                {/* Is this just the import foreign schema dialog then? */}
                {connectedForeignTablesForNamespace.length === 0 ? (
                  <InitializeForeignSchemaDialog namespace={namespace} />
                ) : hasUnconnectedForeignTablesForNamespace ? (
                  <UpdateForeignSchemaDialog namespace={namespace} tables={unconnectedTables} />
                ) : null}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="default" className="w-7" icon={<MoreVertical />} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-fit min-w-[180px]">
                    <DropdownMenuItem
                      className="flex items-center gap-x-2"
                      onClick={() => setShowConfirmDeleteNamespace(true)}
                    >
                      <Trash size={12} className="text-foreground-lighter" />
                      <p>Delete namespace</p>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : missingTables.length > 0 ? (
              <Button
                type={schema ? 'default' : 'warning'}
                size="tiny"
                icon={schema ? <RefreshCw /> : <Plus size={14} />}
                onClick={() => (schema ? rescanNamespace() : setImportForeignSchemaShown(true))}
                loading={isImportingForeignSchema || isLoadingNamespaceTables}
              >
                {schema ? 'Sync tables' : `Connect to table${missingTables.length > 1 ? 's' : ''}`}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      {pollIntervalNamespaceTables > 0 && <LoadingLine loading />}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={allTables.length === 0 ? 'text-foreground-muted' : undefined}>
              <span className="pl-8">Table name</span>
            </TableHead>
            {!!publication && (
              <TableHead className={allTables.length === 0 ? 'hidden' : undefined}>
                Replication Status
              </TableHead>
            )}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {allTables.length === 0 ? (
            <TableRow className="[&>td]:hover:bg-inherit">
              <TableCell colSpan={3}>
                <p className="text-sm text-foreground">No tables yet</p>
                <p className="text-sm text-foreground-lighter">
                  {sourceType === 'direct'
                    ? ' Publish an analytics table from your Iceberg client'
                    : 'Connect a table from your database'}
                </p>
              </TableCell>
            </TableRow>
          ) : (
            allTables.map((table) => (
              <TableRowComponent
                key={table.name}
                table={table}
                namespace={namespace}
                schema={displaySchema}
              />
            ))
          )}
        </TableBody>
      </Table>

      <ImportForeignSchemaDialog
        namespace={namespace}
        circumstance="clash"
        visible={importForeignSchemaShown}
        onClose={() => setImportForeignSchemaShown(false)}
      />

      <ConfirmationModal
        size="medium"
        variant="warning"
        loading={isDeletingNamespace}
        title={`Confirm to delete "${namespace}"`}
        description="This action cannot be undone."
        visible={showConfirmDeleteNamespace}
        onCancel={() => setShowConfirmDeleteNamespace(false)}
        onConfirm={() => onConfirmDeleteNamespace()}
      >
        <p className="text-sm">
          This will remove all Iceberg tables under the namespace, as well as any associated foreign
          tables. Are you sure?
        </p>
      </ConfirmationModal>
    </Card>
  )
}
