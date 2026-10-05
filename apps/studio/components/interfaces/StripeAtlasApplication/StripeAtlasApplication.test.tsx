import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StripeAtlasApplicationScreen } from './StripeAtlasApplication'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))

type PerkApplication = platformComponents['schemas']['PerkApplicationDataResponse_Output']

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const searchParams = vi.hoisted(() => ({ current: {} as Record<string, string> }))

vi.mock('common', async () => {
  const actual = await vi.importActual<typeof import('common')>('common')
  return { ...actual, useParams: () => searchParams.current }
})

const STRIPE_ATLAS_TOKEN = 'atlas_token_123'
const APPLICATION: PerkApplication = {
  stripeAtlasToken: STRIPE_ATLAS_TOKEN,
  firstname: 'Alice',
  lastname: 'Founder',
  companyName: 'Example Inc',
}

const encodeCallbackData = (data: unknown) => Buffer.from(JSON.stringify(data)).toString('base64')

/** Each mock returns the request bodies its endpoint received. */
const mockLookup = (application: PerkApplication) => {
  const bodies: unknown[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/stripe/atlas/application',
    response: async ({ request }) => {
      bodies.push(await request.clone().json())
      return HttpResponse.json<PerkApplication>(application)
    },
  })
  return bodies
}

const mockLookupFailure = (message: string, status: number) => {
  const bodies: unknown[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/stripe/atlas/application',
    response: async ({ request }) => {
      bodies.push(await request.clone().json())
      return HttpResponse.json<APIErrorBody>({ message }, { status })
    },
  })
  return bodies
}

/** The endpoint answers 200 with no body, so `failure` drives the error case instead. */
const mockComplete = (failure?: { message: string; status: number }) => {
  const bodies: unknown[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/stripe/atlas/application/complete',
    response: async ({ request }) => {
      bodies.push(await request.clone().json())
      if (failure) {
        return HttpResponse.json<APIErrorBody>(
          { message: failure.message },
          { status: failure.status }
        )
      }
      return new HttpResponse(null, { status: 200 })
    },
  })
  return bodies
}

const clickSubmit = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Confirm application' }))

describe('StripeAtlasApplicationScreen', () => {
  beforeEach(() => {
    searchParams.current = {
      data: encodeCallbackData({ type: 'success', stripeAtlasToken: STRIPE_ATLAS_TOKEN }),
    }
  })

  it('looks the application up by token and prefills the form with it', async () => {
    const lookups = mockLookup(APPLICATION)

    customRender(<StripeAtlasApplicationScreen />)

    expect(await screen.findByLabelText('First name')).toHaveValue('Alice')
    expect(screen.getByLabelText('Last name')).toHaveValue('Founder')
    expect(screen.getByLabelText('Company name')).toHaveValue('Example Inc')

    expect(lookups).toEqual([{ stripeAtlasToken: STRIPE_ATLAS_TOKEN }])
  })

  it('renders fields the application does not carry as empty', async () => {
    mockLookup({ stripeAtlasToken: STRIPE_ATLAS_TOKEN, firstname: 'Alice' })

    customRender(<StripeAtlasApplicationScreen />)

    expect(await screen.findByLabelText('First name')).toHaveValue('Alice')
    expect(screen.getByLabelText('Last name')).toHaveValue('')
    expect(screen.getByLabelText('Company name')).toHaveValue('')
  })

  it('surfaces the error instead of the form when the lookup fails', async () => {
    mockLookupFailure('Application not found', 404)

    customRender(<StripeAtlasApplicationScreen />)

    expect(await screen.findByText('Application not found')).toBeInTheDocument()
    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument()
  })

  it('submits the edited details with the token and confirms the application', async () => {
    mockLookup(APPLICATION)
    const completions = mockComplete()

    customRender(<StripeAtlasApplicationScreen />)

    const companyName = await screen.findByLabelText('Company name')
    await userEvent.clear(companyName)
    await userEvent.type(companyName, 'Renamed Inc')

    clickSubmit()

    expect(await screen.findByText('Application confirmed')).toBeInTheDocument()
    expect(
      screen.getByText(/sent your credit code to your Stripe Atlas Merchant email/)
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Company name')).not.toBeInTheDocument()

    expect(completions).toEqual([
      {
        stripeAtlasToken: STRIPE_ATLAS_TOKEN,
        firstname: 'Alice',
        lastname: 'Founder',
        companyName: 'Renamed Inc',
      },
    ])
  })

  it('toasts and keeps the form submittable when confirming fails', async () => {
    mockLookup(APPLICATION)
    const completions = mockComplete({ message: 'Credit code already redeemed', status: 400 })

    customRender(<StripeAtlasApplicationScreen />)

    await screen.findByLabelText('First name')
    clickSubmit()

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to confirm application: Credit code already redeemed'
      )
    )

    expect(screen.queryByText('Application confirmed')).not.toBeInTheDocument()
    expect(screen.getByLabelText('First name')).toHaveValue('Alice')

    clickSubmit()
    await vi.waitFor(() => expect(completions).toHaveLength(2))
  })

  describe('callback data', () => {
    it('shows the error the callback carries', async () => {
      searchParams.current = {
        data: encodeCallbackData({ type: 'error', message: 'Something broke at Stripe' }),
      }
      const lookups = mockLookup(APPLICATION)

      customRender(<StripeAtlasApplicationScreen />)

      expect(await screen.findByText('Something broke at Stripe')).toBeInTheDocument()
      expect(lookups).toEqual([])
    })

    it('asks the user to start from Stripe when there is no callback data', async () => {
      searchParams.current = {}
      const lookups = mockLookup(APPLICATION)

      customRender(<StripeAtlasApplicationScreen />)

      expect(await screen.findByText('Only Pre-Filled Applications supported')).toBeInTheDocument()
      expect(lookups).toEqual([])
    })

    it('asks the user to start from Stripe when the callback data is not decodable', async () => {
      searchParams.current = { data: 'not-base64-at-all!!' }
      const lookups = mockLookup(APPLICATION)

      customRender(<StripeAtlasApplicationScreen />)

      expect(await screen.findByText('Only Pre-Filled Applications supported')).toBeInTheDocument()
      expect(lookups).toEqual([])
    })
  })
})
