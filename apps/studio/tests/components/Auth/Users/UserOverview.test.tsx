import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, describe, vi, beforeEach } from 'vitest'

import { UserOverview } from 'components/interfaces/Auth/Users/UserOverview'
import { User } from 'data/auth/users-infinite-query'
import { render } from 'tests/helpers'

// Mock the hooks used by UserOverview
vi.mock('data/auth/auth-config-query', () => ({
  useAuthConfigQuery: vi.fn(() => ({
    data: {
      MAILER_OTP_EXP: 3600, // 1 hour
    },
  })),
}))

vi.mock('data/auth/user-send-magic-link-mutation', () => ({
  useUserSendMagicLinkMutation: vi.fn((options) => ({
    mutate: vi.fn((vars) => {
      if (options?.onSuccess) {
        options.onSuccess(null, vars)
      }
    }),
    isLoading: false,
  })),
}))

vi.mock('data/auth/user-send-confirmation-mutation', () => ({
  useUserSendConfirmationMutation: vi.fn((options) => ({
    mutate: vi.fn((vars) => {
      if (options?.onSuccess) {
        options.onSuccess(null, vars)
      }
    }),
    isLoading: false,
  })),
}))

vi.mock('data/auth/user-reset-password-mutation', () => ({
  useUserResetPasswordMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
}))

vi.mock('data/auth/user-send-otp-mutation', () => ({
  useUserSendOTPMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
}))

vi.mock('data/auth/user-delete-mfa-factors-mutation', () => ({
  useUserDeleteMFAFactorsMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}))

vi.mock('data/auth/user-update-mutation', () => ({
  useUserUpdateMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
}))

vi.mock('hooks/misc/useCheckPermissions', () => ({
  useCheckPermissions: vi.fn(() => true), // Allow all permissions for tests
}))

