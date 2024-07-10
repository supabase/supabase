import * as Tooltip from '@radix-ui/react-tooltip'
import Table from 'components/to-be-cleaned/Table'
import { Columns, Files } from 'lucide-react'
import Link from 'next/link'
import useEntityType from 'hooks/misc/useEntityType'
import useTableDefinition from 'hooks/misc/useTableDefinition'
import toast from 'react-hot-toast'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconCheck,
  IconCopy,
  IconEdit,
  IconEye,
  IconMoreVertical,
  IconTrash,
  IconX,
} from 'ui'
import { useRouter } from 'next/router'
import { useProjectContext } from '../../../layouts/ProjectLayout/ProjectContext'
import { useTableEditorStateSnapshot } from 'state/table-editor'

const TableListItem = (props: {
  table: any
  realtimePublication: any
  isLocked: any
  canUpdateTables: any
  onEditTable: any
  onDeleteTable: any
}) => {
  const { table, realtimePublication, isLocked, canUpdateTables, onEditTable, onDeleteTable } =
    props
  const router = useRouter()
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const { formattedDefinition } = useTableDefinition(useEntityType(table.id), project)
  const copyDefinition = async () => {
    try {
      await navigator.clipboard.writeText(formattedDefinition!)
      toast.success('Definition successfully copied to clipboard.')
    } catch (error: any) {
      toast.error('Failed to copy definition.')
    }
  }

  return (
    <Table.tr key={table.id}>
      <Table.td>
        {/* only show tooltips if required, to reduce noise */}
        {table.name.length > 20 ? (
          <Tooltip.Root delayDuration={0} disableHoverableContent={true}>
            <Tooltip.Trigger
              asChild
              className="max-w-[95%] overflow-hidden text-ellipsis whitespace-nowrap"
            >
              <p>{table.name}</p>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200',
                  ].join(' ')}
                >
                  <span className="text-xs text-foreground">{table.name}</span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ) : (
          <p>{table.name}</p>
        )}
      </Table.td>
      <Table.td className="hidden lg:table-cell ">
        {table.comment !== null ? (
          <span className="lg:max-w-48 truncate inline-block" title={table.comment}>
            {table.comment}
          </span>
        ) : (
          <p className="text-border-stronger">No description</p>
        )}
      </Table.td>
      <Table.td className="hidden text-right xl:table-cell">
        {(table.live_rows_estimate ?? table.live_row_count).toLocaleString()}
      </Table.td>
      <Table.td className="hidden text-right xl:table-cell">
        <code className="text-xs">{table.size}</code>
      </Table.td>
      <Table.td className="hidden xl:table-cell text-center">
        {(realtimePublication?.tables ?? []).find((table: any) => table.id === table.id) ? (
          <div className="flex justify-center">
            <IconCheck strokeWidth={2} className="text-brand" />
          </div>
        ) : (
          <div className="flex justify-center">
            <IconX strokeWidth={2} className="text-foreground-lighter" />
          </div>
        )}
      </Table.td>
      <Table.td>
        <div className="flex justify-end gap-2">
          <Button
            asChild
            type="default"
            iconRight={<Columns size={14} className="text-foreground-light" />}
            className="whitespace-nowrap hover:border-muted"
            style={{ paddingTop: 3, paddingBottom: 3 }}
          >
            <Link href={`/project/${project.ref}/database/tables/${table.id}`}>
              {table.columns?.length} columns
            </Link>
          </Button>

          {!isLocked && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" className="px-1">
                  <IconMoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-36">
                <DropdownMenuItem disabled={!canUpdateTables} onClick={() => onEditTable(table)}>
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger className="flex items-center space-x-2">
                      <IconEdit size="tiny" />
                      <p>Edit table</p>
                    </Tooltip.Trigger>
                    {!canUpdateTables && (
                      <Tooltip.Portal>
                        <Tooltip.Content side="bottom">
                          <Tooltip.Arrow className="radix-tooltip-arrow" />
                          <div
                            className={[
                              'rounded bg-alternative py-1 px-2 leading-none shadow',
                              'border border-background',
                            ].join(' ')}
                          >
                            <span className="text-xs text-foreground">
                              Additional permissions required to edit table
                            </span>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    )}
                  </Tooltip.Root>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="flex items-center space-x-2"
                  onClick={() => router.push(`/project/${project?.ref}/editor/${table.id}`)}
                >
                  <IconEye size="tiny" />
                  <p>View table</p>
                </DropdownMenuItem>
                <DropdownMenuItem
                  key="duplicate-table"
                  className="space-x-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    snap.onDuplicateTable()
                  }}
                >
                  <IconCopy size="tiny" />
                  <span>Duplicate Table</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  key="duplicate-table"
                  className="space-x-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyDefinition()
                  }}
                >
                  <Files size={12} />
                  <span>Copy definition</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canUpdateTables || isLocked}
                  onClick={() => onDeleteTable(table)}
                >
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger className="flex items-center space-x-2">
                      <IconTrash stroke="red" size="tiny" />
                      <p>Delete table</p>
                    </Tooltip.Trigger>
                    {!canUpdateTables && (
                      <Tooltip.Portal>
                        <Tooltip.Content side="bottom">
                          <Tooltip.Arrow className="radix-tooltip-arrow" />
                          <div
                            className={[
                              'rounded bg-alternative py-1 px-2 leading-none shadow',
                              'border border-background',
                            ].join(' ')}
                          >
                            <span className="text-xs text-foreground">
                              Additional permissions required to delete table
                            </span>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    )}
                  </Tooltip.Root>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Table.td>
    </Table.tr>
  )
}

export default TableListItem
