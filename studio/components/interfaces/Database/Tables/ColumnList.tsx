import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Input, Button, IconSearch, IconPlus, IconChevronLeft, IconEdit3, IconTrash } from 'ui'

import { useStore } from 'hooks'
import Table from 'components/to-be-cleaned/Table'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import type { PostgresTable } from '@supabase/postgres-meta'

interface Props {
  selectedTable: PostgresTable
  onSelectBack: () => void
  onAddColumn: () => void
  onEditColumn: (column: any) => void
  onDeleteColumn: (column: any) => void
}

const ColumnList: FC<Props> = ({
  selectedTable,
  onSelectBack = () => {},
  onAddColumn = () => {},
  onEditColumn = () => {},
  onDeleteColumn = () => {},
}) => {
  const { meta } = useStore()
  const [filterString, setFilterString] = useState<string>('')
  const columns =
    (filterString.length === 0
      ? selectedTable.columns
      : selectedTable.columns?.filter((column: any) => column.name.includes(filterString))) ?? []

  const isLocked = meta.excludedSchemas.includes(selectedTable.schema ?? '')

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
              <Button icon={<IconPlus />} onClick={() => onAddColumn()}>
                New column
              </Button>
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
                    <Button
                      onClick={() => onEditColumn(x)}
                      icon={<IconEdit3 />}
                      style={{ padding: 5 }}
                      type="text"
                      disabled={isLocked}
                    />
                    <Button
                      onClick={() => onDeleteColumn(x)}
                      icon={<IconTrash />}
                      style={{ padding: 5 }}
                      type="text"
                      disabled={isLocked}
                    />
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
