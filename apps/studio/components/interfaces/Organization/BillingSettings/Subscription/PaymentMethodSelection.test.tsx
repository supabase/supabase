import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import PaymentMethodSelection from './PaymentMethodSelection'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

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
  // Stripe's field can't run in jsdom; this stands in for it and reports an edited address.
  AddressElement: ({ onChange }: { onChange: (event: unknown) => void }) => (
    <button
      type="button"
      tabIndex={0}
      data-testid="address-element"
      onClick={() =>
        onChange({
          complete: true,
          value: {
            name: 'Acme',
            address: {
              line1: '2 New St',
              line2: '',
              city: 'Singapore',
              state: '',
              postal_code: '654321',
              country: 'SG',
            },
          },
        })
      }
    >
      Change address
    </button>
  ),
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

function mockBillingEndpoints({
  paymentMethods,
  taxId = null,
}: {
  paymentMethods: PaymentsResponse['data']
  taxId?: TaxIdResponse['tax_id']
}) {
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
    response: () => HttpResponse.json<TaxIdResponse>({ tax_id: taxId }),
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

/**
 * Answers the customer profile update only once `respond` is called, so a test can look at
 * the screen while the request is still in flight.
 */
function holdCustomerUpdate() {
  let respond!: (result: 'success' | 'failure') => void
  const outcome = new Promise<'success' | 'failure'>((resolve) => {
    respond = resolve
  })

  addAPIMock({
    method: 'put',
    path: '/platform/organizations/:slug/customer',
    response: async () =>
      (await outcome) === 'success'
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json<APIErrorBody>({ message: 'Invalid tax ID' }, { status: 400 }),
  })

  return { respond }
}

/** Holds the selected id the way a real consumer does, so the trigger shows a value. */
const PaymentMethodSelectionHarness = ({ variant }: { variant?: 'select' | 'radio' }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()

  return (
    <PaymentMethodSelection
      variant={variant}
      label="Pay with"
      readOnly={false}
      selectedPaymentMethod={selectedPaymentMethod}
      onSelectPaymentMethod={setSelectedPaymentMethod}
      useAsDefaultBillingAddress
      onUseAsDefaultBillingAddressChange={vi.fn()}
    />
  )
}

const renderSelection = (variant?: 'select' | 'radio') =>
  customRender(<PaymentMethodSelectionHarness variant={variant} />)

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

  describe('radio variant', () => {
    it('lists the saved card as an option, with the billing address underneath', async () => {
      const { setupIntentRequests } = mockBillingEndpoints({ paymentMethods: [card] })

      renderSelection('radio')

      const savedCard = await screen.findByRole('radio', { name: /Visa •••• 4242/ })
      expect(savedCard).toBeChecked()
      expect(screen.getByText('Expires 08/28')).toBeInTheDocument()
      expect(screen.getByText('Default')).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Add a new card' })).not.toBeChecked()

      expect(screen.getByText('Acme')).toBeInTheDocument()
      expect(screen.getByText('1 Test St, Singapore 123456')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled()

      expect(screen.queryByTestId('new-payment-method-form')).not.toBeInTheDocument()
      expect(setupIntentRequests).toHaveLength(0)
    })

    it('shows the tax ID with the billing address only when the organization has one', async () => {
      mockBillingEndpoints({
        paymentMethods: [card],
        taxId: { type: 'sg_gst', country: 'SG', value: 'M12345678X' },
      })

      renderSelection('radio')

      expect(await screen.findByText('SG GST M12345678X')).toBeInTheDocument()
    })

    it('leaves the tax ID out when the organization has none', async () => {
      mockBillingEndpoints({ paymentMethods: [card] })

      renderSelection('radio')

      expect(await screen.findByText('1 Test St, Singapore 123456')).toBeInTheDocument()
      expect(screen.queryByText('Tax ID')).not.toBeInTheDocument()
    })

    it('swaps the billing address for the card form while adding a card, and back again', async () => {
      const user = userEvent.setup()
      mockBillingEndpoints({ paymentMethods: [card] })

      renderSelection('radio')

      await user.click(await screen.findByRole('radio', { name: 'Add a new card' }))

      expect(await screen.findByTestId('new-payment-method-form')).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Add a new card' })).toBeChecked()
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()

      await user.click(screen.getByRole('radio', { name: /Visa •••• 4242/ }))

      expect(screen.queryByTestId('new-payment-method-form')).not.toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /Visa •••• 4242/ })).toBeChecked()
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    })

    it('opens the billing address editor, with nothing to save until it changes', async () => {
      const user = userEvent.setup()
      mockBillingEndpoints({ paymentMethods: [card] })

      renderSelection('radio')

      await user.click(await screen.findByRole('button', { name: 'Edit' }))

      expect(
        await screen.findByRole('dialog', { name: 'Edit billing address' })
      ).toBeInTheDocument()
      expect(screen.getByTestId('address-element')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save address' })).toBeDisabled()
    })

    it('shows an edited billing address straight away, without waiting on the request', async () => {
      const user = userEvent.setup()
      mockBillingEndpoints({ paymentMethods: [card] })
      const update = holdCustomerUpdate()

      renderSelection('radio')

      await user.click(await screen.findByRole('button', { name: 'Edit' }))
      await user.click(await screen.findByTestId('address-element'))
      await user.click(screen.getByRole('button', { name: 'Save address' }))

      expect(await screen.findByText('2 New St, Singapore 654321')).toBeInTheDocument()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

      update.respond('success')
    })

    it('puts the previous address back and reopens the editor when saving fails', async () => {
      const user = userEvent.setup()
      mockBillingEndpoints({ paymentMethods: [card] })
      const update = holdCustomerUpdate()

      renderSelection('radio')

      await user.click(await screen.findByRole('button', { name: 'Edit' }))
      await user.click(await screen.findByTestId('address-element'))
      await user.click(screen.getByRole('button', { name: 'Save address' }))

      expect(await screen.findByText('2 New St, Singapore 654321')).toBeInTheDocument()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

      update.respond('failure')

      expect(
        await screen.findByRole('dialog', { name: 'Edit billing address' })
      ).toBeInTheDocument()
      expect(screen.getByText('1 Test St, Singapore 123456')).toBeInTheDocument()
      expect(screen.queryByText('2 New St, Singapore 654321')).not.toBeInTheDocument()
      // The edit that failed is still there to retry, without having to change anything.
      expect(screen.getByRole('button', { name: 'Save address' })).toBeEnabled()
    })

    it('goes straight to the card form when there is no saved card', async () => {
      const { setupIntentRequests } = mockBillingEndpoints({ paymentMethods: [] })

      renderSelection('radio')

      await waitFor(() => expect(setupIntentRequests).toHaveLength(1))
      expect(await screen.findByTestId('new-payment-method-form')).toBeInTheDocument()
      expect(screen.queryByRole('radio')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    })
  })
})
