import type {
  StripeAddressElement,
  StripeAddressElementChangeEvent,
  StripeAddressElementOptions,
} from '@stripe/stripe-js'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UpdateBillingAddressModal } from '@/components/interfaces/App/UpdateBillingAddressModal'
import { createMockOrganization, render } from '@/tests/helpers'

type MockAddressElementProps = {
  onChange?: (event: StripeAddressElementChangeEvent) => void
  onReady?: (element: StripeAddressElement) => void
  options?: StripeAddressElementOptions
}

const EMPTY_ADDRESS_VALUE: StripeAddressElementChangeEvent['value'] = {
  name: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  },
}

let currentAddressValue: StripeAddressElementChangeEvent['value'] = EMPTY_ADDRESS_VALUE
let currentAddressComplete = false

const emitAddressEvent = (
  props: MockAddressElementProps,
  event: Pick<StripeAddressElementChangeEvent, 'complete' | 'value'>
) => {
  currentAddressValue = event.value
  currentAddressComplete = event.complete
  props.onChange?.({
    elementType: 'address',
    elementMode: 'billing',
    empty: false,
    isNewAddress: false,
    ...event,
  })
}

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AddressElement: (props: MockAddressElementProps) => {
    useEffect(() => {
      props.onReady?.({
        getValue: vi.fn(async () => ({
          complete: currentAddressComplete,
          isNewAddress: false,
          value: currentAddressValue,
        })),
      } as unknown as StripeAddressElement)
    }, [props])

    return (
      <div>
        <div data-testid="stripe-address-element" />
        <button
          type="button"
          onClick={() =>
            emitAddressEvent(props, {
              complete: true,
              value: {
                name: 'Updated Company',
                address: {
                  line1: '500 Market St',
                  line2: '',
                  city: 'San Francisco',
                  state: 'CA',
                  postal_code: '94105',
                  country: 'US',
                },
              },
            })
          }
        >
          Emit valid US address
        </button>
        <button
          type="button"
          onClick={() =>
            emitAddressEvent(props, {
              complete: false,
              value: {
                name: 'Updated Company',
                address: {
                  line1: '500 Market St',
                  line2: '',
                  city: 'San Francisco',
                  state: 'CA',
                  postal_code: '',
                  country: 'US',
                },
              },
            })
          }
        >
          Emit invalid address
        </button>
        <button
          type="button"
          onClick={() =>
            emitAddressEvent(props, {
              complete: true,
              value: {
                name: 'Updated GmbH',
                address: {
                  line1: 'Stephansplatz 1',
                  line2: '',
                  city: 'Vienna',
                  state: 'Vienna',
                  postal_code: '1010',
                  country: 'AT',
                },
              },
            })
          }
        >
          Emit valid AT address
        </button>
        <button
          type="button"
          onClick={() => {
            currentAddressValue = {
              name: 'Updated Company',
              address: {
                line1: '500 Market St',
                line2: '',
                city: '',
                state: 'CA',
                postal_code: '94105',
                country: 'US',
              },
            }
            currentAddressComplete = false
          }}
        >
          Make submit validation fail
        </button>
      </div>
    )
  },
  useElements: () => null,
  useStripe: () => null,
}))
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(null)),
}))

vi.mock('@/lib/constants', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('@/lib/constants')
  return { ...original, IS_PLATFORM: true }
})

const mockFlag = vi.fn(() => true)
vi.mock('common', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('common')
  return {
    ...original,
    useFlag: (_name: string) => mockFlag(),
    useParams: () => ({ slug: 'test-org' }),
  }
})

const mockOrg = vi.fn<() => ReturnType<typeof createMockOrganization> | undefined>(() =>
  createMockOrganization({
    slug: 'test-org',
    organization_missing_address: true,
    billing_partner: null,
  })
)
vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: mockOrg() }),
}))

const mockCanRead = vi.fn(() => true)
const mockCanWrite = vi.fn(() => true)
const mockBillingReadLoaded = vi.fn(() => true)
const mockBillingWriteLoaded = vi.fn(() => true)
vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: (action: PermissionAction) =>
    action === PermissionAction.BILLING_READ
      ? {
          can: mockCanRead(),
          isSuccess: mockBillingReadLoaded(),
        }
      : {
          can: mockCanWrite(),
          isSuccess: mockBillingWriteLoaded(),
        },
}))

