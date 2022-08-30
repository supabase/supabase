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
} from '@supabase/ui'

import { useStore } from 'hooks'
import Table from 'components/to-be-cleaned/Table'
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

const TableList: FC<{
  onAddTable: () => void
  onEditTable: (table: any) => void
  onDeleteTable: (table: any) => void
  onOpenTable: (table: any) => void
}> = observer(
  ({
    onAddTable = () => {},
    onEditTable = () => {},
    onDeleteTable = () => {},
    onOpenTable = () => {},
  }) => {
    const { meta } = useStore()
    const [filterString, setFilterString] = useState<string>('')
    const tables =
      filterString.length === 0
        ? meta.tables.list((table: any) => table.schema === 'public')
        : meta.tables.list(
            (table: any) => table.schema === 'public' && table.name.includes(filterString)
          )

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
        {tables.length === 0 ? (
          <NoSearchResults />
        ) : (
          <div className="my-4 w-full">
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
                <Table.tr key={x.id} hoverable>
                  <Table.td>
                    <p>{x.name}</p>
                  </Table.td>
                  <Table.td>
                    <p>{x.schema}</p>
                  </Table.td>
                  <Table.td className=" hidden max-w-sm truncate lg:table-cell">
                    <p>{x.comment}</p>
                  </Table.td>
                  <Table.td className=" hidden xl:table-cell">
                    <code className="text-sm">{x.live_rows_estimate ?? x.live_row_count}</code>
                  </Table.td>
                  <Table.td className=" hidden xl:table-cell">
                    <code className="text-sm">{x.size}</code>
                  </Table.td>
                  <Table.td>
                    <div className="flex justify-end gap-2">
                      <Button
                        iconRight={<IconColumns />}
                        type="default"
                        className="whitespace-nowrap hover:border-gray-500"
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
                      />
                      <Button
                        onClick={() => onDeleteTable(x)}
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
)

export default TableList
