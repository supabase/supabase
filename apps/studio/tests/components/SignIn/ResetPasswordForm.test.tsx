import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResetPasswordForm } from '@/components/interfaces/SignIn/ResetPasswordForm'
import { render } from '@/tests/helpers'

const { mockUseUser, mockUseParams, mockUpdateUser, mockSignOut } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockUseParams: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockSignOut: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    useUser: mockUseUser,
    useParams: mockUseParams,
  }
})

vi.mock('@/lib/gotrue', () => ({
  auth: {
    updateUser: mockUpdateUser,
    signOut: mockSignOut,
  },
  getReturnToPath: (path: string) => path,
}))

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('ResetPasswordForm Component', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockUpdateUser.mockResolvedValue({ error: null })
    mockSignOut.mockResolvedValue({ error: null })
  })

  it('requires current password if type is change and user has a password', async () => {
    mockUseParams.mockReturnValue({ type: 'change' })
    mockUseUser.mockReturnValue({
      app_metadata: { provider: 'email' },
      user_metadata: {},
    })

    const { container } = render(<ResetPasswordForm />)

    expect(container.querySelector('#currentPassword')).toBeInTheDocument()
    expect(container.querySelector('#password')).toBeInTheDocument()
  })

  it('does not require current password if type is change but user has no password', () => {
    mockUseParams.mockReturnValue({ type: 'change' })
    mockUseUser.mockReturnValue({
      app_metadata: { provider: 'github' },
      user_metadata: { has_password: false },
    })

    const { container } = render(<ResetPasswordForm />)

    expect(container.querySelector('#currentPassword')).not.toBeInTheDocument()
    expect(container.querySelector('#password')).toBeInTheDocument()
  })

  it('sets has_password metadata flag when setting a new password', async () => {
    mockUseParams.mockReturnValue({ type: 'change' })
    mockUseUser.mockReturnValue({
      app_metadata: { provider: 'github' },
      user_metadata: { has_password: false },
    })

    const { container } = render(<ResetPasswordForm />)

    const passwordInput = container.querySelector('#password') as HTMLInputElement
    // Set a valid password (must satisfy conditions: 8+ chars, uppercase, lowercase, digit, spec char)
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } })

    const submitButton = screen.getByRole('button', { name: 'Save new password' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'Secret123!',
        data: { has_password: true },
      })
    })
  })
})
