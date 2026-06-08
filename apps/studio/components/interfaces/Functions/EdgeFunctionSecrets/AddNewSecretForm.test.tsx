import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { AddNewSecretForm } from './AddNewSecretForm'
import type { ProjectSecret } from '@/data/secrets/secrets-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const multilineValue = '-----BEGIN CERTIFICATE-----\nline2\nline3\n-----END CERTIFICATE-----'

describe('AddNewSecretForm', () => {
  test('renders the value field as a textarea so multiline pastes are preserved', () => {
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/secrets',
      response: () => HttpResponse.json<ProjectSecret[]>([]),
    })

    customRender(<AddNewSecretForm />)

    const nameInput = screen.getByPlaceholderText('e.g. CLIENT_KEY')
    expect(nameInput.tagName).toBe('INPUT')

    const textareas = screen.getAllByRole('textbox')
    const valueTextarea = textareas.find((el) => el.tagName === 'TEXTAREA')
    expect(valueTextarea).toBeDefined()
  })

  test('submits a multiline value with newlines intact', async () => {
    const requests: Array<{ ref: string | undefined; body: unknown }> = []
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/secrets',
      response: async ({ request, params }) => {
        requests.push({ ref: params.ref as string | undefined, body: await request.json() })
        return HttpResponse.json({}, { status: 201 })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/secrets',
      response: () => HttpResponse.json<ProjectSecret[]>([]),
    })

    customRender(<AddNewSecretForm />)

    const nameInput = screen.getByPlaceholderText('e.g. CLIENT_KEY')
    const saveButton = screen.getByRole('button', { name: 'Save' })

    await userEvent.type(nameInput, 'SSL_CERT')

    const textareas = screen.getAllByRole('textbox')
    const valueTextarea = textareas.find((el) => el.tagName === 'TEXTAREA')!
    await userEvent.type(valueTextarea, multilineValue)

    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(requests).toEqual([
        {
          ref: 'default',
          body: [{ name: 'SSL_CERT', value: multilineValue }],
        },
      ])
    })
  })
})
