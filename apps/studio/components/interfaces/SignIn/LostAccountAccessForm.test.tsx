import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import { LostAccountAccessFormWizard } from './LostAccountAccessForm'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

describe('LostAccountAccessForm', () => {
  beforeAll(() => {
    vi.stubGlobal('hcaptcha', {
      execute: async () => {
        // Return HCaptcha's official test token
        return { response: '10000000-aaaa-bbbb-cccc-000000000001', key: 'mock' }
      },
      render: () => {
        return 'mock-widget-id'
      },
      reset: () => {},
      remove: () => {},
      getResponse: () => {
        return '10000000-aaaa-bbbb-cccc-000000000001'
      },
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  test('Requires at least the account email', async () => {
    customRender(<LostAccountAccessFormWizard />)
    fireEvent.click(await screen.findByText('Submit recovery request'))
    await screen.findByText('Please provide an email address.')
    await userEvent.type(await screen.findByLabelText('Email'), 'user@acme.com')
    await waitFor(() => expect(screen.queryByText('Please provide an email address.')).toBeNull())
  })

  test('Submit the request when at least an email has been provided', async () => {
    addAPIMock({
      method: 'post',
      // @ts-expect-error Not yet provided on platform
      path: '/platform/account-recovery/requests',
      response: () =>
        // TODO: replace the response type once available
        HttpResponse.json<{ message: string }>({
          message: 'OK',
        }),
    })
    customRender(<LostAccountAccessFormWizard />)
    await userEvent.type(await screen.findByLabelText('Email'), 'user@acme.com')
    await screen.findByDisplayValue('user@acme.com')
    fireEvent.click(await screen.findByText('Submit recovery request'))
    await screen.findByText('Check your email')
    await screen.findByText('user@acme.com')
  })
})
