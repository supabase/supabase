import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreatePublishableAPIKeyDialog } from './CreatePublishableAPIKeyDialog'
import { CreateSecretAPIKeyDialog } from './CreateSecretAPIKeyDialog'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const { mockSetVisible, mockShortcut, mockUseQueryState } = vi.hoisted(() => ({
  mockSetVisible: vi.fn(),
  mockShortcut: vi.fn(({ children }: any) => <div data-testid="shortcut">{children}</div>),
  mockUseQueryState: vi.fn(),
}))

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation')
  return {
    ...actual,
    useParams: () => ({ ref: 'project-ref' }),
  }
})

vi.mock('nuqs', async () => {
  const actual = await vi.importActual<typeof import('nuqs')>('nuqs')
  return {
    ...actual,
    useQueryState: mockUseQueryState,
  }
})

vi.mock('@/components/ui/Shortcut', () => ({
  Shortcut: mockShortcut,
}))

vi.mock('@/data/api-keys/api-key-create-mutation', () => ({
  useAPIKeyCreateMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('API key create dialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQueryState.mockReturnValue(['', mockSetVisible])
  })

  it('registers and surfaces the publishable key shortcut on the visible trigger', async () => {
    const user = userEvent.setup()

    render(<CreatePublishableAPIKeyDialog />)

    expect(mockShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SHORTCUT_IDS.API_KEYS_NEW_PUBLISHABLE,
        onTrigger: expect.any(Function),
        side: 'bottom',
      }),
      undefined
    )

    await user.click(screen.getByRole('button', { name: 'New publishable key' }))

    expect(mockSetVisible).toHaveBeenCalledWith('publishable')
  })

  it('registers and surfaces the publishable key submit shortcut on the primary action', () => {
    mockUseQueryState.mockReturnValue(['publishable', mockSetVisible])

    render(<CreatePublishableAPIKeyDialog />)

    expect(mockShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SHORTCUT_IDS.API_KEYS_CREATE_PUBLISHABLE,
        onTrigger: expect.any(Function),
        options: { enabled: true },
        side: 'top',
      }),
      undefined
    )
    expect(screen.getByRole('button', { name: 'Create Publishable API key' })).toBeInTheDocument()
  })

  it('registers and surfaces the secret key shortcut on the visible trigger', async () => {
    const user = userEvent.setup()

    render(<CreateSecretAPIKeyDialog />)

    expect(mockShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SHORTCUT_IDS.API_KEYS_NEW_SECRET,
        onTrigger: expect.any(Function),
        side: 'bottom',
      }),
      undefined
    )

    await user.click(screen.getByRole('button', { name: 'New secret key' }))

    expect(mockSetVisible).toHaveBeenCalledWith('secret')
  })

  it('registers and surfaces the secret key submit shortcut on the primary action', () => {
    mockUseQueryState.mockReturnValue(['secret', mockSetVisible])

    render(<CreateSecretAPIKeyDialog />)

    expect(mockShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SHORTCUT_IDS.API_KEYS_CREATE_SECRET,
        onTrigger: expect.any(Function),
        options: { enabled: true },
        side: 'top',
      }),
      undefined
    )
    expect(screen.getByRole('button', { name: 'Create API key' })).toBeInTheDocument()
  })
})
