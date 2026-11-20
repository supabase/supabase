import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { CreateCustomOidcIntegrationDialog } from './CreateCustomOidcDialog'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

const ISSUER_PLACEHOLDER = 'https://login.example.com'

const mockCreateIntegration = (requests: unknown[], response?: () => Response) => {
  addAPIMock({
    method: 'post',
    path: '/v1/projects/:ref/config/auth/third-party-auth',
    response:
      response ??
      (async ({ request }) => {
        requests.push(await request.json())
        return HttpResponse.json({
          id: '00000000-0000-0000-0000-000000000000',
          type: 'oidc',
          oidc_issuer_url: 'https://login.example.com',
          inserted_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        })
      }),
  })
}

const renderDialog = () => {
  const onClose = vi.fn()
  customRender(<CreateCustomOidcIntegrationDialog visible onClose={onClose} />)
  return { onClose }
}

describe('CreateCustomOidcIntegrationDialog', () => {
  test('rejects a non-HTTPS issuer URL without calling the API', async () => {
    const requests: unknown[] = []
    mockCreateIntegration(requests)
    const { onClose } = renderDialog()

    await userEvent.type(
      screen.getByPlaceholderText(ISSUER_PLACEHOLDER),
      'http://login.example.com'
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Add provider' }))

    expect(await screen.findByText(/Enter an HTTPS URL/)).toBeInTheDocument()
    expect(requests).toEqual([])
    expect(onClose).not.toHaveBeenCalled()
  })

  test('requires an issuer URL', async () => {
    renderDialog()

    fireEvent.click(await screen.findByRole('button', { name: 'Add provider' }))

    expect(await screen.findByText('Issuer URL is required')).toBeInTheDocument()
  })

  test('trims whitespace, sends the issuer URL as typed, and closes on success', async () => {
    const requests: unknown[] = []
    mockCreateIntegration(requests)
    const { onClose } = renderDialog()

    await userEvent.type(
      screen.getByPlaceholderText(ISSUER_PLACEHOLDER),
      '  https://login.example.com/tenant/  '
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Add provider' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(requests).toEqual([{ oidc_issuer_url: 'https://login.example.com/tenant/' }])
  })

  test('keeps the dialog open when the API rejects the issuer', async () => {
    mockCreateIntegration([], () =>
      HttpResponse.json({ message: 'Unable to fetch OIDC configuration' }, { status: 400 })
    )
    const { onClose } = renderDialog()

    await userEvent.type(
      screen.getByPlaceholderText(ISSUER_PLACEHOLDER),
      'https://login.example.com'
    )
    const submit = await screen.findByRole('button', { name: 'Add provider' })
    fireEvent.click(submit)

    await waitFor(() => expect(submit).not.toBeDisabled())
    expect(onClose).not.toHaveBeenCalled()
  })
})
