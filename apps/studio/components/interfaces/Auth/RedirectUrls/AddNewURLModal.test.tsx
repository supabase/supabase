import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { urlRegex } from '../Auth.constants'
import { AddNewURLModal } from './AddNewURLModal'
import type { AuthConfigResponse } from '@/data/auth/auth-config-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

// One entry per URL shape urlRegex() accepts. None may be split by the paste separator,
// otherwise pasting a valid URL would produce invalid rows. Pasting them all at once must
// round-trip to exactly this list, which also proves no single entry gets split.
const SUPPORTED_URL_FORMS = [
  'https://example.com',
  'https://example.com/auth/callback',
  'https://example.com/callback?next=1&mode=dark',
  'https://example.com:3000/callback',
  'http://localhost:3000',
  'http://localhost:3000/*',
  'http://localhost:3000/**',
  'http://localhost:3000/?',
  'http://localhost:3000/[!a-z]',
  'https://*-supabase.vercel.app/*/*',
  'https://**--my_org.netlify.app/**',
  'com.example.app://callback',
  'my-app://auth/callback',
  'chrome-extension://abcdefghijklmnop',
  'myapp://',
  'myapp:/callback',
]

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockAuthConfigUpdate = () => {
  const requests: Array<{ ref: string | undefined; body: unknown }> = []

  addAPIMock({
    method: 'patch',
    path: '/platform/auth/:ref/config',
    response: async ({ request, params }) => {
      requests.push({ ref: params.ref as string | undefined, body: await request.json() })
      return HttpResponse.json<AuthConfigResponse>({} as AuthConfigResponse)
    },
  })

  return requests
}

const submitForm = () =>
  fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)

