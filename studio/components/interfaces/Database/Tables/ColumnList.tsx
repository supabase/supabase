import * as Tooltip from '@radix-ui/react-tooltip'
import type { PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Button, IconChevronLeft, IconEdit3, IconPlus, IconSearch, IconTrash, Input } from 'ui'

import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import Table from 'components/to-be-cleaned/Table'
import { useCheckPermissions, useStore } from 'hooks'

interface ColumnListProps {
  selectedTable: PostgresTable
  onSelectBack: () => void
  onAddColumn: () => void
  onEditColumn: (column: any) => void
  onDeleteColumn: (column: any) => void
}

const ColumnList = ({
  selectedTable,
  onSelectBack = noop,
  onAddColumn = noop,
  onEditColumn = noop,
  onDeleteColumn = noop,
}: ColumnListProps) => {
  const { meta } = useStore()
  const [filterString, setFilterString] = useState<string>('')
  const columns =
    (filterString.length === 0
      ? selectedTable.columns
      : selectedTable.columns?.filter((column: any) => column.name.includes(filterString))) ?? []

  const isLocked = meta.excludedSchemas.includes(selectedTable.schema ?? '')
  const canUpdateColumns = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'columns')

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <Button
                type="outline"
                className="mr-4"
                onClick={() => onSelectBack()}
                icon={<IconChevronLeft size="small" />}
                style={{ padding: '5px' }}
              />
              <code>{selectedTable.name}</code>
            </div>
            <div>
              <Input
                size="small"
                placeholder="Filter columns"
                value={filterString}
                onChange={(e: any) => setFilterString(e.target.value)}
                icon={<IconSearch size="tiny" />}
              />
            </div>
          </div>
          {!isLocked && (
            <div>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Button
                    disabled={!canUpdateColumns}
                    icon={<IconPlus />}
                    onClick={() => onAddColumn()}
                  >
                    New column
                  </Button>
                </Tooltip.Trigger>
                {!canUpdateColumns && (
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                          'border border-scale-200',
                        ].join(' ')}
                      >
                        <span className="text-xs text-scale-1200">
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
      </div>
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
                    <p className="text-scale-800">No description</p>
                  )}
                </Table.td>
                <Table.td>
                  <code className="text-xs">{x.data_type}</code>
                </Table.td>
                <Table.td className="font-mono text-xs">
                  <code className="text-xs">{x.format}</code>
                </Table.td>
                <Table.td className="px-4 py-3 pr-2">
                  <div className="flex justify-end gap-2">
                    <Tooltip.Root delayDuration={0}>
                      <Tooltip.Trigger>
                        <Button
                          onClick={() => onEditColumn(x)}
                          icon={<IconEdit3 />}
                          style={{ padding: 5 }}
                          type="text"
                          disabled={!canUpdateColumns || isLocked}
                        />
                      </Tooltip.Trigger>
                      {!canUpdateColumns && (
                        <Tooltip.Portal>
                          <Tooltip.Content side="bottom">
                            <Tooltip.Arrow className="radix-tooltip-arrow" />
                            <div
                              className={[
                                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                'border border-scale-200',
                              ].join(' ')}
                            >
                              <span className="text-xs text-scale-1200">
                                You need additional permissions to edit columns
                              </span>
                            </div>
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      )}
                    </Tooltip.Root>

                    <Tooltip.Root delayDuration={0}>
                      <Tooltip.Trigger>
                        <Button
                          onClick={() => onDeleteColumn(x)}
                          icon={<IconTrash />}
                          style={{ padding: 5 }}
                          type="text"
                          disabled={!canUpdateColumns || isLocked}
                        />
                      </Tooltip.Trigger>
                      {!canUpdateColumns && (
                        <Tooltip.Portal>
                          <Tooltip.Content side="bottom">
                            <Tooltip.Arrow className="radix-tooltip-arrow" />
                            <div
                              className={[
                                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                'border border-scale-200',
                              ].join(' ')}
                            >
                              <span className="text-xs text-scale-1200">
                                You need additional permissions to delete columns
                              </span>
                            </div>
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      )}
                    </Tooltip.Root>
                  </div>
                </Table.td>
              </Table.tr>
            ))}
          />
        </div>
      )}
    </>
  )
}

export default observer(ColumnList)
