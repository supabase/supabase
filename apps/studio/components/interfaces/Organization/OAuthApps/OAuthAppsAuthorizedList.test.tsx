import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockIntersectionObserver } from 'jsdom-testing-mocks'
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

mockIntersectionObserver()

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
  test('expands a member to show their projects and permission groups', async () => {
    customRender(<OAuthAppsAuthorizedList />)

    await openRowMenu('Vercel')
    await userEvent.click(await screen.findByText('View grants'))

    expect(await screen.findByText('Member grants for Vercel')).toBeInTheDocument()
    await userEvent.click(await screen.findByText('admin@example.com'))

    expect(await screen.findByText('northwind-storefront, northwind-cms')).toBeInTheDocument()
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
})