describe('AddNewURLModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds and removes URL rows before submitting the current values', async () => {
    const user = userEvent.setup()
    const requests = mockAuthConfigUpdate()

    customRender(
      <AddNewURLModal visible allowList={['https://existing.example.com']} onClose={vi.fn()} />
    )

    await screen.findByRole('dialog')

    expect(screen.getAllByPlaceholderText('https://mydomain.com')).toHaveLength(1)

    fireEvent.change(screen.getByPlaceholderText('https://mydomain.com'), {
      target: { value: 'https://app.example.com' },
    })
    await user.click(screen.getByRole('button', { name: 'Add URL' }))

    const urlInputs = screen.getAllByPlaceholderText('https://mydomain.com')
    expect(urlInputs).toHaveLength(2)

    fireEvent.change(urlInputs[1], { target: { value: 'https://dashboard.example.com' } })
    await user.click(screen.getAllByRole('button', { name: 'Remove URL' })[1])

    expect(screen.getAllByPlaceholderText('https://mydomain.com')).toHaveLength(1)

    submitForm()

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Successfully added 1 URL'))
    expect(requests).toEqual([
      {
        ref: 'default',
        body: { URI_ALLOW_LIST: 'https://existing.example.com,https://app.example.com' },
      },
    ])
  })

  it('normalizes a trailing-comma URL before submitting', async () => {
    const requests = mockAuthConfigUpdate()

    customRender(<AddNewURLModal visible allowList={[]} onClose={vi.fn()} />)

    await screen.findByRole('dialog')

    fireEvent.change(screen.getByPlaceholderText('https://mydomain.com'), {
      target: { value: 'https://app.example.com,' },
    })

    submitForm()

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Successfully added 1 URL'))
    expect(requests).toEqual([
      { ref: 'default', body: { URI_ALLOW_LIST: 'https://app.example.com' } },
    ])
  })

  it('splits a pasted list on commas, spaces and line breaks', async () => {
    const user = userEvent.setup()
    const requests = mockAuthConfigUpdate()

    customRender(
      <AddNewURLModal visible allowList={['https://existing.example.com']} onClose={vi.fn()} />
    )

    await screen.findByRole('dialog')

    await user.click(screen.getByPlaceholderText('https://mydomain.com'))
    await user.paste(
      'https://a.example.com\nhttps://b.example.com,https://c.example.com https://d.example.com'
    )

    expect(screen.getAllByPlaceholderText('https://mydomain.com')).toHaveLength(4)

    submitForm()

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Successfully added 4 URLs'))
    expect(requests).toEqual([
      {
        ref: 'default',
        body: {
          URI_ALLOW_LIST:
            'https://existing.example.com,https://a.example.com,https://b.example.com,https://c.example.com,https://d.example.com',
        },
      },
    ])
  })

  it('flags a duplicate within a pasted list instead of collapsing it', async () => {
    const user = userEvent.setup()
    const requests = mockAuthConfigUpdate()

    customRender(<AddNewURLModal visible allowList={[]} onClose={vi.fn()} />)

    await screen.findByRole('dialog')

    await user.click(screen.getByPlaceholderText('https://mydomain.com'))
    await user.paste('https://a.example.com\nhttps://a.example.com')

    expect(screen.getAllByPlaceholderText('https://mydomain.com')).toHaveLength(2)

    submitForm()

    expect(await screen.findByText('URL already exists in this list')).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('splits a list of every supported URL form back into that list and saves it', async () => {
    const user = userEvent.setup()
    const requests = mockAuthConfigUpdate()

    customRender(<AddNewURLModal visible allowList={[]} onClose={vi.fn()} />)

    await screen.findByRole('dialog')

    await user.click(screen.getByPlaceholderText('https://mydomain.com'))
    await user.paste(SUPPORTED_URL_FORMS.join('\n'))

    const values = (
      screen.getAllByPlaceholderText('https://mydomain.com') as HTMLInputElement[]
    ).map((input) => input.value)

    expect(values).toEqual(SUPPORTED_URL_FORMS)
    values.forEach((value) => expect(urlRegex().test(value)).toBe(true))

    submitForm()

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        `Successfully added ${SUPPORTED_URL_FORMS.length} URLs`
      )
    )
    expect(requests).toEqual([
      { ref: 'default', body: { URI_ALLOW_LIST: SUPPORTED_URL_FORMS.join(',') } },
    ])
  })

  it.each([
    ['https://my app.example.com', "URL can't contain spaces"],
    ['https://example.com/auth callback', "URL can't contain spaces"],
    ['http://localhost:3000\\', "URL can't contain backslashes"],
    ['myapp://callback\\', "URL can't contain backslashes"],
  ])('rejects %s without saving', async (url, message) => {
    const requests = mockAuthConfigUpdate()

    customRender(<AddNewURLModal visible allowList={[]} onClose={vi.fn()} />)

    await screen.findByRole('dialog')

    fireEvent.change(screen.getByPlaceholderText('https://mydomain.com'), {
      target: { value: url },
    })

    submitForm()

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('validates each pasted URL on its own row', async () => {
    const user = userEvent.setup()
    const requests = mockAuthConfigUpdate()

    customRender(
      <AddNewURLModal visible allowList={['https://existing.example.com']} onClose={vi.fn()} />
    )

    await screen.findByRole('dialog')

    await user.click(screen.getByPlaceholderText('https://mydomain.com'))
    await user.paste('https://a.example.com https://existing.example.com')

    expect(screen.getAllByPlaceholderText('https://mydomain.com')).toHaveLength(2)

    submitForm()

    expect(await screen.findByText('URL already exists in the allow list')).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('rejects a trailing-comma URL when it already exists in the allow list', async () => {
    const requests = mockAuthConfigUpdate()

    customRender(
      <AddNewURLModal visible allowList={['https://existing.example.com']} onClose={vi.fn()} />
    )

    await screen.findByRole('dialog')

    fireEvent.change(screen.getByPlaceholderText('https://mydomain.com'), {
      target: { value: 'https://existing.example.com,' },
    })

    submitForm()

    expect(await screen.findByText('URL already exists in the allow list')).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('rejects a whitespace-padded URL when it already exists in the allow list', async () => {
    const requests = mockAuthConfigUpdate()

    customRender(
      <AddNewURLModal visible allowList={['https://existing.example.com']} onClose={vi.fn()} />
    )

    await screen.findByRole('dialog')

    fireEvent.change(screen.getByPlaceholderText('https://mydomain.com'), {
      target: { value: ' https://existing.example.com ' },
    })

    submitForm()

    expect(await screen.findByText('URL already exists in the allow list')).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })
})
