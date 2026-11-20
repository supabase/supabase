import { useParams } from 'common'
import { SqlEditor, TableEditor } from 'icons'
import { MoreVerticalIcon, Table2Icon, TrashIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { useAnalyticsBucketWrapperInstance } from '../useAnalyticsBucketWrapperInstance'
import { InsertDataDialog } from './InsertDataDialog'
import { convertKVStringArrayToJson } from '@/components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { useFDWDropForeignTableMutation } from '@/data/fdw/fdw-drop-foreign-table-mutation'
import { useIcebergNamespaceTableDeleteMutation } from '@/data/storage/iceberg-namespace-table-delete-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface TableRowComponentProps {
  table: { id: number; name: string }
  schema: string
  namespace: string
}

export const TableRowComponent = ({ table, schema, namespace }: TableRowComponentProps) => {
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [showRemoveTableModal, setShowRemoveTableModal] = useState(false)
  const [isRemovingTable, setIsRemovingTable] = useState(false)

  const { data: wrapperInstance } = useAnalyticsBucketWrapperInstance({
    bucketId: bucketId,
  })

  const { mutateAsync: dropForeignTable } = useFDWDropForeignTableMutation()
  const { mutateAsync: deleteNamespaceTable, isPending: isDeletingNamespaceTable } =
    useIcebergNamespaceTableDeleteMutation({ onError: () => {} })
  const connectedForeignTablesInNamespace = (wrapperInstance?.tables ?? []).filter((x) =>
    x.options[0].includes(`table=${namespace}.`)
  )

  const connectedForeignTables = (wrapperInstance?.tables ?? []).filter(
    (x) => x.options[0] === `table=${namespace}.${table.name}`
  )

  const onConfirmRemoveNamespaceTable = async () => {
    try {
      setIsRemovingTable(true)
      const wrapperValues = convertKVStringArrayToJson(wrapperInstance?.server_options ?? [])
      await deleteNamespaceTable({
        projectRef,
        warehouse: wrapperValues.warehouse,
        namespace: namespace,
        table: table.name,
      })

      await Promise.all(
        connectedForeignTables.map((x) =>
          dropForeignTable({
            projectRef,
            connectionString: project?.connectionString,
            schemaName: x.schema,
            tableName: x.name,
          })
        )
      )

      toast.success(`Successfully removed table "${table.name}"!`)
    } catch (error: any) {
      toast.error(`Failed to remove table: ${error.message}`)
    } finally {
      setIsRemovingTable(false)
    }
  }

  return (
    <>
      <TableRow>
        <TableCell className="min-w-[120px]">
          <div className="flex items-center gap-x-3">
            <div className="w-5 flex justify-center items-center">
              <Table2Icon size={16} />
            </div>
            <p>{table.name}</p>
          </div>
        </TableCell>
        <TableCell className="text-right flex flex-row items-center gap-x-2 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                loading={isDeletingNamespaceTable}
                className="w-7"
                icon={<MoreVerticalIcon />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-fit min-w-[180px]">
              <DropdownMenuItem
                className="flex items-center gap-x-2"
                onClick={() => setShowRemoveTableModal(true)}
              >
                <TrashIcon size={12} className="text-foreground-lighter" />
                <p>Delete table</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* [Joshen] Render each foreign table associated to the namespace table as its own row */}
      {connectedForeignTables?.map((x) => (
        <TableRow key={x.id}>
          <TableCell className="pl-6">
            <div className="flex items-center gap-x-2 rounded-sm">
              <div className="w-4 h-5 rounded-bl-lg border-l-2 border-b-2 border-control -translate-y-2" />
              <div
                className={cn(
                  'flex items-center justify-center text-xs h-4 w-4 rounded-[2px] font-bold',
                  'text-warning-600/80 dark:text-yellow-900 bg-yellow-500'
                )}
              >
                F
              </div>
              <p>
                {x.schema}.{x.name}
              </p>
            </div>
          </TableCell>
          <TableCell className="flex flex-row justify-end gap-x-2">
            <InsertDataDialog table={table.name} fdwTable={x} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-7" icon={<MoreVerticalIcon />} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-fit min-w-[180px]" align="end">
                <DropdownMenuItem asChild className="flex items-center gap-x-2">
                  <Link
                    href={`/project/${projectRef}/sql/new?content=${encodeURIComponent(`select * from ${schema}.${table.name};`)}`}
                  >
                    <SqlEditor size={12} className="text-foreground-lighter" />
                    <p>Query in SQL Editor</p>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-x-2">
                  <Link href={`/project/${projectRef}/editor/${x.id}?schema=${x.schema}`}>
                    <TableEditor size={12} className="text-foreground-lighter" />
                    <p>View in Table Editor</p>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}

      {/* [Joshen] If the iceberg table doesn't have a corresponding namespace table, but the namespace itself already has some tables connected */}
      {connectedForeignTablesInNamespace.length > 0 && connectedForeignTables.length === 0 && (
        <TableRow>
          <TableCell className="pl-6">
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-x-2 rounded-sm">
                  <div className="w-4 h-4 rounded-bl-lg border-l-2 border-b-2 border-control -translate-y-1.5" />
                  <div
                    className={cn(
                      'flex items-center justify-center text-xs h-4 w-4 rounded-[2px]',
                      'font-bold border border-dashed border-control text-foreground-lighter'
                    )}
                  >
                    ?
                  </div>
                  <p className="text-foreground-lighter">No matching foreign table in schema</p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                Update the schema tables if you'd like to query this table from Postgres
              </TooltipContent>
            </Tooltip>
          </TableCell>
          <TableCell className="flex flex-row justify-end"></TableCell>
        </TableRow>
      )}

      <ConfirmationModal
        size="medium"
        variant="warning"
        visible={showRemoveTableModal}
        loading={isRemovingTable}
        title={`Confirm to delete table "${table.name}"`}
        description="This action cannot be undone."
        confirmLabel="Delete table"
        onCancel={() => setShowRemoveTableModal(false)}
        onConfirm={onConfirmRemoveNamespaceTable}
      >
        <p className="text-sm text-foreground-light">
          Data from this Iceberg table will be permanently lost. Are you sure?
        </p>
      </ConfirmationModal>
    </>
  )
}
