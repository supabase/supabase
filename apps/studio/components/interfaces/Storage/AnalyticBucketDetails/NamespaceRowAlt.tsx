import { Code, Eye, MoreVertical, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import { FormattedWrapperTable } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { ImportForeignSchemaDialog } from 'components/interfaces/Storage/ImportForeignSchemaDialog'
import { InlineLink } from 'components/ui/InlineLink'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import { FDW } from 'data/fdw/fdws-query'
import { useIcebergNamespaceTablesQuery } from 'data/storage/iceberg-namespace-tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import {
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

type NamespaceRowAltProps = {
  bucketName: string
  namespace: string
  schema: string
  tables: (FormattedWrapperTable & { id: number })[]
  token: string
  wrapperInstance: FDW
  wrapperValues: Record<string, string>
  wrapperMeta: WrapperMeta
}

// Component for individual table rows within a namespace
const TableRowComponent = ({
  tableName,
  isConnected,
  schema,
}: {
  tableName: string
  isConnected: boolean
  schema?: string
}) => {
  const { data: project } = useSelectedProjectQuery()

  // console.log({ schema })
  // console.log({ project })

  console.log({ tableName, isConnected })

  const handleQueryTable = () => {
    // TODO: Implement query table functionality
    console.log('Query table:', tableName)
  }

  const handleDeleteTable = () => {
    // TODO: Implement delete table functionality
    console.log('Delete table:', tableName)
  }

  return (
    <TableRow>
      <TableCell>{tableName}</TableCell>
      <TableCell>
        <div className="flex flex-row items-center text-foregroung-lighter">
          <div className="relative mr-2 align-middle w-3 h-3">
            {/* Outer faded dot with pulsing background */}
            <span
              className={`absolute inset-0 rounded-full ${
                isConnected ? 'bg-brand/20 animate-ping delay-[1s]' : 'hidden'
              }`}
            />
            {/* Inner colored dot */}
            <span
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 inline-block w-2 h-2 rounded-full ${
                isConnected ? 'bg-brand' : 'bg-warning-500'
              }`}
            />
          </div>
          <span className="text-foreground-light">{isConnected ? 'Synced' : 'Needs syncing'}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {isConnected && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="default" className="px-1" icon={<MoreVertical />} />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-fit min-w-[180px]">
              <DropdownMenuItem className="flex items-center space-x-2">
                <Eye size={12} className="text-foreground-lighter" />
                <p>View in Table Editor</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-2" onClick={handleQueryTable}>
                <Code size={12} className="text-foreground-lighter" />
                <p>Query in SQL Editor</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-2" onClick={handleDeleteTable}>
                <Trash2 size={12} className="text-foreground-lighter" />
                <p>Delete table</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  )
}

export const NamespaceRowAlt = ({
  bucketName,
  namespace,
  schema,
  tables,
  token,
  wrapperInstance,
  wrapperValues,
  wrapperMeta,
}: NamespaceRowAltProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [importForeignSchemaShown, setImportForeignSchemaShown] = useState(false)

  const { data: tablesData, isLoading: isLoadingNamespaceTables } = useIcebergNamespaceTablesQuery(
    {
      catalogUri: wrapperValues.catalog_uri,
      warehouse: wrapperValues.warehouse,
      token: token,
      namespace: namespace,
    },
    { enabled: !!token }
  )

  console.log({ tablesData, isLoadingNamespaceTables, token, enabled: !!token })

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

  console.log({ missingTables })

  let scanTooltip = useMemo(() => {
    if (isImportingForeignSchema) return 'Scanning for new tables...'
    if (isLoadingNamespaceTables) return 'Loading tables...'
    if (missingTables.length > 0)
      return `${missingTables.length} new table${missingTables.length > 1 ? 's' : ''} found`
    if (tables.length === 0) return 'No tables found'
    return 'All tables are up to date'
  }, [isImportingForeignSchema, isLoadingNamespaceTables, missingTables.length, tables.length])

  // Get all tables (connected + missing) for display
  const allTables = useMemo(() => {
    const connectedTableNames = tables.map((table) => table.table.split('.')[1])
    const allTableNames = [...new Set([...connectedTableNames, ...missingTables])]

    return allTableNames.map((tableName) => ({
      name: tableName,
      isConnected: connectedTableNames.includes(tableName),
    }))
  }, [tables, missingTables])

  console.log({ allTables })

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center px-4 py-5 space-y-0">
        <div className="flex flex-col gap-y-1">
          <CardTitle className="text-md font-normal font-sans normal-case leading-none">
            {namespace}
          </CardTitle>
          <CardDescription className="text-foreground-lighter">
            {schema ? `Linked to schema “${schema}”` : 'No schema linked'}
          </CardDescription>
        </div>
        <div className="flex flex-row gap-x-2">
          {!schema && (
            <Button
              type="default"
              size="tiny"
              icon={<Plus size={14} />}
              onClick={() => setImportForeignSchemaShown(true)}
              loading={isImportingForeignSchema}
            >
              Create schema
            </Button>
          )}
          {true && (
            <Button
              type="default"
              size="tiny"
              icon={<RefreshCw size={14} />}
              onClick={() => rescanNamespace()}
              loading={isImportingForeignSchema || isLoadingNamespaceTables}
            >
              Sync tables
            </Button>
          )}
          {tables.length > 0 && (
            <Button type="default" size="tiny" icon={<Eye size={14} />}>
              Table Editor
            </Button>
          )}
        </div>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={allTables.length === 0 ? 'text-foreground-muted' : undefined}>
              Table
            </TableHead>
            <TableHead className={allTables.length === 0 ? 'text-foreground-muted' : undefined}>
              Status
            </TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {allTables.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3}>
                <p className="text-sm text-foreground">No tables yet</p>
                <p className="text-sm text-foreground-lighter">
                  Publish an analytics table and then sync.{' '}
                  <InlineLink
                    href={`${DOCS_URL}/guides/storage/analytics/connecting-to-analytics-bucket`}
                  >
                    Learn more
                  </InlineLink>
                </p>
              </TableCell>
            </TableRow>
          ) : (
            allTables.map(({ name, isConnected }) => (
              <TableRowComponent
                key={name}
                tableName={name}
                isConnected={isConnected}
                schema={schema}
              />
            ))
          )}
        </TableBody>
      </Table>
      <ImportForeignSchemaDialog
        bucketName={bucketName}
        namespace={namespace}
        wrapperMeta={wrapperMeta}
        visible={importForeignSchemaShown}
        onClose={() => setImportForeignSchemaShown(false)}
      />
      <CardFooter className="px-4 py-4 text-sm text-foreground-muted border-t border-border">
        {scanTooltip ? <p>{scanTooltip}</p> : <ShimmeringLoader className="py-0 w-20" />}
      </CardFooter>
    </Card>
  )
}
