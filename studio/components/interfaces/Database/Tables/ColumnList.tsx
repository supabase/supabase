import { FC, ReactNode, useState } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Input,
  Button,
  Typography,
  IconSearch,
  IconPlus,
  IconChevronLeft,
  IconEdit3,
  IconTrash,
} from '@supabase/ui'

import { useStore } from 'hooks'
import { confirmAlert } from '../../../to-be-cleaned/ModalsDeprecated/ConfirmModal'
import Table from '../../../to-be-cleaned/Table'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'

const Header: FC<{
  filterString: string
  filterPlaceholder: string
  leftComponents: ReactNode
  rightComponents: ReactNode
  setFilterString: (value: string) => void
}> = ({
  filterString,
  setFilterString,
  filterPlaceholder = 'Filter',
  leftComponents,
  rightComponents,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center">
      <div>{leftComponents}</div>
      <div>
        <Input
          size="small"
          placeholder={filterPlaceholder}
          value={filterString}
          onChange={(e: any) => setFilterString(e.target.value)}
          icon={<IconSearch size="tiny" />}
        />
      </div>
    </div>
    <div className="">{rightComponents}</div>
  </div>
)

const ColumnList: FC<{
  selectedTable: any
  onSelectBack: () => void
  onAddColumn: () => void
  onEditColumn: (column: any) => void
  onDeleteColumn: (column: any) => void
}> = ({
  selectedTable,
  onSelectBack = () => {},
  onAddColumn = () => {},
  onEditColumn = () => {},
  onDeleteColumn = () => {},
}) => {
  const [filterString, setFilterString] = useState<string>('')
  const columns =
    filterString.length === 0
      ? selectedTable.columns
      : selectedTable.columns.filter((column: any) => column.name.includes(filterString))

  return (
    <>
      <div className="mb-4">
        <Header
          filterPlaceholder="Filter columns"
          filterString={filterString}
          setFilterString={setFilterString}
          leftComponents={
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
          }
          rightComponents={
            <Button icon={<IconPlus />} onClick={() => onAddColumn()}>
              New
            </Button>
          }
        />
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
                  <Typography.Text>{x.name}</Typography.Text>
                </Table.td>
                <Table.td>
                  <Typography.Text>{x.comment}</Typography.Text>
                </Table.td>
                <Table.td>
                  <Typography.Text small code>
                    {x.data_type}
                  </Typography.Text>
                </Table.td>
                <Table.td className="font-mono text-xs">
                  <Typography.Text small code>
                    {x.format}
                  </Typography.Text>
                </Table.td>
                <Table.td className="px-4 py-3 pr-2">
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => onEditColumn(x)}
                      icon={<IconEdit3 />}
                      style={{ padding: 5 }}
                      type="text"
                    />
                    <Button
                      onClick={() => onDeleteColumn(x)}
                      icon={<IconTrash />}
                      style={{ padding: 5 }}
                      type="text"
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
