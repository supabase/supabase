import { PostgresColumn } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { noop } from 'lodash'
import { Check, Edit, MoreVertical, Plus, Search, Trash, X } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ProtectedSchemaWarning } from '../ProtectedSchemaWarning'

interface ColumnListProps {
  onAddColumn: () => void
  onEditColumn: (column: PostgresColumn) => void
  onDeleteColumn: (column: PostgresColumn) => void
}

export const ColumnList = ({
  onAddColumn = noop,
  onEditColumn = noop,
  onDeleteColumn = noop,
}: ColumnListProps) => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined

  const { data: project } = useSelectedProjectQuery()
  const {
    data: selectedTable,
    error,
    isError,
    isPending: isLoading,
    isSuccess,
  } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  const [filterString, setFilterString] = useState<string>('')
  const isTableEntity = isTableLike(selectedTable)

  const columns =
    (filterString.length === 0
      ? (selectedTable?.columns ?? [])
      : selectedTable?.columns?.filter((column) =>
          column.name.toLowerCase().includes(filterString.toLowerCase())
        )) ?? []

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedTable?.schema ?? '' })
  const { can: canUpdateColumns } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'columns'
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:w-52">
          <Input
            size="tiny"
            placeholder="Filter columns"
            value={filterString}
            onChange={(e) => setFilterString(e.target.value)}
            icon={<Search />}
          />
        </div>
        {!isSchemaLocked && isTableEntity && (
          <ButtonTooltip
            icon={<Plus />}
            disabled={!canUpdateColumns}
            onClick={() => onAddColumn()}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateColumns
                  ? 'You need additional permissions to create columns'
                  : undefined,
              },
            }}
          >
            New column
          </ButtonTooltip>
        )}
      </div>

      {isSchemaLocked && (
        <ProtectedSchemaWarning schema={selectedTable?.schema ?? ''} entity="columns" />
      )}

      <Card>
        {isLoading ? (
          <div className="p-4">
            <GenericSkeletonLoader />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={columns.length === 0 ? 'text-foreground-muted' : undefined}>
                  Name
                </TableHead>
                <TableHead className={columns.length === 0 ? 'text-foreground-muted' : undefined}>
                  Data Type
                </TableHead>
                <TableHead className={columns.length === 0 ? 'text-foreground-muted' : undefined}>
                  Format
                </TableHead>
                <TableHead
                  className={
                    columns.length === 0 ? 'text-right text-foreground-muted' : 'text-right'
                  }
                >
                  Nullable
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError && (
                <TableRow className="[&>td]:hover:bg-inherit">
                  <TableCell colSpan={5}>
                    <AlertError
                      error={error}
                      subject={`Failed to retrieve columns for table "${selectedTable?.schema}.${selectedTable?.name}"`}
                    />
                  </TableCell>
                </TableRow>
              )}

              {isSuccess && columns.length === 0 && filterString.length > 0 && (
                <TableRow className="[&>td]:hover:bg-inherit">
                  <TableCell colSpan={5}>
                    <NoSearchResults
                      withinTableCell
                      searchString={filterString}
                      onResetFilter={() => setFilterString('')}
                    />
                  </TableCell>
                </TableRow>
              )}

              {isSuccess && columns.length === 0 && filterString.length === 0 && (
                <TableRow className="[&>td]:hover:bg-inherit">
                  <TableCell colSpan={5}>
                    <p className="text-sm text-foreground">No columns created yet</p>
                    <p className="text-sm text-foreground-light">
                      There are no columns in "{selectedTable?.schema}.{selectedTable?.name}"
                    </p>
                  </TableCell>
                </TableRow>
              )}

              {isSuccess &&
                columns.length > 0 &&
                columns.map((column) => (
                  <TableRow key={column.name}>
                    <TableCell>
                      <div className="flex min-w-0 flex-col">
                        <p>{column.name}</p>
                        {column.comment !== null ? (
                          <span
                            className="max-w-md truncate text-foreground-lighter"
                            title={column.comment}
                          >
                            {column.comment}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-code-inline">{column.data_type}</code>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <code className="text-code-inline">{column.format}</code>
                    </TableCell>
                    <TableCell className="text-right">
                      {column.is_nullable ? (
                        <div className="flex justify-end">
                          <Check size={16} strokeWidth={2} className="text-brand" />
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <X size={16} strokeWidth={2} className="text-foreground-lighter" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isSchemaLocked && isTableEntity && (
                        <div className="flex justify-end gap-2">
                          <ButtonTooltip
                            type="default"
                            disabled={!canUpdateColumns}
                            onClick={() => onEditColumn(column)}
                            tooltip={{
                              content: {
                                side: 'bottom',
                                text: !canUpdateColumns
                                  ? 'Additional permissions required to edit column'
                                  : undefined,
                              },
                            }}
                          >
                            Edit
                          </ButtonTooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="default" className="px-1" icon={<MoreVertical />} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="end" className="w-32">
                              <Tooltip>
                                <TooltipTrigger>
                                  <DropdownMenuItem
                                    disabled={!canUpdateColumns || isSchemaLocked}
                                    onClick={() => onDeleteColumn(column)}
                                    className="space-x-2"
                                  >
                                    <Trash size={12} />
                                    <p>Delete column</p>
                                  </DropdownMenuItem>
                                </TooltipTrigger>
                                {!canUpdateColumns && (
                                  <TooltipContent side="bottom">
                                    Additional permissions required to delete column
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
            {isSuccess && (
              <TableFooter className="font-normal">
                <TableRow className="border-b-0 [&>td]:hover:bg-inherit">
                  <TableCell colSpan={5} className="text-foreground-muted">
                    {columns.length} {columns.length === 1 ? 'column' : 'columns'}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
      </Card>
    </div>
  )
}