const mockCustomerProfile = vi.fn(() => ({
  address: { line1: '', line2: '', city: '', state: '', postal_code: '', country: '' },
  billing_name: '',
}))
const mockProfileLoaded = vi.fn(() => true)
const mockProfileError = vi.fn(() => false)
vi.mock('@/data/organizations/organization-customer-profile-query', () => ({
  useOrganizationCustomerProfileQuery: () => ({
    data: mockCustomerProfile(),
    isSuccess: mockProfileLoaded(),
    isError: mockProfileError(),
  }),
}))

const mockTaxId = vi.fn(() => null)
const mockTaxIdLoaded = vi.fn(() => true)
const mockTaxIdError = vi.fn(() => false)
vi.mock('@/data/organizations/organization-tax-id-query', () => ({
  useOrganizationTaxIdQuery: () => ({
    data: mockTaxId(),
    isSuccess: mockTaxIdLoaded(),
    isError: mockTaxIdError(),
  }),
}))

const mockUpdateCustomerProfile = vi.fn(() => Promise.resolve())
vi.mock('@/data/organizations/organization-customer-profile-update-mutation', () => ({
  useOrganizationCustomerProfileUpdateMutation: () => ({
    mutateAsync: mockUpdateCustomerProfile,
  }),
}))

const mockUpdateTaxId = vi.fn(() => Promise.resolve())
vi.mock('@/data/organizations/organization-tax-id-update-mutation', () => ({
  useOrganizationTaxIdUpdateMutation: () => ({
    mutateAsync: mockUpdateTaxId,
  }),
}))

vi.mock('@/data/organizations/organizations-query', () => ({
  invalidateOrganizationsQuery: vi.fn(() => Promise.resolve()),
}))

describe('UpdateBillingAddressModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentAddressValue = EMPTY_ADDRESS_VALUE
    currentAddressComplete = false
    mockFlag.mockReturnValue(true)
    mockOrg.mockReturnValue(
      createMockOrganization({
        slug: 'test-org',
        organization_missing_address: true,
        billing_partner: null,
        plan: { id: 'pro', name: 'Pro' },
      })
    )
    mockCanRead.mockReturnValue(true)
    mockCanWrite.mockReturnValue(true)
    mockBillingReadLoaded.mockReturnValue(true)
    mockBillingWriteLoaded.mockReturnValue(true)
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

  it('renders an informational modal when user has read access but no write access', async () => {
    mockCanRead.mockReturnValue(true)
    mockCanWrite.mockReturnValue(false)
    render(<UpdateBillingAddressModal />)

    expect(await screen.findByText('Billing address required')).toBeInTheDocument()
    expect(
      screen.getByText(/please ask an organization administrator or owner/i)
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save address' })).not.toBeInTheDocument()
  })

  it('does not render when user lacks both billing read and write permission', () => {
    mockCanRead.mockReturnValue(false)
    mockCanWrite.mockReturnValue(false)
    render(<UpdateBillingAddressModal />)
    expect(screen.queryByText('Billing address required')).not.toBeInTheDocument()
  })

  it('does not render when no org is selected', () => {
    mockOrg.mockReturnValue(undefined)
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
    mockCanRead.mockReturnValue(true)
    mockCanWrite.mockReturnValue(false)
    render(<UpdateBillingAddressModal />)
    expect(await screen.findByText('Billing address required')).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: /close/i })
    await userEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Billing address required')).not.toBeInTheDocument()
    })
  })

  it('enables submit after the address element reports a valid change', async () => {
    render(<UpdateBillingAddressModal />)

    expect(await screen.findByText('Billing address required')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Save address' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Emit valid US address' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save address' })).toBeEnabled())
  })

  it('filters tax ID options using the current address country', async () => {
    render(<UpdateBillingAddressModal />)

    expect(await screen.findByText('Billing address required')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Emit valid AT address' }))
    await userEvent.click(screen.getByRole('combobox'))

    expect(await screen.findByText('Austria - AT VAT')).toBeInTheDocument()
    expect(screen.queryByText('United States - US EIN')).not.toBeInTheDocument()
  })

  it('uses getValue on submit to block saving when Stripe validation becomes incomplete', async () => {
    render(<UpdateBillingAddressModal />)

    expect(await screen.findByText('Billing address required')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Emit valid US address' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save address' })).toBeEnabled())

    await userEvent.click(screen.getByRole('button', { name: 'Make submit validation fail' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save address' }))

    await waitFor(() => {
      expect(mockUpdateCustomerProfile).not.toHaveBeenCalled()
      expect(mockUpdateTaxId).not.toHaveBeenCalled()
    })
  })
})
