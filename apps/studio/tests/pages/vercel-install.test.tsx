import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import { VercelInstallScreen } from '@/pages/integrations/vercel/install'
import { createMockOrganization } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'

const ACME_ORG = createMockOrganization({
  id: 1,
  name: 'Acme Production',
  slug: 'acme-production',
})

const PERSONAL_ORG = createMockOrganization({
  id: 2,
  name: 'Personal Sandbox',
  slug: 'personal-sandbox',
})

function renderScreen(
  props: Partial<Parameters<typeof VercelInstallScreen>[0]> = {},
  selectedOrgSlug: string | null = null
) {
  const onSelectOrg = vi.fn()
  const onInstall = vi.fn()
  const onCreateOrganization = vi.fn()

  customRender(
    <VercelInstallScreen
      organizations={[ACME_ORG, PERSONAL_ORG]}
      installedByOrgSlug={{}}
      selectedOrgSlug={selectedOrgSlug}
      source="marketplace"
      displayName="test@example.com"
      onSelectOrg={onSelectOrg}
      onInstall={onInstall}
      onCreateOrganization={onCreateOrganization}
      {...props}
    />
  )

  return { onSelectOrg, onInstall, onCreateOrganization }
}

describe('VercelInstallScreen', () => {
  test('renders organization choices and disables install until an organization is selected', async () => {
    const user = userEvent.setup()
    const { onSelectOrg } = renderScreen()

    expect(screen.getByText('Install Vercel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Install integration' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Acme Production/ }))

    expect(onSelectOrg).toHaveBeenCalledWith('acme-production')
  })

  test('calls install when an organization is selected', async () => {
    const user = userEvent.setup()
    const { onInstall } = renderScreen({}, ACME_ORG.slug)

    await user.click(screen.getByRole('button', { name: 'Install integration' }))

    expect(onInstall).toHaveBeenCalled()
  })

  test('moves marketplace-installed organizations into the unavailable list', async () => {
    const user = userEvent.setup()
    renderScreen({
      installedByOrgSlug: { [ACME_ORG.slug]: true },
      selectedOrgSlug: PERSONAL_ORG.slug,
    })

    await user.click(screen.getByRole('button', { name: /Organizations that can't be linked/ }))

    expect(screen.getByText('Acme Production')).toBeInTheDocument()
    expect(screen.getByText('Already installed')).toBeInTheDocument()
  })

  test.each([
    [{ missingParameters: ['code', 'configurationId'] }, 'Missing install parameters'],
    [{ isError: true, errorMessage: 'Failed to load organizations' }, 'Unable to load Vercel install'],
    [{ isInstalled: true }, 'Vercel installed'],
  ] satisfies Array<[Partial<Parameters<typeof VercelInstallScreen>[0]>, string]>)(
    'renders %s state',
    (props, expectedText) => {
      renderScreen(props)

      expect(screen.getByText('Install Vercel')).toBeInTheDocument()
      expect(screen.getByText(expectedText)).toBeInTheDocument()
    }
  )
})
