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
  <div className="flex justify-between items-center">
    <div className="flex items-center">
      <div>{leftComponents}</div>
      <div>
        <Input
          size="tiny"
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
  onAddColumn: () => void
  onEditColumn: (column: any) => void
  onSelectBack: () => void
  onColumnDeleted: () => void
}> = ({
  selectedTable,
  onAddColumn = () => {},
  onEditColumn = () => {},
  onSelectBack = () => {},
  onColumnDeleted = () => {},
}) => {
  const { ui, meta } = useStore()
  const [filterString, setFilterString] = useState<string>('')
  const columns =
    filterString.length === 0
      ? selectedTable.columns
      : selectedTable.columns.filter((column: any) => column.name.includes(filterString))

  async function onDeleteColumn(column: any) {
    confirmAlert({
      title: 'Confirm to delete',
      message: `Are you sure you want to delete the "${column.name}" column? This action cannot be undone.`,
      onAsyncConfirm: async () => {
        try {
          const response: any = await meta.columns.del(column.id)
          if (response.error) {
            throw response.error
          } else {
            onColumnDeleted()
            ui.setNotification({
              category: 'success',
              message: `Successfully removed ${column.name}.`,
            })
          }
        } catch (error: any) {
          ui.setNotification({
            category: 'error',
            message: `Failed to delete ${column.name}: ${error.message}`,
          })
        }
      },
    })
  }

  return (
    <>
      <div className="mb-4">
        <Header
          filterPlaceholder="Filter columns"
          filterString={filterString}
          setFilterString={setFilterString}
          leftComponents={
            <Button
              type="outline"
              className="mr-4"
              onClick={() => onSelectBack()}
              icon={<IconChevronLeft size="small" />}
              style={{ padding: '5px' }}
            />
          }
          rightComponents={
            <Button icon={<IconPlus />} onClick={() => onAddColumn()}>
              New
            </Button>
          }
        />
      </div>
      <div className="">
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
              <Table.td className="">
                <Typography.Text>{x.name}</Typography.Text>
              </Table.td>
              <Table.td className="">
                <Typography.Text>{x.comment}</Typography.Text>
              </Table.td>
              <Table.td className="">
                <Typography.Text small code>
                  {x.data_type}
                </Typography.Text>
              </Table.td>
              <Table.td className="text-xs font-mono">
                <Typography.Text small code>
                  {x.format}
                </Typography.Text>
              </Table.td>
              <Table.td className="px-4 py-3 pr-2">
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => onDeleteColumn(x)}
                    icon={<IconTrash />}
                    style={{ padding: 5 }}
                    type="outline"
                    // tooltip={{
                    //   title: 'Delete column',
                    //   position: 'top-left',
                    // }}
                  />
                  <Button
                    onClick={() => onEditColumn(x)}
                    icon={<IconEdit3 />}
                    style={{ padding: 5 }}
                    type="outline"
                    // tooltip={{
                    //   title: 'Edit Details',
                    //   position: 'top-left',
                    // }}
                  />
                </div>
              </Table.td>
            </Table.tr>
          ))}
        />
      </div>
    </>
  )
}

export default observer(ColumnList)
