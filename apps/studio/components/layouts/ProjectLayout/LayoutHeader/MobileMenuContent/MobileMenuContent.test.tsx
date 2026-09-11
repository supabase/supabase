import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MobileMenuContent } from './MobileMenuContent'
import type { ExplorerResourceType } from '@/components/layouts/ExplorerLayout/ExplorerLayout.constants'
import { ExplorerNavHeader } from '@/components/layouts/ExplorerLayout/ExplorerNavHeader'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const createNotebook = vi.fn()
const createChat = vi.fn()
vi.mock('@/components/interfaces/Explorer/hooks', () => ({
  useCreateNotebook: () => ({ createNotebook }),
  useCreateChat: () => ({ createChat }),
}))

vi.mock('@/components/layouts/Navigation/NavigationBar/NavigationBar.utils', () => ({
  generateProductRoutes: () => [{ key: 'database', label: 'Database' }],
  generateSettingsRoutes: () => [],
  useGenerateOtherRoutes: () => [],
  useGenerateToolRoutes: () => [],
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({}),
}))

vi.mock('./mobileProductMenuRegistry', () => ({
  getProductMenuComponent: (key: string) =>
    key === 'database' ? () => <span>Database menu</span> : null,
}))

const ExplorerMobileMenu = ({ initialSection }: { initialSection: ExplorerResourceType }) => {
  const [section, setSection] = useState<ExplorerResourceType | undefined>(initialSection)
  return (
    <MobileMenuContent
      currentProduct="Explorer"
      currentSectionKey="explorer"
      currentProductMenu={<span>{section ?? 'Home'} content</span>}
      currentProductMenuHeader={
        <ExplorerNavHeader
          section={section}
          onBack={() => setSection(undefined)}
          rootAction={<span>Switch to SQL Editor</span>}
        />
      }
    />
  )
}

describe('Mobile product header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<ProjectDetail>({
          cloud_provider: 'AWS',
          connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
          db_host: 'localhost',
          dbVersion: '15.1.0',
          high_availability: false,
          id: 1,
          inserted_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          integration_source: null,
          is_branch_enabled: false,
          is_physical_backups_enabled: false,
          name: 'Test project',
          organization_id: 1,
          ref: 'default',
          region: 'us-east-1',
          restUrl: 'https://default.supabase.co',
          status: 'ACTIVE_HEALTHY',
          subscription_id: 'subscription-1',
        }),
    })
  })

  it.each(['notebook', 'chat'] as const)(
    'can create a %s and return to Explorer home',
    async (section) => {
      const user = userEvent.setup()
      customRender(<ExplorerMobileMenu initialSection={section} />)

      await user.click(screen.getByRole('button', { name: `New ${section}` }))
      expect(section === 'notebook' ? createNotebook : createChat).toHaveBeenCalledOnce()
      expect(section === 'notebook' ? createChat : createNotebook).not.toHaveBeenCalled()

      screen.getByRole('button', { name: 'Explorer' }).focus()
      await user.keyboard('{Enter}')
      expect(screen.getByText('Home content')).toBeInTheDocument()
      expect(screen.getByText('Switch to SQL Editor')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: `New ${section}` })).not.toBeInTheDocument()
    }
  )

  it('hides the current product header in the top-level menu and other product sections', async () => {
    const user = userEvent.setup()
    customRender(<ExplorerMobileMenu initialSection="notebook" />)

    await user.click(screen.getByRole('button', { name: 'Back to menu' }))
    expect(
      screen.queryByRole('navigation', { name: 'Explorer navigation' })
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Database' }))
    expect(screen.getByText('Database menu')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'New notebook' })).not.toBeInTheDocument()
  })
})
