import { PermissionAction } from '@supabase/shared-types/out/constants'
import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import BillingEmail from './BillingEmail'
import { organizationKeys } from '@/data/organizations/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type CustomerResponse = components['schemas']['CustomerResponse']

// The additional-emails control renders a Radix Popover when adding a recipient.
mockAnimationsApi()

const SLUG = 'acme-org'

const mockCheckPermissions = vi.hoisted(() => vi.fn())

vi.mock('common', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('common')
  return {
    ...original,
    // The customer-profile query is platform-only; IS_PLATFORM is false by default in tests.
    IS_PLATFORM: true,
    useParams: () => ({ slug: SLUG }),
  }
})

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: (action: string) => mockCheckPermissions(action),
}))

vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: vi.fn(), inView: true }),
}))

const createCustomerProfileResponse = (
  overrides: Partial<CustomerResponse> = {}
): CustomerResponse => ({
  additional_emails: [],
  balance: 0,
  billing_via_partner: false,
  email: 'billing@example.com',
  tax_id: null,
  ...overrides,
})

const mockCustomerProfile = (overrides: Partial<CustomerResponse> = {}) => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/customer',
    response: () => HttpResponse.json<CustomerResponse>(createCustomerProfileResponse(overrides)),
  })
}

const mockUpdateCustomerProfile = () => {
  const requests: Array<{ slug: string | undefined; body: unknown }> = []
  addAPIMock({
    method: 'put',
    path: '/platform/organizations/:slug/customer',
    response: async ({ request, params }) => {
      requests.push({ slug: params.slug as string | undefined, body: await request.json() })
      return HttpResponse.json({}, { status: 204 })
    },
  })
  return requests
}

const addRecipient = async (email: string) => {
  const input = screen
    .getAllByRole('combobox')
    .find((element): element is HTMLInputElement => element instanceof HTMLInputElement)

  expect(input).toBeDefined()
  if (!input) return

  await userEvent.click(input)
  await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'))
  // fireEvent.change (rather than userEvent.type) avoids racing the popover's open-state
  // transition character-by-character, which otherwise drops the first keystroke(s).
  fireEvent.change(input, { target: { value: email } })
  fireEvent.click(await screen.findByRole('option', { name: new RegExp(`Create "${email}"`) }))
}

const removeRecipient = (email: string) => {
  const badge = screen.getByText(email)
  fireEvent.click(badge.querySelector('svg')!.parentElement!)
}

describe('BillingEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckPermissions.mockImplementation(() => ({ can: true, isSuccess: true }))
  })

  test('renders the current billing email and additional recipients', async () => {
    mockCustomerProfile({
      email: 'billing@example.com',
      additional_emails: ['cc@example.com'],
    })

    customRender(<BillingEmail />)

    expect(await screen.findByPlaceholderText('Email')).toHaveValue('billing@example.com')
    expect(screen.getByText('cc@example.com')).toBeInTheDocument()
  })

  test('shows a permission notice when the user cannot read billing data', async () => {
    mockCheckPermissions.mockImplementation((action: string) => ({
      can: action !== PermissionAction.BILLING_READ,
      isSuccess: true,
    }))

    customRender(<BillingEmail />)

    expect(await screen.findByText(/view this organization's email recipients/)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument()
  })

  test('disables the email controls when the user cannot update billing data', async () => {
    mockCheckPermissions.mockImplementation((action: string) => ({
      can: action !== PermissionAction.BILLING_WRITE,
      isSuccess: true,
    }))
    mockCustomerProfile({ email: 'billing@example.com', additional_emails: [] })

    customRender(<BillingEmail />)

    expect(await screen.findByPlaceholderText('Email')).toBeDisabled()
    expect(await screen.findByPlaceholderText('Add additional recipients')).toBeDisabled()
    expect(
      screen.getByText('You need additional permissions to update billing emails')
    ).toBeInTheDocument()
  })

  test('saves the updated email while keeping the existing additional recipients', async () => {
    mockCustomerProfile({
      email: 'billing@example.com',
      additional_emails: ['cc@example.com'],
    })
    const requests = mockUpdateCustomerProfile()

    customRender(<BillingEmail />)

    const emailInput = await screen.findByPlaceholderText('Email')
    await userEvent.clear(emailInput)
    await userEvent.type(emailInput, 'new-billing@example.com')

    fireEvent.click(await screen.findByRole('button', { name: 'Save' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]).toEqual({
      slug: SLUG,
      body: { email: 'new-billing@example.com', additional_emails: ['cc@example.com'] },
    })
  })

  test('adds a recipient when there are none', async () => {
    mockCustomerProfile({ email: 'billing@example.com', additional_emails: [] })
    const requests = mockUpdateCustomerProfile()

    customRender(<BillingEmail />)
    await screen.findByPlaceholderText('Email')

    await addRecipient('new@example.com')
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]).toEqual({
      slug: SLUG,
      body: { email: 'billing@example.com', additional_emails: ['new@example.com'] },
    })
  })

  test('removes a recipient when there is one', async () => {
    mockCustomerProfile({ email: 'billing@example.com', additional_emails: ['cc@example.com'] })
    const requests = mockUpdateCustomerProfile()

    customRender(<BillingEmail />)
    await screen.findByText('cc@example.com')

    removeRecipient('cc@example.com')
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]).toEqual({
      slug: SLUG,
      body: { email: 'billing@example.com', additional_emails: [] },
    })
  })

  test('appends a recipient when there is already one', async () => {
    mockCustomerProfile({
      email: 'billing@example.com',
      additional_emails: ['existing@example.com'],
    })
    const requests = mockUpdateCustomerProfile()

    customRender(<BillingEmail />)
    await screen.findByText('existing@example.com')

    await addRecipient('new@example.com')
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]).toEqual({
      slug: SLUG,
      body: {
        email: 'billing@example.com',
        additional_emails: ['existing@example.com', 'new@example.com'],
      },
    })
  })

  test('keeps an in-progress edit when the profile data refetches', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    let getCallCount = 0
    let customerProfile = createCustomerProfileResponse({
      email: 'initial@example.com',
      additional_emails: ['cc-initial@example.com'],
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/customer',
      response: () => {
        getCallCount++
        return HttpResponse.json<CustomerResponse>(customerProfile)
      },
    })

    customRender(<BillingEmail />, { queryClient })

    const emailInput = await screen.findByPlaceholderText('Email')
    await waitFor(() => expect(emailInput).toHaveValue('initial@example.com'))

    await userEvent.clear(emailInput)
    await userEvent.type(emailInput, 'edited@example.com')

    // Simulate an unrelated refetch of the same shared customer-profile query (e.g. triggered
    // by another section, or a background refetch) returning newer server data.
    customerProfile = createCustomerProfileResponse({
      email: 'server-updated@example.com',
      additional_emails: ['cc-updated@example.com'],
    })
    await queryClient.invalidateQueries({ queryKey: organizationKeys.customerProfile(SLUG) })
    await waitFor(() => expect(getCallCount).toBeGreaterThanOrEqual(2))

    // The dirty form is left untouched - not overwritten with the newly fetched data.
    expect(emailInput).toHaveValue('edited@example.com')
    expect(screen.getByText('cc-initial@example.com')).toBeInTheDocument()
    expect(screen.queryByText('cc-updated@example.com')).not.toBeInTheDocument()
  })
})
