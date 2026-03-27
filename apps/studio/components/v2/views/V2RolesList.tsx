'use client'

import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import type { PgRole } from 'data/database-roles/database-roles-query'
import { isValidConnString } from 'data/fetchers'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { Plus } from 'lucide-react'
import { Button } from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { CreateRolePanel } from '@/components/interfaces/Database/Roles/CreateRolePanel'
import { DataTableRenderer } from '@/components/v2/DataTableRenderer'
import type { DataTableColumn } from '@/components/v2/DataTableRenderer'
import { useEntityPanelParams } from '@/components/v2/hooks/useEntityPanelParams'

const ROLES_COLUMNS: DataTableColumn<PgRole>[] = [
  {
    id: 'name',
    name: 'Role',
    width: 200,
    minWidth: 120,
    renderCell: (_v, row) => <span className="font-mono text-xs text-foreground">{row.name}</span>,
  },
  {
    id: 'activeConnections',
    name: 'Connections',
    width: 120,
    type: 'number',
  },
  {
    id: 'connectionLimit',
    name: 'Limit',
    width: 100,
    type: 'number',
    renderCell: (_v, row) =>
      row.connectionLimit === -1 ? (
        <span className="text-foreground-lighter">unlimited</span>
      ) : (
        <span>{row.connectionLimit}</span>
      ),
  },
  {
    id: 'isSuperuser',
    name: 'Superuser',
    width: 110,
    minWidth: 110,
    type: 'boolean',
  },
  {
    id: 'canLogin',
    name: 'Can login',
    width: 110,
    minWidth: 110,
    type: 'boolean',
  },
  {
    id: 'canCreateDb',
    name: 'Create DB',
    width: 110,
    minWidth: 110,
    type: 'boolean',
  },
  {
    id: 'canCreateRole',
    name: 'Create role',
    width: 110,
    minWidth: 110,
    type: 'boolean',
  },
  {
    id: 'inheritRole',
    name: 'Inherit',
    width: 90,
    minWidth: 90,
    type: 'boolean',
  },
  {
    id: 'canBypassRls',
    name: 'Bypass RLS',
    width: 110,
    minWidth: 110,
    type: 'boolean',
  },
  {
    id: 'validUntil',
    name: 'Valid until',
    width: 140,
    type: 'datetime',
    renderCell: (_v, row) =>
      row.validUntil ? (
        <span className="text-[13px]">{row.validUntil}</span>
      ) : (
        <span className="text-foreground-lighter italic">—</span>
      ),
  },
]

export function V2RolesList() {
  const { projectRef } = useV2Params()
  const { isCreating, setIsCreating } = useEntityPanelParams()

  const { data: project, isPending: isProjectPending } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const shouldFetch = Boolean(projectRef) && isValidConnString(project?.connectionString)

  const {
    data: roles,
    isPending: isRolesPending,
    isError,
    error,
  } = useDatabaseRolesQuery(
    { projectRef, connectionString: project?.connectionString },
    { enabled: shouldFetch }
  )

  return (
    <>
      <DataTableRenderer<PgRole>
        columns={ROLES_COLUMNS}
        rows={(roles as PgRole[]) ?? []}
        rowKey="name"
        isLoading={isProjectPending || (shouldFetch && isRolesPending)}
        error={isError ? (error as Error) : null}
        compact
        filters={[
          {
            id: 'search',
            label: 'Search',
            type: 'search',
            placeholder: 'Filter roles…',
          },
        ]}
        toolbarRight={
          <Button
            type="primary"
            size="tiny"
            icon={<Plus size={12} />}
            onClick={() => setIsCreating(true)}
          >
            Add role
          </Button>
        }
        emptyState={{
          title: 'No roles found',
          description: 'Database roles will appear here.',
        }}
      />

      <CreateRolePanel visible={isCreating} onClose={() => setIsCreating(false)} />
    </>
  )
}
