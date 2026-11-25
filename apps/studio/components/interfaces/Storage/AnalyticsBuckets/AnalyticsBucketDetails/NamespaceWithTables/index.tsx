import { useParams } from 'common'
import { MoreVerticalIcon, TrashIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
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
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { InitializeForeignSchemaDialog } from '../InitializeForeignSchemaDialog'
import { UpdateForeignSchemaDialog } from '../UpdateForeignSchemaDialog'
import { useAnalyticsBucketAssociatedEntities } from '../useAnalyticsBucketAssociatedEntities'
import { TableRowComponent } from './TableRowComponent'
import { FormattedWrapperTable } from '@/components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { useFDWDropForeignTableMutation } from '@/data/fdw/fdw-drop-foreign-table-mutation'
import { useIcebergNamespaceDeleteMutation } from '@/data/storage/iceberg-namespace-delete-mutation'
import { useIcebergNamespaceTableDeleteMutation } from '@/data/storage/iceberg-namespace-table-delete-mutation'
import { useIcebergNamespaceTablesQuery } from '@/data/storage/iceberg-namespace-tables-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { BASE_PATH } from '@/lib/constants'

type NamespaceWithTablesProps = {
  namespace: string
  schema: string
  tables: (FormattedWrapperTable & { id: number })[]
  wrapperValues: Record<string, string>
}

export const NamespaceWithTables = ({
  namespace,
  schema,
  tables,
  wrapperValues,
}: NamespaceWithTablesProps) => {
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [showConfirmDeleteNamespace, setShowConfirmDeleteNamespace] = useState(false)
  const [isDeletingNamespace, setIsDeletingNamespace] = useState(false)

  const { icebergWrapper } = useAnalyticsBucketAssociatedEntities({
    projectRef,
    bucketId,
  })

  const { data: tablesData = [] } = useIcebergNamespaceTablesQuery({
    warehouse: wrapperValues.warehouse,
    namespace,
    projectRef,
  })

  const connectedForeignTablesForNamespace = (icebergWrapper?.tables ?? []).filter((x) =>
    x.options[0].startsWith(`table=${namespace}.`)
  )
  const tablesWithConnectedForeignTables = connectedForeignTablesForNamespace.reduce((a, b) => {
    const table = b.options[0].split(`table=${namespace}.`)[1]
    a.add(table)
    return a
  }, new Set<string>())
  const unconnectedTables = tablesData.filter((x) => !tablesWithConnectedForeignTables.has(x))
  const canUpdateForeignSchema =
    connectedForeignTablesForNamespace.length > 0 && unconnectedTables.length > 0

  const { mutateAsync: deleteNamespace } = useIcebergNamespaceDeleteMutation()
  const { mutateAsync: dropForeignTable } = useFDWDropForeignTableMutation()
  const { mutateAsync: deleteNamespaceTable } = useIcebergNamespaceTableDeleteMutation()

  const missingTables = useMemo(() => {
    return (tablesData || []).filter(
      (t) => !tables.find((table) => (table.table as string).split('.')[1] === t)
    )
  }, [tablesData, tables])

  // Get all tables (connected + missing) for display
  const allTables = useMemo(() => {
    const connectedTableNames = tables.map((table) => (table.table as string).split('.')[1])
    const allTableNames = [...new Set([...connectedTableNames, ...missingTables])]

    return allTableNames.map((tableName) => ({
      id: tables.find((t) => t.table_name === tableName)?.id ?? 0,
      name: tableName,
    }))
  }, [tables, missingTables])

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
        </CardTitle>

        <div className="flex flex-row gap-x-6">
          <div className="flex items-center gap-x-2">
            {connectedForeignTablesForNamespace.length === 0 && (
              <InitializeForeignSchemaDialog namespace={namespace} />
            )}
            {canUpdateForeignSchema && (
              <UpdateForeignSchemaDialog namespace={namespace} tables={unconnectedTables} />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-7" icon={<MoreVerticalIcon />} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-fit min-w-[180px]">
                <DropdownMenuItem
                  className="flex items-center gap-x-2"
                  onClick={() => setShowConfirmDeleteNamespace(true)}
                >
                  <TrashIcon size={12} className="text-foreground-lighter" />
                  <p>Delete namespace</p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={allTables.length === 0 ? 'text-foreground-muted' : undefined}>
              <span className="pl-8">Table name</span>
            </TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {allTables.length === 0 ? (
            <TableRow className="[&>td]:hover:bg-inherit">
              <TableCell colSpan={2}>
                <p className="text-sm text-foreground">No tables yet</p>
                <p className="text-sm text-foreground-lighter">
                  Publish an analytics table from your Iceberg client
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
