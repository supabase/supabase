import { screen, waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import PaymentMethodSelection from './PaymentMethodSelection'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type PaymentsResponse = components['schemas']['PaymentsResponse_Output']
type CustomerResponse = components['schemas']['CustomerResponse_Output']
type TaxIdResponse = components['schemas']['TaxIdResponse_Output']
type SetupIntentResponse = components['schemas']['SetupIntentResponse_Output']

const ORG_SLUG = 'test-org'

vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return {
    ...actual,
    IS_PLATFORM: true,
    useParams: () => ({ slug: ORG_SLUG }),
    useIsLoggedIn: () => true,
  }
})

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: { slug: ORG_SLUG, billing_email: 'a@b.com' } }),
}))

vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }))

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, IS_PLATFORM: true }
})

// The billing queries are permission-gated; the scope plumbing behind the real hook
// needs a router this component never sees.
vi.mock('@/hooks/misc/useCheckPermissionsV2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/misc/useCheckPermissionsV2')>()),
  useAsyncCheckPermissionsV2: () => ({ can: true }),
}))

vi.mock('@stripe/stripe-js', () => ({ loadStripe: () => Promise.resolve(null) }))

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Stands in for the whole Stripe card form, so its presence is the thing under test.
vi.mock('@/components/interfaces/Billing/Payment/PaymentMethods/NewPaymentMethodElement', () => ({
  NewPaymentMethodElement: () => <div data-testid="new-payment-method-form" />,
}))

// Needs to hand back a ref: the component only requests a setup intent once the captcha
// is mounted and has produced a token.
vi.mock('@hcaptcha/react-hcaptcha', async () => {
  const { forwardRef, useImperativeHandle } = await import('react')
  return {
    default: forwardRef((_props, ref) => {
      // Stable handle: the component stores the ref in state, so a new object each
      // render would loop.
      useImperativeHandle(
        ref,
        () => ({
          execute: async () => ({ response: 'captcha-token' }),
          resetCaptcha: () => {},
        }),
        []
      )
      return <div data-testid="hcaptcha" />
    }),
  }
})

const card: PaymentsResponse['data'][number] = {
  id: 'pm_1',
  type: 'card',
  created: 0,
  has_address: true,
  is_default: true,
  card: { brand: 'visa', last4: '4242', exp_month: 8, exp_year: 2028 },
}

function mockBillingEndpoints({ paymentMethods }: { paymentMethods: PaymentsResponse['data'] }) {
  const setupIntentRequests: string[] = []

  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/payments',
    response: () =>
      HttpResponse.json<PaymentsResponse>({
        data: paymentMethods,
        defaultPaymentMethodId: 'pm_1',
      }),
  })

  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/customer',
    response: () =>
      HttpResponse.json<CustomerResponse>({
        additional_emails: null,
        balance: 0,
        billing_name: 'Acme',
        billing_via_partner: false,
        email: 'a@b.com',
        tax_id: null,
        address: {
          line1: '1 Test St',
          line2: null,
          city: 'Singapore',
          state: '',
          postal_code: '123456',
          country: 'SG',
        },
      }),
  })

  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/tax-ids',
    response: () => HttpResponse.json<TaxIdResponse>({ tax_id: null }),
  })

  addAPIMock({
    method: 'post',
    path: '/platform/organizations/:slug/payments/setup-intent',
    response: ({ request }) => {
      setupIntentRequests.push(request.url)
      return HttpResponse.json<SetupIntentResponse>({
        client_secret: 'seti_secret',
        pending_subscription_flow_enabled_for_creation: false,
      })
    },
  })

  return { setupIntentRequests }
}

/** Holds the selected id the way a real consumer does, so the trigger shows a value. */
const PaymentMethodSelectionHarness = () => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()

  return (
    <PaymentMethodSelection
      readOnly={false}
      selectedPaymentMethod={selectedPaymentMethod}
      onSelectPaymentMethod={setSelectedPaymentMethod}
      useAsDefaultBillingAddress
      onUseAsDefaultBillingAddressChange={vi.fn()}
    />
  )
}

const renderSelection = () => customRender(<PaymentMethodSelectionHarness />)

describe('PaymentMethodSelection', () => {
  it('shows the saved card rather than the new card form on first load', async () => {
    const { setupIntentRequests } = mockBillingEndpoints({ paymentMethods: [card] })

    renderSelection()

    // Saved cards start out indistinguishable from "no saved cards" while the payment
    // method and customer profile queries are in flight, which used to latch the new
    // card form open for an organization that already had a card on file.
    expect(await screen.findByText('•••• 4242 · expires 08/28')).toBeInTheDocument()
    expect(screen.queryByTestId('new-payment-method-form')).not.toBeInTheDocument()
    expect(setupIntentRequests).toHaveLength(0)
  })

  it('opens the new card form when the organization has no saved card', async () => {
    const { setupIntentRequests } = mockBillingEndpoints({ paymentMethods: [] })

    renderSelection()

    await waitFor(() => expect(setupIntentRequests).toHaveLength(1))
    expect(await screen.findByTestId('new-payment-method-form')).toBeInTheDocument()
  })
})
