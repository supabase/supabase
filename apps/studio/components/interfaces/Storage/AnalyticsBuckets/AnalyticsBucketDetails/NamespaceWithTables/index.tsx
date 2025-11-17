import { Loader2, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import type { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import { FormattedWrapperTable } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { ImportForeignSchemaDialog } from 'components/interfaces/Storage/ImportForeignSchemaDialog'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import { FDW } from 'data/fdw/fdws-query'
import { useIcebergNamespaceTablesQuery } from 'data/storage/iceberg-namespace-tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Button,
  Card,
  CardFooter,
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
import { getNamespaceTableNameFromPostgresTableName } from '../AnalyticsBucketDetails.utils'
import { useAnalyticsBucketAssociatedEntities } from '../useAnalyticsBucketAssociatedEntities'
import { SchemaFlowDiagram } from './SchemaFlowDiagram'
import { TableRowComponent } from './TableRowComponent'

type NamespaceWithTablesProps = {
  bucketName?: string
  namespace: string
  sourceType: 'replication' | 'direct'
  schema: string
  tables: (FormattedWrapperTable & { id: number })[]
  wrapperInstance: FDW
  wrapperValues: Record<string, string>
  wrapperMeta: WrapperMeta
  pollIntervalNamespaceTables: number
  setPollIntervalNamespaceTables: (value: number) => void
}

export const NamespaceWithTables = ({
  bucketName,
  namespace,
  sourceType = 'direct',
  schema,
  tables,
  wrapperInstance,
  wrapperValues,
  wrapperMeta,
  pollIntervalNamespaceTables,
  setPollIntervalNamespaceTables,
}: NamespaceWithTablesProps) => {
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [importForeignSchemaShown, setImportForeignSchemaShown] = useState(false)

  const { publication } = useAnalyticsBucketAssociatedEntities({ projectRef, bucketId })

  const {
    data: tablesData = [],
    isLoading: isLoadingNamespaceTables,
    isSuccess: isSuccessNamespaceTables,
  } = useIcebergNamespaceTablesQuery(
    {
      catalogUri: wrapperValues.catalog_uri,
      warehouse: wrapperValues.warehouse,
      namespace: namespace,
      projectRef,
    },
    {
      refetchInterval: (data = []) => {
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

  const publicationTables = publication?.tables ?? []
  const publicationTablesNotSyncedToNamespaceTables = publicationTables.filter(
    (x) => !tablesData.includes(getNamespaceTableNameFromPostgresTableName(x))
  )
  const isSyncedPublicationTablesAndNamespaceTables =
    publicationTablesNotSyncedToNamespaceTables.length === 0

  const { mutateAsync: importForeignSchema, isLoading: isImportingForeignSchema } =
    useFDWImportForeignSchemaMutation()

  const rescanNamespace = async () => {
    await importForeignSchema({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      serverName: wrapperInstance.server_name,
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

  // Determine what schema name to display
  const displaySchema = useMemo(() => {
    // If we have a target schema, use it
    if (schema) return schema

    // Otherwise, show the incoming schema (namespace name)
    return `fdw_analytics_${namespace.replaceAll('-', '_')}`
  }, [schema, namespace])

  useEffect(() => {
    if (isSuccessNamespaceTables && !isSyncedPublicationTablesAndNamespaceTables) {
      setPollIntervalNamespaceTables(4000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessNamespaceTables, isSyncedPublicationTablesAndNamespaceTables])

  return (
    <Card>
      {validSchema && (
        <SchemaFlowDiagram
          sourceLabel={sourceType === 'direct' ? namespace : 'public'}
          sourceType={sourceType === 'direct' ? 'analytics' : 'postgres'}
          targetLabel={displaySchema}
          isPending={tables.length === 0}
        />
      )}

      {pollIntervalNamespaceTables > 0 && <LoadingLine loading />}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={allTables.length === 0 ? 'text-foreground-muted' : undefined}>
              Table name
            </TableHead>
            {!!publication && (
              <TableHead className={allTables.length === 0 ? 'hidden' : undefined}>
                Replication
              </TableHead>
            )}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {allTables.length === 0 ? (
            <TableRow className="[&>td]:hover:bg-inherit">
              <TableCell colSpan={3} className="min-h-[60px] py-4">
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
                isLoading={isImportingForeignSchema || isLoadingNamespaceTables}
              />
            ))
          )}
        </TableBody>
      </Table>
      <ImportForeignSchemaDialog
        bucketName={bucketName ?? ''}
        namespace={namespace}
        circumstance="clash"
        wrapperMeta={wrapperMeta}
        visible={importForeignSchemaShown}
        onClose={() => setImportForeignSchemaShown(false)}
      />
      {(pollIntervalNamespaceTables > 0 || missingTables.length > 0) && (
        <CardFooter className="border-t px-4 py-4 flex flex-row justify-end gap-x-4 relative overflow-hidden">
          {pollIntervalNamespaceTables > 0 && (
            <div className="relative z-10">
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
                  <p className="mb-1">Waiting for analytics table to be created for:</p>
                  <ul className="list-disc pl-6">
                    {publicationTablesNotSyncedToNamespaceTables.map((x) => {
                      const value = `${x.schema}.${x.name}`
                      return <li key={value}>{value}</li>
                    })}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          {missingTables.length > 0 && (
            <div className="flex items-center gap-x-2 items-between justify-between flex-1">
              <p className="text-sm text-foreground-muted">
                {missingTables.length} new table
                {missingTables.length > 1 ? 's' : ''} waiting to connect
              </p>
              <Button
                type="default"
                size="tiny"
                icon={schema ? <Plus /> : undefined}
                onClick={() => (schema ? rescanNamespace() : setImportForeignSchemaShown(true))}
                loading={isImportingForeignSchema || isLoadingNamespaceTables}
                className="relative z-10"
              >
                Connect {missingTables.length > 1 ? missingTables.length : ''} table
                {missingTables.length > 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
