import type { PostgresPublication, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import { toast } from 'sonner'

import { useDatabasePublicationUpdateMutation } from 'data/database-publications/database-publications-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { Badge, Switch, TableCell, TableRow, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface PublicationsTableItemProps {
  table: PostgresTable
  selectedPublication: PostgresPublication
}

export const PublicationsTableItem = ({
  table,
  selectedPublication,
}: PublicationsTableItemProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: protectedSchemas } = useProtectedSchemas()
  const enabledForAllTables = selectedPublication.tables == null

  const isProtected = protectedSchemas.map((x) => x.name).includes(table.schema)

  const [checked, setChecked] = useState(
    selectedPublication.tables?.find((x: any) => x.id == table.id) != undefined
  )

  const { can: canUpdatePublications } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'publications'
  )

  const { mutate: updatePublications, isLoading } = useDatabasePublicationUpdateMutation()

  const toggleReplicationForTable = async (
    table: PostgresTable,
    publication: PostgresPublication
  ) => {
    if (project === undefined) return console.error('Project is required')

    const originalChecked = checked
    setChecked(!checked)

    const publicationTables = publication?.tables ?? []
    const exists = publicationTables.some((x: any) => x.id == table.id)
    const tables = !exists
      ? [`${table.schema}.${table.name}`].concat(
          publicationTables.map((t: any) => `${t.schema}.${t.name}`)
        )
      : publicationTables
          .filter((x: any) => x.id != table.id)
          .map((x: any) => `${x.schema}.${x.name}`)

    updatePublications(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        id: publication.id,
        tables,
      },
      {
        onSuccess: () => {
          toast.success(
            `Successfully ${checked ? 'disabled' : 'enabled'} replication for ${table.name}`
          )
        },
        onError: (error) => {
          toast.error(`Failed to toggle replication for ${table.name}: ${error.message}`)
          setChecked(originalChecked)
        },
      }
    )
  }

  return (
    <TableRow key={table.id}>
      <TableCell className="py-3 whitespace-nowrap">{table.name}</TableCell>
      <TableCell className="py-3 whitespace-nowrap">{table.schema}</TableCell>
      <TableCell className="py-3 hidden max-w-sm truncate whitespace-nowrap lg:table-cell">
        {table.comment}
      </TableCell>
      <TableCell className="py-3">
        <div className="flex justify-end gap-2">
          {enabledForAllTables ? (
            <Badge>
              <span>Enabled</span>
              <span className="hidden lg:inline-block">&nbsp;for all tables</span>
            </Badge>
          ) : (
            <Tooltip>
              <TooltipTrigger>
                <Switch
                  size="small"
                  disabled={!canUpdatePublications || isLoading || isProtected}
                  checked={checked}
                  onClick={() => toggleReplicationForTable(table, selectedPublication)}
                />
              </TooltipTrigger>
              {isProtected && (
                <TooltipContent side="bottom" className="w-64 text-center">
                  This table belongs to a protected schema, and its publication cannot be toggled
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
