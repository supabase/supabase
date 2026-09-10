import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { urlRegex } from '../Auth.constants'
import { AddNewURLModal } from './AddNewURLModal'
import { render } from '@/tests/helpers'

// One entry per URL shape urlRegex() accepts. None may be split by the paste separator,
// otherwise pasting a valid URL would produce invalid rows.
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

const { mutateMock, useAuthConfigUpdateMutationMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  useAuthConfigUpdateMutationMock: vi.fn(),
}))

vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    useParams: vi.fn().mockReturnValue({ ref: 'project-ref' }),
  }
})

vi.mock('@/data/auth/auth-config-update-mutation', () => ({
  useAuthConfigUpdateMutation: useAuthConfigUpdateMutationMock,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('AddNewURLModal', () => {
  beforeEach(() => {
    useAuthConfigUpdateMutationMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    })
  })

  it('adds and removes URL rows before submitting the current values', async () => {
    const user = userEvent.setup()
    mutateMock.mockImplementation((_vars, callbacks) => callbacks?.onSuccess?.())

    render(
      <AddNewURLModal visible allowList={['https://existing.example.com']} onClose={vi.fn()} />
    )

    await screen.findByRole('dialog')

    expect(screen.getAllByPlaceholderText('https://mydomain.com')).toHaveLength(1)

    await user.type(screen.getByPlaceholderText('https://mydomain.com'), 'https://app.example.com')
    await user.click(screen.getByRole('button', { name: 'Add URL' }))

    const urlInputs = screen.getAllByPlaceholderText('https://mydomain.com')
    expect(urlInputs).toHaveLength(2)

    await user.type(urlInputs[1], 'https://dashboard.example.com')
    await user.click(screen.getAllByRole('button', { name: 'Remove URL' })[1])

    expect(screen.getAllByPlaceholderText('https://mydomain.com')).toHaveLength(1)

    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)

    await waitFor(() =>
      expect(mutateMock).toHaveBeenCalledWith(
        {
          projectRef: 'project-ref',
          config: {
            URI_ALLOW_LIST: 'https://existing.example.com,https://app.example.com',
          },
        },
        expect.any(Object)
      )
    )

    expect(toast.success).toHaveBeenCalledWith('Successfully added 1 URL')
  })

  it('normalizes a trailing-comma URL before submitting', async () => {
    const user = userEvent.setup()
    mutateMock.mockImplementation((_vars, callbacks) => callbacks?.onSuccess?.())

    render(<AddNewURLModal visible allowList={[]} onClose={vi.fn()} />)

    await screen.findByRole('dialog')

    await user.type(screen.getByPlaceholderText('https://mydomain.com'), 'https://app.example.com,')

    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)

    await waitFor(() =>
      expect(mutateMock).toHaveBeenCalledWith(
        {
          projectRef: 'project-ref',
          config: {
            URI_ALLOW_LIST: 'https://app.example.com',
          },
        },
        expect.any(Object)
      )
    )

    expect(toast.success).toHaveBeenCalledWith('Successfully added 1 URL')
  })

  it('splits a pasted list on commas, spaces and line breaks', async () => {
    const user = userEvent.setup()
    mutateMock.mockImplementation((_vars, callbacks) => callbacks?.onSuccess?.())

    render(
      <AddNewURLModal visible allowList={['https://existing.example.com']} onClose={vi.fn()} />
    )

    await screen.findByRole('dialog')

    await user.click(screen.getByPlaceholderText('https://mydomain.com'))
    await user.paste(
      'https://a.example.com\nhttps://b.example.com,https://c.example.com https://d.example.com'
    )

    expect(screen.getAllByPlaceholderText('https://mydomain.com')).toHaveLength(4)

    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)

    await waitFor(() =>
      expect(mutateMock).toHaveBeenCalledWith(
        {
          projectRef: 'project-ref',
          config: {
            URI_ALLOW_LIST:
              'https://existing.example.com,https://a.example.com,https://b.example.com,https://c.example.com,https://d.example.com',
          },
        },
        expect.any(Object)
      )
    )

    expect(toast.success).toHaveBeenCalledWith('Successfully added 4 URLs')
  })

  it('flags a duplicate within a pasted list instead of collapsing it', async () => {
    const user = userEvent.setup()

    render(<AddNewURLModal visible allowList={[]} onClose={vi.fn()} />)

    await screen.findByRole('dialog')

    await user.click(screen.getByPlaceholderText('https://mydomain.com'))
    await user.paste('https://a.example.com\nhttps://a.example.com')

    expect(screen.getAllByPlaceholderText('https://mydomain.com')).toHaveLength(2)

    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)

    expect(await screen.findByText('URL already exists in this list')).toBeInTheDocument()
    expect(mutateMock).not.toHaveBeenCalled()
  })

  it.each(SUPPORTED_URL_FORMS)('leaves the supported URL form %s on one row', async (url) => {
    const user = userEvent.setup()

    expect(urlRegex().test(url)).toBe(true)

    render(<AddNewURLModal visible allowList={[]} onClose={vi.fn()} />)

    await screen.findByRole('dialog')

    await user.click(screen.getByPlaceholderText('https://mydomain.com'))
    await user.paste(url)

    const inputs = screen.getAllByPlaceholderText('https://mydomain.com') as HTMLInputElement[]
    expect(inputs).toHaveLength(1)
    expect(inputs[0].value).toBe(url)
  })

  it('splits a list of every supported URL form back into that list', async () => {
    const user = userEvent.setup()

    render(<AddNewURLModal visible allowList={[]} onClose={vi.fn()} />)

    await screen.findByRole('dialog')

    await user.click(screen.getByPlaceholderText('https://mydomain.com'))
    await user.paste(SUPPORTED_URL_FORMS.join('\n'))

    const values = (
      screen.getAllByPlaceholderText('https://mydomain.com') as HTMLInputElement[]
    ).map((input) => input.value)

    expect(values).toEqual(SUPPORTED_URL_FORMS)
    values.forEach((value) => expect(urlRegex().test(value)).toBe(true))
  })

  it('validates each pasted URL on its own row', async () => {
    const user = userEvent.setup()

    render(
      <AddNewURLModal visible allowList={['https://existing.example.com']} onClose={vi.fn()} />
    )

    await screen.findByRole('dialog')

    await user.click(screen.getByPlaceholderText('https://mydomain.com'))
    await user.paste('https://a.example.com https://existing.example.com')

    expect(screen.getAllByPlaceholderText('https://mydomain.com')).toHaveLength(2)

    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)

    expect(await screen.findByText('URL already exists in the allow list')).toBeInTheDocument()
    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('rejects a trailing-comma URL when it already exists in the allow list', async () => {
    const user = userEvent.setup()

    render(
      <AddNewURLModal visible allowList={['https://existing.example.com']} onClose={vi.fn()} />
    )

    await screen.findByRole('dialog')

    await user.type(
      screen.getByPlaceholderText('https://mydomain.com'),
      'https://existing.example.com,'
    )

    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)

    expect(await screen.findByText('URL already exists in the allow list')).toBeInTheDocument()
    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('rejects a whitespace-padded URL when it already exists in the allow list', async () => {
    const user = userEvent.setup()

    render(
      <AddNewURLModal visible allowList={['https://existing.example.com']} onClose={vi.fn()} />
    )

    await screen.findByRole('dialog')

    await user.type(
      screen.getByPlaceholderText('https://mydomain.com'),
      ' https://existing.example.com '
    )

    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)

    expect(await screen.findByText('URL already exists in the allow list')).toBeInTheDocument()
    expect(mutateMock).not.toHaveBeenCalled()
  })
})
