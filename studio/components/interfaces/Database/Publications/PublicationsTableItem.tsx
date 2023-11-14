import type { PostgresPublication, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Badge, Toggle } from 'ui'

import Table from 'components/to-be-cleaned/Table'
import { useCheckPermissions, useStore } from 'hooks'

interface PublicationsTableItemProps {
  table: PostgresTable
  selectedPublication: PostgresPublication
}

const PublicationsTableItem = ({ table, selectedPublication }: PublicationsTableItemProps) => {
  const { ui, meta } = useStore()
  const enabledForAllTables = selectedPublication.tables == null

  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(
    selectedPublication.tables?.find((x: any) => x.id == table.id) != undefined
  )

  const canUpdatePublications = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'publications'
  )

  const toggleReplicationForTable = async (
    table: PostgresTable,
    publication: PostgresPublication
  ) => {
    const originalChecked = checked
    setChecked(!checked)
    setLoading(true)

    const publicationTables = publication?.tables ?? []
    const exists = publicationTables.some((x: any) => x.id == table.id)
    const tables = !exists
      ? [`${table.schema}.${table.name}`].concat(
          publicationTables.map((t: any) => `${t.schema}.${t.name}`)
        )
      : publicationTables
          .filter((x: any) => x.id != table.id)
          .map((x: any) => `${x.schema}.${x.name}`)

    try {
      const id = publication.id
      const payload = { tables, id }
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
            <Badge color="scale">
              <span>Enabled</span>
              <span className="hidden lg:inline-block">&nbsp;for all tables</span>
            </Badge>
          ) : (
            <Toggle
              size="tiny"
              align="right"
              disabled={!canUpdatePublications || loading}
              className="m-0 ml-2 mt-1 -mb-1 p-0"
              checked={checked}
              onChange={() => toggleReplicationForTable(table, selectedPublication)}
            />
          )}
        </div>
      </Table.td>
    </Table.tr>
  )
}

export default observer(PublicationsTableItem)
