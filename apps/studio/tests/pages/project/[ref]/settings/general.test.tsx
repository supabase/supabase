import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import GeneralSettingsPage from '@/pages/project/[ref]/settings/general'

const {
  mockIsPlatform,
  mockUseIsFeatureEnabled,
  mockUseOrgSubscriptionQuery,
  mockUseSelectedOrganizationQuery,
  mockUseSelectedProjectQuery,
} = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockUseIsFeatureEnabled: vi.fn(),
  mockUseOrgSubscriptionQuery: vi.fn(),
  mockUseSelectedOrganizationQuery: vi.fn(),
  mockUseSelectedProjectQuery: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: mockUseSelectedOrganizationQuery,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

vi.mock('@/data/subscriptions/org-subscription-query', () => ({
  useOrgSubscriptionQuery: mockUseOrgSubscriptionQuery,
}))

vi.mock('@/components/interfaces/Billing/Subscription/Subscription.utils', () => ({
  subscriptionHasHipaaAddon: () => true,
}))

vi.mock('@/components/layouts/DefaultLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/ProjectSettingsLayout/SettingsLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/interfaces/Settings/General/General', () => ({
  General: () => <div>GeneralSection</div>,
}))

vi.mock('@/components/interfaces/Settings/General/Project', () => ({
  Project: () => <div>ProjectSection</div>,
}))

vi.mock('@/components/interfaces/Settings/General/ComplianceConfig/ProjectComplianceMode', () => ({
  ComplianceConfig: () => <div>ComplianceConfig</div>,
}))

vi.mock('@/components/interfaces/Settings/General/CustomDomainConfig/CustomDomainConfig', () => ({
  CustomDomainConfig: () => <div>CustomDomainConfig</div>,
}))

vi.mock(
  '@/components/interfaces/Settings/General/TransferProjectPanel/TransferProjectPanel',
  () => ({
    TransferProjectPanel: () => <div>TransferProjectPanel</div>,
  })
)

vi.mock('@/components/interfaces/Settings/General/DeleteProjectPanel/DeleteProjectPanel', () => ({
  DeleteProjectPanel: () => <div>DeleteProjectPanel</div>,
}))

describe('/project/[ref]/settings/general', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockUseIsFeatureEnabled.mockReturnValue({
      projectsTransfer: true,
      projectSettingsCustomDomains: true,
    })
    mockUseSelectedOrganizationQuery.mockReturnValue({ data: { slug: 'my-org' } })
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { ref: 'project-ref', parent_project_ref: null },
    })
    mockUseOrgSubscriptionQuery.mockReturnValue({ data: undefined })
  })

  it('renders all sections on platform', () => {
    render(<GeneralSettingsPage dehydratedState={{}} />)

    expect(screen.getByText('GeneralSection')).toBeInTheDocument()
    expect(screen.getByText('ProjectSection')).toBeInTheDocument()
    expect(screen.getByText('ComplianceConfig')).toBeInTheDocument()
    expect(screen.getByText('CustomDomainConfig')).toBeInTheDocument()
    expect(screen.getByText('TransferProjectPanel')).toBeInTheDocument()
    expect(screen.getByText('DeleteProjectPanel')).toBeInTheDocument()
  })

  it('renders only the General section on self-hosted, no redirect', () => {
    mockIsPlatform.value = false

    render(<GeneralSettingsPage dehydratedState={{}} />)

    expect(screen.getByText('GeneralSection')).toBeInTheDocument()
    expect(screen.queryByText('ProjectSection')).not.toBeInTheDocument()
    expect(screen.queryByText('ComplianceConfig')).not.toBeInTheDocument()
    expect(screen.queryByText('CustomDomainConfig')).not.toBeInTheDocument()
    expect(screen.queryByText('TransferProjectPanel')).not.toBeInTheDocument()
    expect(screen.queryByText('DeleteProjectPanel')).not.toBeInTheDocument()
  })
})
