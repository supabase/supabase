import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import z from 'zod'

import { CreateRolePanel } from './CreateRolePanel'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

const FORM_ID = 'create-new-role'

const QueryBodySchema = z.object({ query: z.string() })

describe('CreateRolePanel', () => {
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
    // useDatabaseRoleCreateMutation executes SQL, and the invalidated roles query lists roles
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

  const renderPanel = () => {
    const onClose = vi.fn()
    customRender(
      <ProjectContextProvider projectRef="default">
        <CreateRolePanel visible onClose={onClose} />
      </ProjectContextProvider>
    )
    return { onClose }
  }

  const fillName = async (name: string) => {
    const user = userEvent.setup()
    await user.click(await screen.findByLabelText('Name'))
    await user.paste(name)
    return user
  }

  const getLoginSwitch = () => screen.getByLabelText('User can login')

  const getCreateQuery = () => queries.find((query) => query.includes('create role'))

  test('hides the password field until login is enabled', async () => {
    renderPanel()

    await screen.findByLabelText('Name')
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()

    await userEvent.click(getLoginSwitch())

    expect(await screen.findByLabelText('Password')).toBeInTheDocument()
  })

  test('fills the password field and announces it when a password is generated', async () => {
    renderPanel()
    const user = userEvent.setup()
    await screen.findByLabelText('Name')

    await user.click(getLoginSwitch())
    const passwordInput = await screen.findByLabelText('Password')
    expect(passwordInput).toHaveValue('')

    await user.click(screen.getByRole('button', { name: 'Generate a password' }))

    expect(passwordInput).not.toHaveValue('')
    expect(screen.getByText('Password generated')).toBeInTheDocument()

    // Editing the generated password clears the announcement
    await user.type(passwordInput, 'x')
    expect(screen.queryByText('Password generated')).not.toBeInTheDocument()
  })

  test('creates the role with the password when login is enabled', async () => {
    renderPanel()
    const user = await fillName('app_user')

    await user.click(getLoginSwitch())
    await user.click(await screen.findByLabelText('Password'))
    await user.paste('s3cret')
    fireEvent.submit(document.getElementById(FORM_ID)!)

    await waitFor(() => expect(getCreateQuery()).toBeDefined())
    expect(getCreateQuery()).toContain(`password 's3cret'`)
  })

  test('omits the password when login is enabled but the field is empty', async () => {
    renderPanel()
    const user = await fillName('app_user')

    await user.click(getLoginSwitch())
    fireEvent.submit(document.getElementById(FORM_ID)!)

    await waitFor(() => expect(getCreateQuery()).toBeDefined())
    expect(getCreateQuery()).toContain('login')
    expect(getCreateQuery()).not.toContain('password')
  })

  test('omits a typed password when login is turned off again', async () => {
    renderPanel()
    const user = await fillName('app_user')

    await user.click(getLoginSwitch())
    await user.click(await screen.findByLabelText('Password'))
    await user.paste('s3cret')
    await user.click(getLoginSwitch())
    fireEvent.submit(document.getElementById(FORM_ID)!)

    await waitFor(() => expect(getCreateQuery()).toBeDefined())
    expect(getCreateQuery()).not.toContain('password')
    expect(getCreateQuery()).not.toContain('s3cret')
  })
})
