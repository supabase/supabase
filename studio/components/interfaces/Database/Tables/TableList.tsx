import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Button,
  IconPlus,
  Input,
  IconSearch,
  IconTrash,
  IconEdit3,
  IconColumns,
  Listbox,
  IconLock,
  IconCheck,
} from 'ui'

import { partition } from 'lodash'

import { useStore } from 'hooks'
import Table from 'components/to-be-cleaned/Table'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import type { PostgresTable, PostgresSchema } from '@supabase/postgres-meta'

interface Props {
  selectedSchema: string
  onSelectSchema: (schema: string) => void
  onAddTable: () => void
  onEditTable: (table: any) => void
  onDeleteTable: (table: any) => void
  onOpenTable: (table: any) => void
}

const TableList: FC<Props> = ({
  selectedSchema,
  onSelectSchema = () => {},
  onAddTable = () => {},
  onEditTable = () => {},
  onDeleteTable = () => {},
  onOpenTable = () => {},
}) => {
  const { meta } = useStore()

  const [filterString, setFilterString] = useState<string>('')

  const schemas: PostgresSchema[] = meta.schemas.list()
  const [protectedSchemas, openSchemas] = partition(schemas, (schema) =>
    meta.excludedSchemas.includes(schema?.name ?? '')
  )

  const allTables: PostgresTable[] = meta.tables.list(
    (table: PostgresTable) => table.schema === selectedSchema
  )
  const tables =
    filterString.length === 0
      ? allTables
      : // @ts-ignore
        allTables.filter((table: PostgresTable) => table.name.includes(filterString))

  const publications = meta.publications.list()
  const realtimePublication = publications.find(
    (publication) => publication.name === 'supabase_realtime'
  )
  // @ts-ignore
  const schema = schemas.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-[230px]">
            <Listbox
              size="small"
              value={selectedSchema}
              onChange={onSelectSchema}
              icon={isLocked && <IconLock size={14} strokeWidth={2} />}
            >
              <Listbox.Option disabled key="normal-schemas" value="normal-schemas" label="Schemas">
                <p className="text-sm">Schemas</p>
              </Listbox.Option>
              {/* @ts-ignore */}
              {openSchemas.map((schema) => (
                <Listbox.Option
                  key={schema.id}
                  value={schema.name}
                  label={schema.name}
                  addOnBefore={() => <span className="text-scale-900">schema</span>}
                >
                  <span className="text-scale-1200 text-sm">{schema.name}</span>
                </Listbox.Option>
              ))}
              <Listbox.Option
                disabled
                key="protected-schemas"
                value="protected-schemas"
                label="Protected schemas"
              >
                <p className="text-sm">Protected schemas</p>
              </Listbox.Option>
              {protectedSchemas.map((schema) => (
                <Listbox.Option
                  key={schema.id}
                  value={schema.name}
                  label={schema.name}
                  addOnBefore={() => <span className="text-scale-900">schema</span>}
                >
                  <span className="text-scale-1200 text-sm">{schema.name}</span>
                </Listbox.Option>
              ))}
            </Listbox>
          </div>
          <div>
            <Input
              size="small"
              placeholder="Filter tables"
              value={filterString}
              onChange={(e: any) => setFilterString(e.target.value)}
              icon={<IconSearch size="tiny" />}
            />
          </div>
        </div>
        {!isLocked && (
          <div>
            <Button icon={<IconPlus />} onClick={() => onAddTable()}>
              New table
            </Button>
          </div>
        )}
      </div>
      {tables.length === 0 ? (
        <NoSearchResults />
      ) : (
        <div className="my-4 w-full">
          <Table
            head={[
              <Table.th key="name">Name</Table.th>,
              <Table.th key="description" className="hidden lg:table-cell">
                Description
              </Table.th>,
              <Table.th key="rows" className="hidden xl:table-cell">
                Rows (Estimated)
              </Table.th>,
              <Table.th key="size" className="hidden xl:table-cell">
                Size (Estimated)
              </Table.th>,
              <Table.th key="realtime" className="hidden xl:table-cell text-center">
                Realtime Enabled
              </Table.th>,
              <Table.th key="buttons"></Table.th>,
            ]}
            body={tables.map((x: any, i: any) => (
              <Table.tr key={x.id}>
                <Table.td>
                  <p title={x.name}>{x.name}</p>
                </Table.td>
                <Table.td className="hidden max-w-sm truncate lg:table-cell break-all whitespace-normal">
                  {x.comment !== null ? (
                    <p title={x.comment}>{x.comment}</p>
                  ) : (
                    <p className="text-scale-800">No description</p>
                  )}
                </Table.td>
                <Table.td className="hidden xl:table-cell">
                  <code className="text-sm">{x.live_rows_estimate ?? x.live_row_count}</code>
                </Table.td>
                <Table.td className="hidden xl:table-cell">
                  <code className="text-sm">{x.size}</code>
                </Table.td>
                <Table.td className="hidden xl:table-cell text-center">
                  {(realtimePublication?.tables ?? []).find((table: any) => table.id === x.id) && (
                    <div className="flex justify-center">
                      <IconCheck strokeWidth={2} />
                    </div>
                  )}
                </Table.td>
                <Table.td>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="default"
                      iconRight={<IconColumns />}
                      className="whitespace-nowrap hover:border-gray-500"
                      style={{ paddingTop: 3, paddingBottom: 3 }}
                      onClick={() => onOpenTable(x)}
                    >
                      {x.columns.length} columns
                    </Button>
                    <Button
                      type="text"
                      icon={<IconEdit3 />}
                      style={{ padding: 5 }}
                      disabled={isLocked}
                      onClick={() => onEditTable(x)}
                    />
                    <Button
                      type="text"
                      icon={<IconTrash />}
                      style={{ padding: 5 }}
                      disabled={isLocked}
                      onClick={() => onDeleteTable(x)}
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

export default observer(TableList)
