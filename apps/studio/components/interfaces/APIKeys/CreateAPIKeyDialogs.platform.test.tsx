import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreatePublishableAPIKeyDialog } from './CreatePublishableAPIKeyDialog'
import { CreateSecretAPIKeyDialog } from './CreateSecretAPIKeyDialog'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { customRender as render } from '@/tests/lib/custom-render'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import { NO_PERMISSIONS } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

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

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'project-ref' }) }
})

const profileContext = createMockProfileContext()

describe('API key create dialogs', () => {
  beforeEach(() => {
    mockUseQueryState.mockReturnValue(['', mockSetVisible])
    mockProjectGrantContext({ ref: 'project-ref' })
  })

  it('registers and surfaces the publishable key shortcut on the visible trigger', async () => {
    const user = userEvent.setup()

    render(<CreatePublishableAPIKeyDialog />, { profileContext })

    expect(mockShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SHORTCUT_IDS.API_KEYS_NEW_PUBLISHABLE,
        onTrigger: expect.any(Function),
      }),
      undefined
    )

    const trigger = screen.getByRole('button', { name: 'New publishable key' })
    await waitFor(() => expect(trigger).toBeEnabled())
    await user.click(trigger)

    expect(mockSetVisible).toHaveBeenCalledWith('publishable')
  })

  it('registers and surfaces the publishable key submit shortcut on the primary action', () => {
    mockUseQueryState.mockReturnValue(['publishable', mockSetVisible])

    render(<CreatePublishableAPIKeyDialog />, { profileContext })

    expect(mockShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SHORTCUT_IDS.API_KEYS_CREATE_PUBLISHABLE,
        onTrigger: expect.any(Function),
        options: { enabled: true },
      }),
      undefined
    )
    expect(screen.getByRole('button', { name: 'Create Publishable API key' })).toBeInTheDocument()
  })

  it('registers and surfaces the secret key shortcut on the visible trigger', async () => {
    const user = userEvent.setup()

    render(<CreateSecretAPIKeyDialog />, { profileContext })

    expect(mockShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SHORTCUT_IDS.API_KEYS_NEW_SECRET,
        onTrigger: expect.any(Function),
      }),
      undefined
    )

    const trigger = screen.getByRole('button', { name: 'New secret key' })
    await waitFor(() => expect(trigger).toBeEnabled())
    await user.click(trigger)

    expect(mockSetVisible).toHaveBeenCalledWith('secret')
  })

  it('registers and surfaces the secret key submit shortcut on the primary action', () => {
    mockUseQueryState.mockReturnValue(['secret', mockSetVisible])

    render(<CreateSecretAPIKeyDialog />, { profileContext })

    expect(mockShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SHORTCUT_IDS.API_KEYS_CREATE_SECRET,
        onTrigger: expect.any(Function),
        options: { enabled: true },
      }),
      undefined
    )
    expect(screen.getByRole('button', { name: 'Create API key' })).toBeInTheDocument()
  })

  it.each([
    {
      name: 'denied',
      setup: () => mockProjectGrantContext({ ref: 'project-ref', permissions: NO_PERMISSIONS }),
    },
    { name: 'a permission-check error', setup: () => mockPermissionsError() },
  ])('keeps the create triggers disabled when the grant is $name', async ({ setup }) => {
    mockProjectGrantContext({ ref: 'project-ref' })
    setup()
    const user = userEvent.setup()

    render(<CreatePublishableAPIKeyDialog />, { profileContext })
    render(<CreateSecretAPIKeyDialog />, { profileContext })

    const publishable = screen.getByRole('button', { name: 'New publishable key' })
    const secret = screen.getByRole('button', { name: 'New secret key' })
    await waitFor(() => expect(publishable).toBeDisabled())
    expect(secret).toBeDisabled()

    await user.click(publishable)
    await user.click(secret)
    expect(mockSetVisible).not.toHaveBeenCalled()
  })

  it('disables the submit button when the grant is denied', async () => {
    mockProjectGrantContext({ ref: 'project-ref', permissions: NO_PERMISSIONS })
    mockUseQueryState.mockReturnValue(['secret', mockSetVisible])

    render(<CreateSecretAPIKeyDialog />, { profileContext })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create API key' })).toBeDisabled()
    )
  })
})
