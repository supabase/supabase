import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { OAuthAppsAuthorizedList } from '@/components/interfaces/Organization/OAuthApps/OAuthAppsAuthorizedList'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return { ...actual, useParams: () => ({ slug: 'northwind-traders' }) }
})

let canRevoke = true

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: (action: string) => ({
    can: action === 'write:Delete' ? canRevoke : true,
    isSuccess: true,
    isLoading: false,
  }),
}))

const rowFor = async (name: string) => {
  const cell = await screen.findByText(name)
  const row = cell.closest('tr')
  if (!row) throw new Error(`No row for ${name}`)
  return row
}

const openRowMenu = async (name: string) => {
  const row = await rowFor(name)
  await userEvent.click(within(row).getByRole('button'))
}

beforeEach(() => {
  canRevoke = true
  vi.clearAllMocks()
})

describe('OAuthAppsAuthorizedList', () => {
  test('renders a badge per status and the legacy grants string', async () => {
    customRender(<OAuthAppsAuthorizedList />)

    expect(await screen.findAllByText('ACTIVE')).toHaveLength(2)
    expect(await screen.findByText('LEGACY')).toBeInTheDocument()
    expect(screen.queryByText('REVOKED')).not.toBeInTheDocument()

    expect(await screen.findByText('Authorized before project controls')).toBeInTheDocument()
    expect(await screen.findByText('1 member grant')).toBeInTheDocument()
    expect(await screen.findByText('33 member grants')).toBeInTheDocument()
  })

  test('only offers Revoke to an admin on an active row', async () => {
    canRevoke = false
    const nonAdmin = customRender(<OAuthAppsAuthorizedList />)

    await openRowMenu('Vercel')
    expect(await screen.findByText('View grants')).toBeInTheDocument()
    expect(screen.queryByText('Revoke')).not.toBeInTheDocument()
    nonAdmin.unmount()

    canRevoke = true
    customRender(<OAuthAppsAuthorizedList />)

    await openRowMenu('Contoso Analytics')
    expect(await screen.findByText('View grants')).toBeInTheDocument()
    expect(screen.queryByText('Revoke')).not.toBeInTheDocument()
  })

  test('expands a member to show their projects and permission groups', async () => {
    customRender(<OAuthAppsAuthorizedList />)

    await openRowMenu('Vercel')
    await userEvent.click(await screen.findByText('View grants'))

    expect(await screen.findByText('Member grants for Vercel')).toBeInTheDocument()
    await userEvent.click(await screen.findByText('admin@example.com'))

    expect(await screen.findByText('northwindstorefront1, northwindcms1')).toBeInTheDocument()
    expect(
      await screen.findByText('database:read, database:write, projects:read')
    ).toBeInTheDocument()
  })

  test('labels an organization-bound grant and reports it as covering all projects', async () => {
    customRender(<OAuthAppsAuthorizedList />)

    await openRowMenu('Contoso Analytics')
    await userEvent.click(await screen.findByText('View grants'))

    expect(await screen.findByText('Organization-wide')).toBeInTheDocument()
    expect(await screen.findByText(/All projects/)).toBeInTheDocument()
  })

  test('renders the revoke caveats and revokes on confirm', async () => {
    customRender(<OAuthAppsAuthorizedList />)

    await openRowMenu('Vercel')
    await userEvent.click(await screen.findByText('Revoke'))

    expect(await screen.findByText('Revoke access for Vercel')).toBeInTheDocument()
    expect(await screen.findByText(/33 member grants will be revoked/)).toBeInTheDocument()
    expect(screen.queryByText(/organization-wide grant will be revoked/)).not.toBeInTheDocument()
    expect(await screen.findByText(/stays blocked for this organization/)).toBeInTheDocument()
    expect(
      await screen.findByText('Every member loses access on the apps next request.')
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Members will need to authorize again to reconnect.')
    ).toBeInTheDocument()
    expect(await screen.findByText(/a per-user/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Revoked access for Vercel')
    })
  })
})
