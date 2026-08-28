import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, test } from 'vitest'

import { StripeAtlasApplicationScreen } from './StripeAtlasApplication'
import { STRIPE_ATLAS_COMPLETE_PATH } from '@/data/partners/stripe-atlas-complete-mutation'
import { API_URL } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const COMPLETE_URL = `${API_URL}${STRIPE_ATLAS_COMPLETE_PATH}`

const encode = (payload: unknown) =>
  Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64')

const visitWith = (params: Record<string, string>) => {
  const search = new URLSearchParams(params).toString()
  window.history.replaceState({}, '', `/stripe-atlas-application?${search}`)
}

const mockComplete = (resolver: Parameters<typeof http.post>[1]) => {
  mswServer.use(http.post(COMPLETE_URL, resolver))
}

describe('StripeAtlasApplicationScreen', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/stripe-atlas-application')
  })

  test('prefills the form from the data param and submits it with the token', async () => {
    visitWith({
      data: encode({
        stripeAtlasToken: 'tok_123',
        firstname: 'Ada',
        lastname: 'Lovelace',
        email: 'ada@example.com',
        companyName: 'Analytical Engines',
      }),
    })

    const requestBodies: unknown[] = []
    mockComplete(async ({ request }) => {
      requestBodies.push(await request.json())
      return HttpResponse.json(null)
    })

    customRender(<StripeAtlasApplicationScreen />)

    expect(await screen.findByLabelText('First name')).toHaveValue('Ada')
    expect(screen.getByLabelText('Last name')).toHaveValue('Lovelace')
    expect(screen.getByLabelText('Company name')).toHaveValue('Analytical Engines')
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com')

    fireEvent.click(screen.getByRole('button', { name: 'Get my credit code' }))

    await waitFor(() =>
      expect(requestBodies).toEqual([
        {
          firstname: 'Ada',
          lastname: 'Lovelace',
          companyName: 'Analytical Engines',
          email: 'ada@example.com',
          stripeAtlasToken: 'tok_123',
        },
      ])
    )

    expect(await screen.findByText('Check your email')).toBeInTheDocument()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
  })

  test('lets the visitor type every field when the payload carries only a token', async () => {
    visitWith({ data: encode({ stripeAtlasToken: 'tok_123' }) })

    const requestBodies: unknown[] = []
    mockComplete(async ({ request }) => {
      requestBodies.push(await request.json())
      return HttpResponse.json(null)
    })

    customRender(<StripeAtlasApplicationScreen />)

    await userEvent.type(await screen.findByLabelText('First name'), 'Grace')
    await userEvent.type(screen.getByLabelText('Last name'), 'Hopper')
    await userEvent.type(screen.getByLabelText('Company name'), 'Compilers Inc')
    await userEvent.type(screen.getByLabelText('Email'), 'grace@example.com')

    fireEvent.click(screen.getByRole('button', { name: 'Get my credit code' }))

    await waitFor(() =>
      expect(requestBodies).toEqual([
        {
          firstname: 'Grace',
          lastname: 'Hopper',
          companyName: 'Compilers Inc',
          email: 'grace@example.com',
          stripeAtlasToken: 'tok_123',
        },
      ])
    )
  })

  test('blocks submission on an invalid email instead of calling the API', async () => {
    visitWith({ data: encode({ stripeAtlasToken: 'tok_123' }) })

    let wasCalled = false
    mockComplete(() => {
      wasCalled = true
      return HttpResponse.json(null)
    })

    customRender(<StripeAtlasApplicationScreen />)

    await userEvent.type(await screen.findByLabelText('First name'), 'Grace')
    await userEvent.type(screen.getByLabelText('Last name'), 'Hopper')
    await userEvent.type(screen.getByLabelText('Company name'), 'Compilers Inc')
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email')

    fireEvent.click(screen.getByRole('button', { name: 'Get my credit code' }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(wasCalled).toBe(false)
  })

  test('renders the backend application_error verbatim, with no form', async () => {
    const message = 'Unfortunately, something went wrong! Please reach out to Supabase support.'
    visitWith({ application_error: message })

    customRender(<StripeAtlasApplicationScreen />)

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contact support' })).toBeInTheDocument()
  })

  test('shows the invalid-link state when there is no data param', async () => {
    customRender(<StripeAtlasApplicationScreen />)

    expect(await screen.findByText(/This link is invalid or has expired/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
  })

  test('hides retry and keeps the form filled when the perk was already redeemed', async () => {
    visitWith({
      data: encode({ stripeAtlasToken: 'tok_123', firstname: 'Ada', lastname: 'Lovelace' }),
    })

    mockComplete(() =>
      HttpResponse.json(
        { message: 'A code for this partner user has already been redeemed' },
        { status: 400 }
      )
    )

    customRender(<StripeAtlasApplicationScreen />)

    await userEvent.type(await screen.findByLabelText('Company name'), 'Analytical Engines')
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com')

    fireEvent.click(screen.getByRole('button', { name: 'Get my credit code' }))

    expect(await screen.findByText(/already claimed the Supabase perk/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Try again/ })).not.toBeInTheDocument()
    // The visitor's input survives the failure.
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com')
  })

  test('offers a retry that keeps the form filled after a 404', async () => {
    visitWith({
      data: encode({
        stripeAtlasToken: 'tok_123',
        firstname: 'Ada',
        lastname: 'Lovelace',
        companyName: 'Analytical Engines',
        email: 'ada@example.com',
      }),
    })

    mockComplete(() => HttpResponse.json({ message: 'Not Found' }, { status: 404 }))

    customRender(<StripeAtlasApplicationScreen />)

    fireEvent.click(await screen.findByRole('button', { name: 'Get my credit code' }))

    expect(await screen.findByText(/Try again in a minute/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com')
  })
})
