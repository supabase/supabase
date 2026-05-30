import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountIdentities } from '@/components/interfaces/Account/Preferences/AccountIdentities'
import { render } from '@/tests/helpers'

const { mockUseUser, mockUseProfileIdentitiesQuery, mockUseUnlinkIdentityMutation } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockUseProfileIdentitiesQuery: vi.fn(),
  mockUseUnlinkIdentityMutation: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    useUser: mockUseUser,
  }
})

vi.mock('@/data/profile/profile-identities-query', () => ({
  useProfileIdentitiesQuery: mockUseProfileIdentitiesQuery,
}))

vi.mock('@/data/profile/profile-unlink-identity-mutation', () => ({
  useUnlinkIdentityMutation: mockUseUnlinkIdentityMutation,
}))

vi.mock('next/router', () => ({
  useRouter: () => ({
    asPath: '',
  }),
}))

describe('AccountIdentities Component', () => {
  const mockMutate = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    mockUseUnlinkIdentityMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })
  })

  it('renders identities list correctly', () => {
    mockUseUser.mockReturnValue({
      app_metadata: { provider: 'github' },
      user_metadata: {},
    })

    mockUseProfileIdentitiesQuery.mockReturnValue({
      data: {
        identities: [
          { identity_id: '1', provider: 'github', email: 'user@example.com' },
          { identity_id: '2', provider: 'email', email: 'user@example.com' },
        ],
      },
      isPending: false,
      isSuccess: true,
    })

    render(<AccountIdentities />)

    expect(screen.getByText(/github/i)).toBeInTheDocument()
    expect(screen.getByText(/email/i)).toBeInTheDocument()
  })

  it('disables the Unlink button for the last OAuth identity when the user has no password set', async () => {
    mockUseUser.mockReturnValue({
      app_metadata: { provider: 'github' },
      user_metadata: { has_password: false },
    })

    mockUseProfileIdentitiesQuery.mockReturnValue({
      data: {
        identities: [
          { identity_id: '1', provider: 'github', email: 'user@example.com' },
          { identity_id: '2', provider: 'email', email: 'user@example.com' },
        ],
      },
      isPending: false,
      isSuccess: true,
    })

    render(<AccountIdentities />)

    // Locate the Unlink button (associated with github identity)
    // The email identity doesn't have an unlink button because length > 1 but wait, in AccountIdentities it shows unlink for all if identities.length > 1 except email, wait, email provider doesn't show unlink button:
    // Let's check AccountIdentities.tsx line 153:
    // `identities.length > 1 && ...` is rendered for all. Wait, yes, the Unlink button is rendered for email too if identities.length > 1.
    // However, github has isLastOAuthWithoutPassword = true, so it is disabled.
    // Let's inspect the buttons inside the card
    const buttons = screen.getAllByRole('button')
    const githubUnlinkButton = buttons.find((btn) => btn.getAttribute('disabled') === '')
    expect(githubUnlinkButton).toBeDefined()
  })

  it('enables the Unlink button when the user has set a password', () => {
    mockUseUser.mockReturnValue({
      app_metadata: { provider: 'github' },
      user_metadata: { has_password: true },
    })

    mockUseProfileIdentitiesQuery.mockReturnValue({
      data: {
        identities: [
          { identity_id: '1', provider: 'github', email: 'user@example.com' },
          { identity_id: '2', provider: 'email', email: 'user@example.com' },
        ],
      },
      isPending: false,
      isSuccess: true,
    })

    render(<AccountIdentities />)

    const buttons = screen.getAllByRole('button')
    const disabledButtons = buttons.filter((btn) => btn.hasAttribute('disabled'))
    expect(disabledButtons.length).toBe(0)
  })

  it('enables the Unlink button when there are multiple OAuth providers even without a password', () => {
    mockUseUser.mockReturnValue({
      app_metadata: { provider: 'github' },
      user_metadata: { has_password: false },
    })

    mockUseProfileIdentitiesQuery.mockReturnValue({
      data: {
        identities: [
          { identity_id: '1', provider: 'github', email: 'user@example.com' },
          { identity_id: '2', provider: 'google', email: 'user@example.com' },
          { identity_id: '3', provider: 'email', email: 'user@example.com' },
        ],
      },
      isPending: false,
      isSuccess: true,
    })

    render(<AccountIdentities />)

    const buttons = screen.getAllByRole('button')
    const disabledButtons = buttons.filter((btn) => btn.hasAttribute('disabled'))
    expect(disabledButtons.length).toBe(0)
  })

  it('opens confirmation modal and displays deduplicated remaining providers list', async () => {
    mockUseUser.mockReturnValue({
      app_metadata: { provider: 'github' },
      user_metadata: { has_password: true },
    })

    mockUseProfileIdentitiesQuery.mockReturnValue({
      data: {
        identities: [
          { identity_id: '1', provider: 'github', email: 'user1@example.com' },
          { identity_id: '2', provider: 'github', email: 'user2@example.com' },
          { identity_id: '3', provider: 'email', email: 'user@example.com' },
        ],
      },
      isPending: false,
      isSuccess: true,
    })

    const { fireEvent } = await import('@testing-library/react')
    render(<AccountIdentities />)

    // Locate the first GitHub identity card content
    const emailElement = screen.getByText('user1@example.com')
    const cardContent = emailElement.closest('.flex.justify-between')
    expect(cardContent).toBeInTheDocument()

    const buttons = cardContent!.querySelectorAll('button')
    // For GitHub provider: Edit is buttons[0], Unlink is buttons[1]
    const unlinkButton = buttons[1]
    expect(unlinkButton).toBeInTheDocument()

    // Click Unlink to open confirmation modal
    fireEvent.click(unlinkButton)

    // Verify modal title is displayed
    expect(screen.getByText(/confirm to disconnect your github identity/i)).toBeInTheDocument()

    // Verify warning description contains remaining providers, deduplicated
    expect(
      screen.getByText(/after disconnecting, you will only be able to sign in via GitHub or email and password/i)
    ).toBeInTheDocument()
  })

  it('displays correct description when unlinking an OAuth provider and user has no password', async () => {
    mockUseUser.mockReturnValue({
      app_metadata: { provider: 'github' },
      user_metadata: { has_password: false },
    })

    mockUseProfileIdentitiesQuery.mockReturnValue({
      data: {
        identities: [
          { identity_id: '1', provider: 'github', email: 'user1@example.com' },
          { identity_id: '2', provider: 'github', email: 'user2@example.com' },
          { identity_id: '3', provider: 'email', email: 'user@example.com' },
        ],
      },
      isPending: false,
      isSuccess: true,
    })

    const { fireEvent } = await import('@testing-library/react')
    render(<AccountIdentities />)

    const emailElement = screen.getByText('user1@example.com')
    const cardContent = emailElement.closest('.flex.justify-between')
    const unlinkButton = cardContent!.querySelectorAll('button')[1]

    fireEvent.click(unlinkButton)

    expect(
      screen.getByText(/after disconnecting, you will only be able to sign in via GitHub or email \(recovery\/reset password\)/i)
    ).toBeInTheDocument()
  })
})
