import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AddNewURLModal } from './AddNewURLModal'
import { render } from '@/tests/helpers'

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
    vi.clearAllMocks()
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

  it('dedupes URLs after normalising a trailing comma before submitting', async () => {
    const user = userEvent.setup()
    mutateMock.mockImplementation((_vars, callbacks) => callbacks?.onSuccess?.())

    render(<AddNewURLModal visible allowList={[]} onClose={vi.fn()} />)

    await screen.findByRole('dialog')

    await user.type(screen.getByPlaceholderText('https://mydomain.com'), 'https://app.example.com')
    await user.click(screen.getByRole('button', { name: 'Add URL' }))

    const urlInputs = screen.getAllByPlaceholderText('https://mydomain.com')
    await user.type(urlInputs[1], 'https://app.example.com,')

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
})
