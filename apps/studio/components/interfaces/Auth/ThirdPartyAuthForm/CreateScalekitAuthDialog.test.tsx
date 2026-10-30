import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { CreateScalekitAuthDialog } from './CreateScalekitAuthDialog'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

const ISSUER_PLACEHOLDER = 'https://yourorg.scalekit.com'

const mockCreateIntegration = (requests: unknown[]) => {
  addAPIMock({
    method: 'post',
    path: '/v1/projects/:ref/config/auth/third-party-auth',
    response: async ({ request }) => {
      requests.push(await request.json())
      return HttpResponse.json({
        id: '00000000-0000-0000-0000-000000000000',
        type: 'oidc',
        oidc_issuer_url: 'https://yourorg.scalekit.com',
        inserted_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      })
    },
  })
}

const renderDialog = () => {
  const onClose = vi.fn()
  customRender(<CreateScalekitAuthDialog visible onClose={onClose} />)
  return { onClose }
}

const pasteIssuer = async (value: string) => {
  const user = userEvent.setup({ delay: null })
  const input = screen.getByPlaceholderText(ISSUER_PLACEHOLDER)
  await user.click(input)
  await user.paste(value)
}

describe('CreateScalekitAuthDialog', () => {
  test('keeps Add provider disabled until the issuer changes', async () => {
    renderDialog()
    expect(await screen.findByRole('button', { name: 'Add provider' })).toBeDisabled()
  })

  test.each(['https://acme.scalekit.cloud', 'https://auth.yourapp.ai'])(
    'sends %s as the issuer',
    async (issuerUrl) => {
      const requests: unknown[] = []
      mockCreateIntegration(requests)
      const { onClose } = renderDialog()

      await pasteIssuer(issuerUrl)
      fireEvent.click(await screen.findByRole('button', { name: 'Add provider' }))

      await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
      expect(requests).toEqual([{ oidc_issuer_url: issuerUrl }])
    }
  )

  test('rejects an issuer with a query string without calling the API', async () => {
    const requests: unknown[] = []
    mockCreateIntegration(requests)
    const { onClose } = renderDialog()

    await pasteIssuer('https://acme.scalekit.com?x=1')
    fireEvent.click(await screen.findByRole('button', { name: 'Add provider' }))

    expect(await screen.findByText(/Enter an HTTPS URL/)).toBeInTheDocument()
    expect(requests).toEqual([])
    expect(onClose).not.toHaveBeenCalled()
  })

  test('asks before discarding a typed issuer', async () => {
    const { onClose } = renderDialog()

    await pasteIssuer('https://acme.scalekit.com')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(await screen.findByRole('button', { name: 'Discard changes' })).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})
