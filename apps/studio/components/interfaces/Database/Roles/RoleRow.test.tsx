import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import z from 'zod'

import { RoleRow } from './RoleRow'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import type { PgRole } from '@/data/database-roles/database-roles-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

const QueryBodySchema = z.object({ query: z.string() })

const createRole = (overrides: Partial<PgRole> = {}): PgRole => ({
  id: 16500,
  name: 'app_user',
  isSuperuser: false,
  canCreateDb: false,
  canCreateRole: false,
  inheritRole: true,
  canLogin: false,
  isReplicationRole: false,
  canBypassRls: false,
  activeConnections: 0,
  connectionLimit: -1,
  validUntil: null,
  config: {},
  ...overrides,
})

describe('RoleRow', () => {
  let queries: string[]

  beforeEach(() => {
    queries = []
    routerMock.setCurrentUrl('/project/default/database/roles')
    // useSelectedProjectQuery
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error partial project is enough for the connection string lookup
      response: {
        cloud_provider: 'localhost',
        id: 1,
        inserted_at: '2021-08-02T06:40:40.646Z',
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'local',
        status: 'ACTIVE_HEALTHY',
      },
    })
    // useDatabaseRoleUpdateMutation executes SQL, and the invalidated roles query lists roles
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const body = QueryBodySchema.parse(await request.json())
        queries.push(body.query)
        return HttpResponse.json<Record<string, unknown>[]>([])
      },
    })
  })

  const renderExpandedRow = async (role: PgRole) => {
    customRender(
      <ProjectContextProvider projectRef="default">
        <RoleRow role={role} onSelectDelete={vi.fn()} />
      </ProjectContextProvider>
    )
    const user = userEvent.setup()
    await user.click(await screen.findByText(role.name))
    return user
  }

  const getLoginSwitch = () => screen.getByLabelText('User can login')

  const submit = (role: PgRole) =>
    fireEvent.submit(document.getElementById(`role-update-form-${role.id}`)!)

  const getUpdateQuery = () => queries.find((query) => query.includes('alter role'))

  test('does not offer a password for a role that can already log in', async () => {
    await renderExpandedRow(createRole({ canLogin: true }))

    expect(getLoginSwitch()).toBeChecked()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
  })

  test('shows the password field only while login is turned on for a role that cannot log in', async () => {
    const user = await renderExpandedRow(createRole())

    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()

    await user.click(getLoginSwitch())
    expect(await screen.findByLabelText('Password')).toBeInTheDocument()
    // The role may already have a password, so an empty field must not claim it has none
    expect(screen.getByText(/leave empty to keep the role's current password/i)).toBeInTheDocument()

    await user.click(getLoginSwitch())
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
  })

  test('sets the password when login is turned on', async () => {
    const role = createRole()
    const user = await renderExpandedRow(role)

    await user.click(getLoginSwitch())
    await user.click(await screen.findByLabelText('Password'))
    await user.paste('s3cret')
    submit(role)

    await waitFor(() => expect(getUpdateQuery()).toBeDefined())
    expect(getUpdateQuery()).toMatch(/\blogin\b/)
    expect(getUpdateQuery()).toContain(`'s3cret'`)
  })

  test('turns on login without a password when the field is empty', async () => {
    const role = createRole()
    const user = await renderExpandedRow(role)

    await user.click(getLoginSwitch())
    submit(role)

    await waitFor(() => expect(getUpdateQuery()).toBeDefined())
    expect(getUpdateQuery()).toMatch(/\blogin\b/)
    expect(getUpdateQuery()).not.toContain('password')
  })

  test('does not send a password with other changes to a role that can already log in', async () => {
    const role = createRole({ canLogin: true })
    const user = await renderExpandedRow(role)

    await user.click(screen.getByLabelText('User can create databases'))
    submit(role)

    await waitFor(() => expect(getUpdateQuery()).toBeDefined())
    expect(getUpdateQuery()).toContain('createdb')
    expect(getUpdateQuery()).not.toContain('password')
  })
})
