import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { RoleRow } from '@/components/interfaces/Database/Roles/RoleRow'
import { RolesList } from '@/components/interfaces/Database/Roles/RolesList'
import type { PgRole } from '@/data/database-roles/database-roles-query'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

const createRole = (id: number, name: string): PgRole => ({
  id,
  name,
  isSuperuser: false,
  canCreateDb: false,
  canCreateRole: false,
  inheritRole: true,
  canLogin: true,
  isReplicationRole: false,
  canBypassRls: false,
  activeConnections: 0,
  connectionLimit: -1,
  validUntil: null,
  config: {},
})

const roles = [
  createRole(1, 'postgres'),
  createRole(2, 'supabase_privileged_role'),
  createRole(3, 'supabase_auth_admin'),
  createRole(4, 'custom_role'),
]

beforeEach(() => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () =>
      HttpResponse.json<ProjectDetail>({
        cloud_provider: 'AWS',
        connectionString: null,
        db_host: 'localhost',
        high_availability: false,
        id: 1,
        inserted_at: '2026-01-01T00:00:00Z',
        integration_source: null,
        is_branch_enabled: false,
        is_physical_backups_enabled: false,
        name: 'Test project',
        organization_id: 1,
        ref: 'default',
        region: 'us-east-1',
        restUrl: 'http://localhost:54321',
        status: 'ACTIVE_HEALTHY',
        subscription_id: 'test-subscription',
        updated_at: '2026-01-01T00:00:00Z',
      }),
  })

  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: ({ request }) => {
      const key = new URL(request.url).searchParams.get('key')
      if (key === 'max-connections') {
        return HttpResponse.json<{ max_connections: string }[]>([{ max_connections: '100' }])
      }
      if (key === 'database-roles') {
        return HttpResponse.json<PgRole[]>(roles)
      }
      throw new Error(`Unexpected SQL request: ${key}`)
    },
  })
})

describe('RoleRow', () => {
  test.each(['postgres', 'pg_database_owner', 'pg_read_all_data', 'pg_write_all_data'])(
    'disables Delete for the system role %s',
    async (name) => {
      const onSelectDelete = vi.fn()
      customRender(<RoleRow role={createRole(1, name)} onSelectDelete={onSelectDelete} />)

      await userEvent.click(screen.getByRole('button', { name: `${name} actions` }))
      const deleteItem = await screen.findByRole('menuitem', { name: 'Delete' })
      expect(deleteItem).toBeAriaDisabled()
      fireEvent.click(deleteItem)
      expect(onSelectDelete).not.toHaveBeenCalled()

      await userEvent.hover(deleteItem)
      expect(
        await screen.findByRole('tooltip', {
          name: `The ${name} role is a system role and cannot be deleted`,
        })
      ).toBeInTheDocument()
    }
  )

  test('keeps the postgres permission editor available', async () => {
    customRender(<RoleRow role={createRole(1, 'postgres')} onSelectDelete={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /postgres \(ID: 1\)/ }))
    const loginSwitch = await screen.findByRole('switch', { name: 'User can login' })
    expect(loginSwitch).not.toBeDisabled()
    await userEvent.click(loginSwitch)
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  test('allows selecting a custom role for deletion', async () => {
    const onSelectDelete = vi.fn()
    customRender(<RoleRow role={createRole(4, 'custom_role')} onSelectDelete={onSelectDelete} />)

    await userEvent.click(screen.getByRole('button', { name: 'custom_role actions' }))
    const deleteItem = await screen.findByRole('menuitem', { name: 'Delete' })
    expect(deleteItem).not.toBeAriaDisabled()
    await userEvent.click(deleteItem)
    expect(onSelectDelete).toHaveBeenCalledWith('4')
  })

  test('keeps disabled roles read-only', async () => {
    customRender(<RoleRow disabled role={createRole(4, 'custom_role')} onSelectDelete={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'custom_role actions' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /custom_role \(ID: 4\)/ }))
    expect(await screen.findByRole('switch', { name: 'User can login' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  })
})

describe('RolesList', () => {
  test('separates protected service roles from the project administrator and custom roles', async () => {
    customRender(<RolesList />)

    const serviceRoles = within(screen.getByRole('region', { name: 'Supabase service roles' }))
    const projectRoles = within(screen.getByRole('region', { name: 'Project database roles' }))
    expect(await serviceRoles.findByText('supabase_privileged_role')).toBeInTheDocument()
    expect(serviceRoles.getByText('supabase_auth_admin')).toBeInTheDocument()
    expect(serviceRoles.queryByText('postgres')).not.toBeInTheDocument()
    expect(projectRoles.getByRole('button', { name: /postgres \(ID: 1\)/ })).toBeInTheDocument()
    expect(projectRoles.getByRole('button', { name: /custom_role \(ID: 4\)/ })).toBeInTheDocument()
    expect(
      serviceRoles.queryByRole('button', { name: 'supabase_privileged_role actions' })
    ).not.toBeInTheDocument()
  })

  test('opens the deletion confirmation for a custom role', async () => {
    customRender(<RolesList />)

    await userEvent.click(await screen.findByRole('button', { name: 'custom_role actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Confirm to delete role "custom_role"'
    )
  })
})
