import { ChevronRight, Info, Loader2, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'

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
  CardHeader,
  CardTitle,
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
import { useAnalyticsBucketAssociatedEntities } from '../useAnalyticsBucketAssociatedEntities'
import { TableRowComponent } from './TableRowComponent'

type NamespaceWithTablesProps = {
  bucketName?: string
  namespace: string
  sourceType: 'replication' | 'direct'
  schema: string
  tables: (FormattedWrapperTable & { id: number })[]
  token: string
  wrapperInstance: FDW
  wrapperValues: Record<string, string>
  wrapperMeta: WrapperMeta
  tablesToPoll: { schema: string; name: string }[]
  pollIntervalNamespaceTables: number
  setPollIntervalNamespaceTables: (value: number) => void
}

export const NamespaceWithTables = ({
  bucketName,
  namespace,
  sourceType = 'direct',
  schema,
  tables,
  token,
  wrapperInstance,
  wrapperValues,
  wrapperMeta,
  tablesToPoll,
  pollIntervalNamespaceTables,
  setPollIntervalNamespaceTables,
}: NamespaceWithTablesProps) => {
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [importForeignSchemaShown, setImportForeignSchemaShown] = useState(false)

  const { publication } = useAnalyticsBucketAssociatedEntities({ projectRef, bucketId })

  const { data: tablesData, isLoading: isLoadingNamespaceTables } = useIcebergNamespaceTablesQuery(
    {
      catalogUri: wrapperValues.catalog_uri,
      warehouse: wrapperValues.warehouse,
      token: token,
      namespace: namespace,
    },
    {
      enabled: !!token,
      refetchInterval: (data) => {
        if (pollIntervalNamespaceTables === 0) return false
        if (tablesToPoll.length > 0) {
          const hasMissingTables =
            (data ?? []).filter((t) => !tables.find((table) => table.table.split('.')[1] === t))
              .length > 0

          if (hasMissingTables) {
            setPollIntervalNamespaceTables(0)
            return false
          }
        }
        return pollIntervalNamespaceTables
      },
    }
  )

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

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center px-4 py-5 space-y-0">
        <CardTitle className="text-sm font-normal font-sans normal-case leading-none flex flex-row items-center gap-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex flex-row items-center gap-x-1 text-foreground-lighter">
                {sourceType === 'direct' ? namespace : 'public'}
                <ChevronRight size={12} className="text-foreground-muted" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{sourceType === 'direct' ? 'Analytics' : 'Postgres'} schema</p>
            </TooltipContent>
          </Tooltip>
          {validSchema && (
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
          )}
        </CardTitle>

        <div className="flex flex-row gap-x-2">
          {tablesToPoll.length > 0 && (
            <div className="flex items-center gap-x-2 ml-6 text-foreground-lighter">
              <Loader2 size={14} className="animate-spin" />
              <p className="text-sm">
                Connecting {tablesToPoll.length} table{tablesToPoll.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
          {missingTables.length > 0 && (
            <Button
              type={schema ? 'default' : 'warning'}
              size="tiny"
              icon={schema ? <RefreshCw /> : <Plus size={14} />}
              onClick={() => (schema ? rescanNamespace() : setImportForeignSchemaShown(true))}
              loading={isImportingForeignSchema || isLoadingNamespaceTables}
            >
              {schema ? 'Sync tables' : `Connect to table${missingTables.length > 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      </CardHeader>

      {tablesToPoll.length > 0 && <LoadingLine loading />}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={allTables.length === 0 ? 'text-foreground-muted' : undefined}>
              Table name
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
            allTables.map((table, index) => (
              <TableRowComponent
                key={table.name}
                table={table}
                schema={displaySchema}
                isLoading={isImportingForeignSchema || isLoadingNamespaceTables}
                index={index}
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
    </Card>
  )
}
