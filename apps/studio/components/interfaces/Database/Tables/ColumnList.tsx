import * as Tooltip from '@radix-ui/react-tooltip'
import { PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { ChevronLeft, Edit, MoreVertical, Plus, Search, Trash } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import useTable from 'hooks/misc/useTable'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from 'ui'
import ProtectedSchemaWarning from '../ProtectedSchemaWarning'

interface ColumnListProps {
  onAddColumn: () => void
  onEditColumn: (column: any) => void
  onDeleteColumn: (column: any) => void
}

const ColumnList = ({
  onAddColumn = noop,
  onEditColumn = noop,
  onDeleteColumn = noop,
}: ColumnListProps) => {
  const { id, ref } = useParams()
  const [filterString, setFilterString] = useState<string>('')
  const { data: selectedTable, error, isError, isLoading, isSuccess } = useTable(Number(id))
  const isTableEntity = 'live_rows_estimate' in ((selectedTable as PostgresTable) || {})

  const columns =
    (filterString.length === 0
      ? selectedTable?.columns ?? []
      : selectedTable?.columns?.filter((column: any) => column.name.includes(filterString))) ?? []

  const isLocked = EXCLUDED_SCHEMAS.includes(selectedTable?.schema ?? '')
  const canUpdateColumns = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'columns')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            asChild
            type="outline"
            icon={<ChevronLeft size={14} />}
            style={{ padding: '5px' }}
          >
            <Link href={`/project/${ref}/database/tables`} />
          </Button>
          <Input
            size="small"
            placeholder="Filter columns"
            value={filterString}
            onChange={(e: any) => setFilterString(e.target.value)}
            icon={<Search size={12} />}
          />
        </div>
        {!isLocked && isTableEntity && (
          <div>
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <Button disabled={!canUpdateColumns} icon={<Plus />} onClick={() => onAddColumn()}>
                  New column
                </Button>
              </Tooltip.Trigger>
              {!canUpdateColumns && (
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
                        You need additional permissions to create columns
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        )}
      </div>

      {isLocked && <ProtectedSchemaWarning schema={selectedTable?.schema ?? ''} entity="columns" />}

      {isLoading && <GenericSkeletonLoader />}

      {isError && (
        <AlertError
          error={error as any}
          subject={`Failed to retrieve columns for table "${selectedTable?.schema}.${selectedTable?.name}"`}
        />
      )}

      {isSuccess && (
        <>
          {columns.length === 0 ? (
            <NoSearchResults />
          ) : (
            <div>
              <Table
                head={[
                  <Table.th key="name">Name</Table.th>,
                  <Table.th key="description" className="hidden lg:table-cell">
                    Description
                  </Table.th>,
                  <Table.th key="type" className="hidden xl:table-cell">
                    Data Type
                  </Table.th>,
                  <Table.th key="format" className="hidden xl:table-cell">
                    Format
                  </Table.th>,
                  <Table.th key="buttons"></Table.th>,
                ]}
                body={columns.map((x: any, i: number) => (
                  <Table.tr className="border-t" key={x.name}>
                    <Table.td>
                      <p>{x.name}</p>
                    </Table.td>
                    <Table.td className="break-all whitespace-normal">
                      {x.comment !== null ? (
                        <p title={x.comment}>{x.comment}</p>
                      ) : (
                        <p className="text-border-stronger">No description</p>
                      )}
                    </Table.td>
                    <Table.td>
                      <code className="text-xs">{x.data_type}</code>
                    </Table.td>
                    <Table.td className="font-mono text-xs">
                      <code className="text-xs">{x.format}</code>
                    </Table.td>
                    <Table.td className="text-right">
                      {!isLocked && isTableEntity && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="default" className="px-1" icon={<MoreVertical />} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="bottom" align="end" className="w-32">
                            <DropdownMenuItem
                              disabled={!canUpdateColumns}
                              onClick={() => onEditColumn(x)}
                            >
                              <Tooltip.Root delayDuration={0}>
                                <Tooltip.Trigger className="flex items-center space-x-2">
                                  <Edit size={12} />
                                  <p>Edit column</p>
                                </Tooltip.Trigger>
                                {!canUpdateColumns && (
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
                                          Additional permissions required to edit column
                                        </span>
                                      </div>
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                )}
                              </Tooltip.Root>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              disabled={!canUpdateColumns || isLocked}
                              onClick={() => onDeleteColumn(x)}
                            >
                              <Tooltip.Root delayDuration={0}>
                                <Tooltip.Trigger className="flex items-center space-x-2">
                                  <Trash stroke="red" size={12} />
                                  <p>Delete column</p>
                                </Tooltip.Trigger>
                                {!canUpdateColumns && (
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
                                          Additional permissions required to edit column
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
                    </Table.td>
                  </Table.tr>
                ))}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ColumnList
