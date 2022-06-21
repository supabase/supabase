import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, Toggle } from '@supabase/ui'

import { useStore } from 'hooks'
import Table from 'components/to-be-cleaned/Table'

interface Props {
  table: any
  selectedPublication: any
}

const PublicationsTableItem: FC<Props> = ({ table, selectedPublication }) => {
  const { ui, meta } = useStore()

  const publication = selectedPublication
  const enabledForAllTables = publication.tables == null
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(
    publication.tables?.find((x: any) => x.id == table.id) != undefined
  )

  const toggleReplicationForTable = async (table: any, publication: any) => {
    const originalChecked = checked
    setChecked(!checked)
    setLoading(true)

    let exists = publication.tables.some((x: any) => x.id == table.id)
    let tables = !exists
      ? [`${table.schema}.${table.name}`].concat(
          publication.tables.map((t: any) => `${t.schema}.${t.name}`)
        )
      : publication.tables
          .filter((x: any) => x.id != table.id)
          .map((x: any) => `${x.schema}.${x.name}`)

    try {
      const id = publication.id
      let payload = { tables, id }
      const { error } = await meta.publications.update(id, payload)
      if (error) throw error
      setLoading(false)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to toggle replication for ${table.name}: ${error.message}`,
      })
      setChecked(originalChecked)
      setLoading(false)
    }
  }

  return (
    <Table.tr key={table.id}>
      <Table.td className="whitespace-nowrap">{table.name}</Table.td>
      <Table.td className="whitespace-nowrap">{table.schema}</Table.td>
      <Table.td className="hidden max-w-sm truncate whitespace-nowrap lg:table-cell">
        {table.comment}
      </Table.td>
      <Table.td className="px-4 py-3 pr-2">
        <div className="flex justify-end gap-2">
          {enabledForAllTables ? (
            // @ts-ignore
            <Badge
              color="scale"
              // className="hover:border-gray-500"
              // style={{ paddingTop: 3, paddingBottom: 3 }}
            >
              <span>Enabled</span>
              <span className="hidden lg:inline-block">&nbsp;for all tables</span>
            </Badge>
          ) : (
            <Toggle
              size="tiny"
              align="right"
              disabled={loading}
              className="m-0 ml-2 mt-1 -mb-1 p-0"
              checked={checked}
              onChange={() => toggleReplicationForTable(table, publication)}
            />
          )}
        </div>
      </Table.td>
    </Table.tr>
  )
}

export default observer(PublicationsTableItem)
