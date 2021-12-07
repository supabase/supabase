import { FC, ReactNode, useState } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Button,
  IconPlus,
  Input,
  IconSearch,
  IconTrash,
  IconEdit3,
  IconColumns,
  Typography,
} from '@supabase/ui'

import { useStore } from 'hooks'
import Table from 'components/to-be-cleaned/Table'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

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

const TableList: FC<{
  onAddTable: () => void
  onEditTable: (table: any) => void
  onOpenTable: (table: any) => void
}> = observer(({ onAddTable = () => {}, onEditTable = () => {}, onOpenTable = () => {} }) => {
  const { ui, meta } = useStore()
  const [filterString, setFilterString] = useState<string>('')
  const tables =
    filterString.length === 0
      ? meta.tables.list((table: any) => table.schema === 'public')
      : meta.tables.list(
          (table: any) => table.schema === 'public' && table.name.includes(filterString)
        )

  async function onDelete(table: any) {
    confirmAlert({
      title: 'Confirm to delete',
      message: `Are you sure you want to delete "${table.name}" table? This action cannot be undone.`,
      onAsyncConfirm: async () => {
        try {
          const response: any = await meta.tables.del(table.id)
          if (response.error) {
            throw response.error
          } else {
            ui.setNotification({
              category: 'success',
              message: `Successfully removed ${table.name}.`,
            })
          }
        } catch (error: any) {
          ui.setNotification({
            category: 'error',
            message: `Failed to delete ${table.name}: ${error.message}`,
          })
        }
      },
    })
  }

  return (
    <>
      <div>
        {/* @ts-ignore */}
        <Header
          filterString={filterString}
          setFilterString={setFilterString}
          rightComponents={
            <Button icon={<IconPlus />} onClick={() => onAddTable()}>
              New
            </Button>
          }
        />
      </div>
      <div className="w-full my-4">
        <Table
          head={[
            <Table.th key="name">Name</Table.th>,
            <Table.th key="schema">Schema</Table.th>,
            <Table.th key="description" className="hidden lg:table-cell">
              Description
            </Table.th>,
            <Table.th key="rows" className="hidden xl:table-cell">
              Rows (Estimated)
            </Table.th>,
            <Table.th key="size" className="hidden xl:table-cell">
              Size (Estimated)
            </Table.th>,
            <Table.th key="buttons"></Table.th>,
          ]}
          body={tables.map((x: any, i: any) => (
            <Table.tr key={x.id}>
              <Table.td>
                <Typography.Text>{x.name}</Typography.Text>
              </Table.td>
              <Table.td>
                <Typography.Text>{x.schema}</Typography.Text>
              </Table.td>
              <Table.td className=" truncate max-w-sm hidden lg:table-cell">
                <Typography.Text>{x.comment}</Typography.Text>
              </Table.td>
              <Table.td className=" hidden xl:table-cell">
                <Typography.Text small code>
                  {x.live_rows_estimate ?? x.live_row_count}
                </Typography.Text>
              </Table.td>
              <Table.td className=" hidden xl:table-cell">
                <Typography.Text small code>
                  {x.size}
                </Typography.Text>
              </Table.td>
              <Table.td>
                <div className="flex gap-2 justify-end">
                  <Button
                    iconRight={<IconColumns />}
                    type="default"
                    className="hover:border-gray-500 whitespace-nowrap"
                    style={{ paddingTop: 3, paddingBottom: 3 }}
                    onClick={() => {
                      onOpenTable(x)
                    }}
                  >
                    {x.columns.length} columns
                  </Button>
                  <Button
                    onClick={() => onEditTable(x)}
                    icon={<IconEdit3 />}
                    style={{ padding: 5 }}
                    type="text"
                    // tooltip={{
                    //   title: 'Edit Details',
                    //   position: 'top-left',
                    // }}
                  />
                  <Button
                    onClick={() => onDelete(x)}
                    icon={<IconTrash />}
                    style={{ padding: 5 }}
                    type="text"
                    // tooltip={{
                    //   title: 'Delete table',
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
})

export default TableList
