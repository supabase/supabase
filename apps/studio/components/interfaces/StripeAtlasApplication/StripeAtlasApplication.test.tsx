import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StripeAtlasApplicationScreen } from './StripeAtlasApplication'
import { API_URL } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer, type APIErrorBody } from '@/tests/lib/msw'

const APPLICATION_ENDPOINT = `${API_URL}/platform/stripe/atlas/application`
const STRIPE_ATLAS_TOKEN = 'atlas_token_123'

const encode = (data: unknown) => Buffer.from(JSON.stringify(data)).toString('base64')

const searchParams = vi.hoisted(() => ({ current: {} as Record<string, string> }))

vi.mock('common', async () => {
  const actual = await vi.importActual<typeof import('common')>('common')
  return { ...actual, useParams: () => searchParams.current }
})

describe('StripeAtlasApplicationScreen', () => {
  beforeEach(() => {
    searchParams.current = {
      data: encode({ type: 'success', stripeAtlasToken: STRIPE_ATLAS_TOKEN }),
    }
  })

  it('prefills the form with the application it looks up by token', async () => {
    const requestBodies: unknown[] = []
    mswServer.use(
      http.post(APPLICATION_ENDPOINT, async ({ request }) => {
        requestBodies.push(await request.json())
        return HttpResponse.json({
          stripeAtlasToken: STRIPE_ATLAS_TOKEN,
          firstname: 'Alice',
          lastname: 'Founder',
          companyName: 'Example Inc',
          email: 'alice@example.com',
        })
      })
    )

    customRender(<StripeAtlasApplicationScreen />)

    expect(await screen.findByLabelText('First name')).toHaveValue('Alice')
    expect(screen.getByLabelText('Last name')).toHaveValue('Founder')
    expect(screen.getByLabelText('Company name')).toHaveValue('Example Inc')
    expect(screen.getByLabelText('Email')).toHaveValue('alice@example.com')

    expect(requestBodies).toEqual([{ stripeAtlasToken: STRIPE_ATLAS_TOKEN }])
  })

  it('leaves fields the application does not carry empty', async () => {
    mswServer.use(
      http.post(APPLICATION_ENDPOINT, () =>
        HttpResponse.json({ stripeAtlasToken: STRIPE_ATLAS_TOKEN, firstname: 'Alice' })
      )
    )

    customRender(<StripeAtlasApplicationScreen />)

    expect(await screen.findByLabelText('First name')).toHaveValue('Alice')
    expect(screen.getByLabelText('Email')).toHaveValue('')
  })

  it('surfaces the API error instead of the form when the lookup fails', async () => {
    mswServer.use(
      http.post(APPLICATION_ENDPOINT, () =>
        HttpResponse.json<APIErrorBody>({ message: 'Application not found' }, { status: 404 })
      )
    )

    customRender(<StripeAtlasApplicationScreen />)

    expect(await screen.findByText('Application not found')).toBeInTheDocument()
    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument()
  })

  it('does not look up an application when the callback reports an error', async () => {
    searchParams.current = { data: encode({ type: 'error', message: 'Something broke at Stripe' }) }

    customRender(<StripeAtlasApplicationScreen />)

    expect(await screen.findByText('Something broke at Stripe')).toBeInTheDocument()
  })

  it('asks the user to start from Stripe when there is no callback data', async () => {
    searchParams.current = {}

    customRender(<StripeAtlasApplicationScreen />)

    expect(await screen.findByText('Only Pre-Filled Applications supported')).toBeInTheDocument()
  })
})