vi.mock('common', () => ({
  useParams: vi.fn(() => ({ ref: 'test-project-ref' })),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('UserOverview Magic Link Context-Aware Functionality', () => {
  const mockOnDeleteSuccess = vi.fn()

  const createMockUser = (confirmed: boolean): User => ({
    id: 'test-user-id',
    email: 'test@example.com',
    phone: undefined,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    confirmed_at: confirmed ? '2023-01-01T01:00:00Z' : undefined,
    last_sign_in_at: undefined,
    invited_at: undefined,
    confirmation_sent_at: undefined,
    banned_until: undefined,
    is_sso_user: false,
    raw_app_meta_data: {
      providers: ['email'],
    },
    providers: ['email'],
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Confirmed User (user.confirmed_at is truthy)', () => {
    test('shows "Send magic link" button text for confirmed user', () => {
      const confirmedUser = createMockUser(true)
      
      render(<UserOverview user={confirmedUser} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument()
      expect(screen.getByText('Passwordless login via email for the user')).toBeInTheDocument()
    })

    test('shows "Send magic link" button with correct title', () => {
      const confirmedUser = createMockUser(true)
      
      render(<UserOverview user={confirmedUser} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      const button = screen.getByRole('button', { name: /send magic link/i })
      expect(button).toBeInTheDocument()
    })

    test('displays success message "Magic link sent" for confirmed user', async () => {
      const confirmedUser = createMockUser(true)
      
      render(<UserOverview user={confirmedUser} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      const button = screen.getByRole('button', { name: /send magic link/i })
      await userEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Magic link sent')).toBeInTheDocument()
      })
    })
  })

  describe('Unconfirmed User (user.confirmed_at is null)', () => {
    test('shows "Confirm sign up link" button text for unconfirmed user', () => {
      const unconfirmedUser = createMockUser(false)
      
      render(<UserOverview user={unconfirmedUser} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      expect(screen.getByText('Confirm sign up link')).toBeInTheDocument()
      expect(screen.getByText('Send email confirmation link for user signup')).toBeInTheDocument()
    })

    test('shows "Send confirmation link" title for unconfirmed user', () => {
      const unconfirmedUser = createMockUser(false)
      
      render(<UserOverview user={unconfirmedUser} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      expect(screen.getByText('Send confirmation link')).toBeInTheDocument()
    })

    test('shows "Confirm sign up link" button with correct text', () => {
      const unconfirmedUser = createMockUser(false)
      
      render(<UserOverview user={unconfirmedUser} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      const button = screen.getByRole('button', { name: /confirm sign up link/i })
      expect(button).toBeInTheDocument()
    })

    test('displays success message "Confirmation link sent" for unconfirmed user', async () => {
      const unconfirmedUser = createMockUser(false)
      
      render(<UserOverview user={unconfirmedUser} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      const button = screen.getByRole('button', { name: /confirm sign up link/i })
      await userEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Confirmation link sent')).toBeInTheDocument()
      })
    })
  })

  describe('Button Functionality', () => {
    test('calls sendMagicLink mutation when button is clicked for confirmed user', async () => {
      const mockMutate = vi.fn()
      const { useUserSendMagicLinkMutation } = await import('data/auth/user-send-magic-link-mutation')
      
      vi.mocked(useUserSendMagicLinkMutation).mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        status: 'idle',
        variables: undefined,
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        mutateAsync: vi.fn(),
        reset: vi.fn(),
      } as any)

      const confirmedUser = createMockUser(true)
      
      render(<UserOverview user={confirmedUser} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      const button = screen.getByRole('button', { name: /send magic link/i })
      await userEvent.click(button)
      
      expect(mockMutate).toHaveBeenCalledWith({
        projectRef: 'test-project-ref',
        user: confirmedUser,
      })
    })

    test('calls sendConfirmation mutation when button is clicked for unconfirmed user', async () => {
      const mockMutate = vi.fn()
      const { useUserSendConfirmationMutation } = await import('data/auth/user-send-confirmation-mutation')
      
      vi.mocked(useUserSendConfirmationMutation).mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        status: 'idle',
        variables: undefined,
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        mutateAsync: vi.fn(),
        reset: vi.fn(),
      } as any)

      const unconfirmedUser = createMockUser(false)
      
      render(<UserOverview user={unconfirmedUser} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      const button = screen.getByRole('button', { name: /confirm sign up link/i })
      await userEvent.click(button)
      
      expect(mockMutate).toHaveBeenCalledWith({
        projectRef: 'test-project-ref',
        user: unconfirmedUser,
      })
    })
  })

  describe('Toast Messages', () => {
    test('shows correct success toast for confirmed user', async () => {
      const { toast } = await import('sonner')
      const confirmedUser = createMockUser(true)
      
      render(<UserOverview user={confirmedUser} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      const button = screen.getByRole('button', { name: /send magic link/i })
      await userEvent.click(button)
      
      expect(toast.success).toHaveBeenCalledWith('Sent magic link to test@example.com')
    })

    test('shows correct success toast for unconfirmed user', async () => {
      const { toast } = await import('sonner')
      const unconfirmedUser = createMockUser(false)
      
      render(<UserOverview user={unconfirmedUser} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      const button = screen.getByRole('button', { name: /confirm sign up link/i })
      await userEvent.click(button)
      
      expect(toast.success).toHaveBeenCalledWith('Sent confirmation link to test@example.com')
    })
  })

  describe('Success State Behavior', () => {
    test('shows success state after button click', async () => {
      const confirmedUser = createMockUser(true)
      
      render(<UserOverview user={confirmedUser} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      const button = screen.getByRole('button', { name: /send magic link/i })
      await userEvent.click(button)
      
      // Should show success state
      await waitFor(() => {
        expect(screen.getByText('Magic link sent')).toBeInTheDocument()
      })
    })
  })

  describe('User without email', () => {
    test('does not show magic link section for user without email', () => {
      const userWithoutEmail: User = {
        ...createMockUser(true),
        email: null as any, // Allow null for test
      }
      
      render(<UserOverview user={userWithoutEmail} onDeleteSuccess={mockOnDeleteSuccess} />)
      
      expect(screen.queryByRole('button', { name: /send magic link/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /confirm sign up link/i })).not.toBeInTheDocument()
    })
  })
})