import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { EditSecretSheet } from './EditSecretSheet'
import type { ProjectSecret } from '@/data/secrets/secrets-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

const SECRET: ProjectSecret = { name: 'API_KEY', value: '' }

const renderSheet = (overrides: { onClose?: () => void } = {}) => {
  const onClose = overrides.onClose ?? vi.fn()
  customRender(<EditSecretSheet visible secret={SECRET} onClose={onClose} />)
  return { onClose }
}

describe('EditSecretSheet', () => {
  test('keeps Save disabled until a value is entered', async () => {
    renderSheet()

    const save = await screen.findByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()

    await userEvent.type(screen.getByPlaceholderText('my-secret-value'), 'new-value')
    await waitFor(() => expect(save).toBeEnabled())
  })

  test('posts the secret and closes on success', async () => {
    const requests: Array<{ ref: string | undefined; body: unknown }> = []
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/secrets',
      response: async ({ request, params }) => {
        requests.push({ ref: params.ref as string | undefined, body: await request.json() })
        return HttpResponse.json({}, { status: 201 })
      },
    })

    const { onClose } = renderSheet()

    await userEvent.type(screen.getByPlaceholderText('my-secret-value'), 'new-value')
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(requests).toEqual([{ ref: 'default', body: [{ name: 'API_KEY', value: 'new-value' }] }])
  })

  test('keeps the sheet open when the mutation fails', async () => {
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/secrets',
      response: () => HttpResponse.json({ message: 'Something exploded' }, { status: 500 }),
    })

    const { onClose } = renderSheet()

    await userEvent.type(screen.getByPlaceholderText('my-secret-value'), 'new-value')
    const save = await screen.findByRole('button', { name: 'Save' })
    fireEvent.click(save)

    await waitFor(() => expect(save).not.toBeDisabled())
    expect(onClose).not.toHaveBeenCalled()
  })
})
