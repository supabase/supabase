import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpdateBillingAddressModal } from 'components/interfaces/App/UpdateBillingAddressModal'
import { createMockOrganization, render } from 'tests/helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('lib/constants', async (importOriginal) => {
  const original = (await importOriginal()) as any
  return { ...original, IS_PLATFORM: true }
})

const mockFlag = vi.fn(() => true)
vi.mock('common', async (importOriginal) => {
  const original = (await importOriginal()) as any
  return {
    ...original,
    useFlag: (_name: string) => mockFlag(),
    useParams: () => ({ slug: 'test-org' }),
  }
})

const mockOrg = vi.fn(() =>
  createMockOrganization({
    slug: 'test-org',
    organization_missing_address: true,
    billing_partner: null,
  })
)
vi.mock('hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: mockOrg() }),
}))

const mockCanWrite = vi.fn(() => true)
const mockPermissionsLoaded = vi.fn(() => true)
vi.mock('hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({
    can: mockCanWrite(),
    isSuccess: mockPermissionsLoaded(),
  }),
}))

const mockCustomerProfile = vi.fn(() => ({
  address: { line1: '', line2: '', city: '', state: '', postal_code: '', country: '' },
  billing_name: '',
}))
const mockProfileLoaded = vi.fn(() => true)
const mockProfileError = vi.fn(() => false)
vi.mock('data/organizations/organization-customer-profile-query', () => ({
  useOrganizationCustomerProfileQuery: () => ({
    data: mockCustomerProfile(),
    isSuccess: mockProfileLoaded(),
    isError: mockProfileError(),
  }),
}))

const mockTaxId = vi.fn(() => null)
const mockTaxIdLoaded = vi.fn(() => true)
const mockTaxIdError = vi.fn(() => false)
vi.mock('data/organizations/organization-tax-id-query', () => ({
  useOrganizationTaxIdQuery: () => ({
    data: mockTaxId(),
    isSuccess: mockTaxIdLoaded(),
    isError: mockTaxIdError(),
  }),
}))

const mockUpdateCustomerProfile = vi.fn(() => Promise.resolve())
vi.mock('data/organizations/organization-customer-profile-update-mutation', () => ({
  useOrganizationCustomerProfileUpdateMutation: () => ({
    mutateAsync: mockUpdateCustomerProfile,
  }),
}))

const mockUpdateTaxId = vi.fn(() => Promise.resolve())
vi.mock('data/organizations/organization-tax-id-update-mutation', () => ({
  useOrganizationTaxIdUpdateMutation: () => ({
    mutateAsync: mockUpdateTaxId,
  }),
}))

vi.mock('data/organizations/organizations-query', () => ({
  invalidateOrganizationsQuery: vi.fn(() => Promise.resolve()),
}))

describe('UpdateBillingAddressModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFlag.mockReturnValue(true)
    mockOrg.mockReturnValue(
      createMockOrganization({
        slug: 'test-org',
        organization_missing_address: true,
        billing_partner: null,
        plan: { id: 'pro', name: 'Pro' },
      })
    )
    mockCanWrite.mockReturnValue(true)
    mockPermissionsLoaded.mockReturnValue(true)
    mockProfileLoaded.mockReturnValue(true)
    mockTaxIdLoaded.mockReturnValue(true)
    mockCustomerProfile.mockReturnValue({
      address: { line1: '', line2: '', city: '', state: '', postal_code: '', country: '' },
      billing_name: '',
    })
    mockTaxId.mockReturnValue(null)
    mockProfileError.mockReturnValue(false)
    mockTaxIdError.mockReturnValue(false)
  })

  it('renders when all conditions are met', async () => {
    render(<UpdateBillingAddressModal />)
    expect(await screen.findByText('Billing address required')).toBeInTheDocument()
  })

  it('does not render when feature flag is off', () => {
    mockFlag.mockReturnValue(false)
    render(<UpdateBillingAddressModal />)
    expect(screen.queryByText('Billing address required')).not.toBeInTheDocument()
  })

  it('does not render when org has no missing address', () => {
    mockOrg.mockReturnValue(createMockOrganization({ organization_missing_address: false }))
    render(<UpdateBillingAddressModal />)
    expect(screen.queryByText('Billing address required')).not.toBeInTheDocument()
  })

  it('does not render for free orgs', () => {
    mockOrg.mockReturnValue(
      createMockOrganization({
        organization_missing_address: true,
        plan: { id: 'free', name: 'Free' },
      })
    )
    render(<UpdateBillingAddressModal />)
    expect(screen.queryByText('Billing address required')).not.toBeInTheDocument()
  })

  it('does not render for partner-managed orgs', () => {
    mockOrg.mockReturnValue(
      createMockOrganization({
        organization_missing_address: true,
        billing_partner: 'vercel_marketplace',
      })
    )
    render(<UpdateBillingAddressModal />)
    expect(screen.queryByText('Billing address required')).not.toBeInTheDocument()
  })

  it('does not render when user lacks billing write permission', () => {
    mockCanWrite.mockReturnValue(false)
    render(<UpdateBillingAddressModal />)
    expect(screen.queryByText('Billing address required')).not.toBeInTheDocument()
  })

  it('does not render when no org is selected', () => {
    mockOrg.mockReturnValue(undefined as any)
    render(<UpdateBillingAddressModal />)
    expect(screen.queryByText('Billing address required')).not.toBeInTheDocument()
  })

  it('does not render when customer profile query errors', () => {
    mockProfileError.mockReturnValue(true)
    render(<UpdateBillingAddressModal />)
    expect(screen.queryByText('Billing address required')).not.toBeInTheDocument()
  })

  it('does not render when tax id query errors', () => {
    mockTaxIdError.mockReturnValue(true)
    render(<UpdateBillingAddressModal />)
    expect(screen.queryByText('Billing address required')).not.toBeInTheDocument()
  })

  it('shows loading shimmer while customer data loads', () => {
    mockProfileLoaded.mockReturnValue(false)
    render(<UpdateBillingAddressModal />)
    expect(screen.queryByText('Save address')).not.toBeInTheDocument()
  })

  it('dismisses on close button click', async () => {
    render(<UpdateBillingAddressModal />)
    expect(await screen.findByText('Billing address required')).toBeInTheDocument()

    // Click the X (close) button in DialogContent
    const closeButton = screen.getByRole('button', { name: /close/i })
    await userEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Billing address required')).not.toBeInTheDocument()
    })
  })
})
