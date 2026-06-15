import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { OrganizationInvite } from '@/components/interfaces/OrganizationInvite/OrganizationInvite'
import type { OrganizationInviteByToken } from '@/data/organization-members/organization-invitation-token-query'
import type { ProfileContextType } from '@/lib/profile'
import { render } from '@/tests/helpers'
import type { ResponseError } from '@/types'

const mocks = vi.hoisted(() => ({
  isLoggedIn: vi.fn(),
  useParams: vi.fn(),
  useProfile: vi.fn(),
  useProfileNameAndPicture: vi.fn(),
  useIsFeatureEnabled: vi.fn(),
  useInvitationQuery: vi.fn(),
  useAcceptInvitationMutation: vi.fn(),
  acceptInvitation: vi.fn(),
  signOut: vi.fn(),
  routerPush: vi.fn(),
  routerReload: vi.fn(),
}))

vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return {
    ...actual,
    useIsLoggedIn: mocks.isLoggedIn,
    useParams: mocks.useParams,
  }
})

vi.mock('next/router', () => ({
  useRouter: () => ({
    isReady: true,
    push: mocks.routerPush,
    reload: mocks.routerReload,
  }),
}))

vi.mock('@/lib/profile', () => ({
  useProfile: mocks.useProfile,
  useProfileNameAndPicture: mocks.useProfileNameAndPicture,
}))

vi.mock('@/lib/auth', () => ({
  useSignOut: () => mocks.signOut,
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mocks.useIsFeatureEnabled,
}))

vi.mock('@/data/organization-members/organization-invitation-token-query', () => ({
  useOrganizationInvitationTokenQuery: mocks.useInvitationQuery,
}))

vi.mock('@/data/organization-members/organization-invitation-accept-mutation', () => ({
  useOrganizationAcceptInvitationMutation: mocks.useAcceptInvitationMutation,
}))

const READY_INVITE: OrganizationInviteByToken = {
  authorized_user: true,
  email_match: true,
  expired_token: false,
  invite_id: 42,
  organization_name: 'Acme Corp',
  sso_mismatch: false,
  token_does_not_exist: false,
}

const PROFILE: ProfileContextType['profile'] = {
  id: 1,
  auth0_id: 'auth0|test',
  gotrue_id: 'gotrue-test',
  username: 'jane',
  primary_email: 'jane@acmecorp.io',
  first_name: null,
  last_name: null,
  mobile: null,
  is_alpha_user: false,
  is_sso_user: false,
  disabled_features: [],
  free_project_limit: null,
}

const responseError = (message: string, code = 500) => ({ message, code }) as ResponseError

function setSignedInDefaults() {
  mocks.isLoggedIn.mockReturnValue(true)
  mocks.useParams.mockReturnValue({ slug: 'acme-corp', token: 'invite-token' })
  mocks.useProfile.mockReturnValue({
    profile: PROFILE,
    isLoading: false,
  })
  mocks.useProfileNameAndPicture.mockReturnValue({
    username: 'jane',
    primaryEmail: 'jane@acmecorp.io',
    avatarUrl: undefined,
    isLoading: false,
  })
  mocks.useIsFeatureEnabled.mockReturnValue(true)
  mocks.useInvitationQuery.mockReturnValue({
    data: READY_INVITE,
    error: null,
    isSuccess: true,
    isError: false,
    isPending: false,
  })
  mocks.useAcceptInvitationMutation.mockReturnValue({
    mutate: mocks.acceptInvitation,
    isPending: false,
  })
}

describe('OrganizationInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setSignedInDefaults()
  })

  test('renders sign-in actions for signed-out users', () => {
    mocks.isLoggedIn.mockReturnValue(false)
    mocks.useProfile.mockReturnValue({ profile: null, isLoading: true })
    mocks.useProfileNameAndPicture.mockReturnValue({
      username: undefined,
      primaryEmail: undefined,
      avatarUrl: undefined,
      isLoading: false,
    })

    render(<OrganizationInvite />)

    expect(screen.getByText('View invitation')).toBeInTheDocument()
    expect(
      screen.getByText('Sign in or create an account to view this invitation')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in?returnTo=%2Fjoin%3Ftoken%3Dinvite-token%26slug%3Dacme-corp'
    )
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/sign-up?returnTo=%2Fjoin%3Ftoken%3Dinvite-token%26slug%3Dacme-corp'
    )
  })

  test('renders a ready invite for the signed-in account', () => {
    render(<OrganizationInvite />)

    expect(screen.getByText('Join Acme Corp')).toBeInTheDocument()
    expect(
      screen.getByText('You have been invited to join this Supabase organization')
    ).toBeInTheDocument()
    expect(screen.getByText('Signed in as')).toBeInTheDocument()
    expect(screen.getByText('jane@acmecorp.io')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accept invite' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Decline' })).toHaveAttribute('href', '/projects')
  })

  test('accepts an invite with the current slug and token', async () => {
    const user = userEvent.setup()

    render(<OrganizationInvite />)

    await user.click(screen.getByRole('button', { name: 'Accept invite' }))

    expect(mocks.acceptInvitation).toHaveBeenCalledWith({
      slug: 'acme-corp',
      token: 'invite-token',
    })
  })

  test('renders a wrong-account warning and signs out', async () => {
    const user = userEvent.setup()
    mocks.useInvitationQuery.mockReturnValue({
      data: { ...READY_INVITE, email_match: false },
      error: null,
      isSuccess: true,
      isError: false,
      isPending: false,
    })
    mocks.signOut.mockResolvedValue(undefined)

    render(<OrganizationInvite />)

    expect(screen.getByText('Wrong account')).toBeInTheDocument()
    expect(screen.queryByText('Join Acme Corp')).not.toBeInTheDocument()
    expect(
      screen.queryByText('You have been invited to join this Supabase organization')
    ).not.toBeInTheDocument()
    expect(screen.getByText(/jane@acmecorp\.io/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalled())
    expect(mocks.routerReload).toHaveBeenCalled()
  })

  test('renders no-longer-valid, invalid lookup, and generic error states', () => {
    mocks.useInvitationQuery.mockReturnValueOnce({
      data: undefined,
      error: responseError('Failed to retrieve organization', 401),
      isSuccess: false,
      isError: true,
      isPending: false,
    })

    const { rerender } = render(<OrganizationInvite />)

    expect(screen.getByText('Invite no longer available')).toBeInTheDocument()
    expect(
      screen.getByText('This invite has already been accepted or declined.')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute('href', '/')

    mocks.useInvitationQuery.mockReturnValueOnce({
      data: undefined,
      error: responseError('Not Found', 404),
      isSuccess: false,
      isError: true,
      isPending: false,
    })

    rerender(<OrganizationInvite />)

    expect(screen.getByText('Invite invalid')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Open the full invite link again, or ask the organization owner for a new invite.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Not Found')).not.toBeInTheDocument()

    mocks.useInvitationQuery.mockReturnValueOnce({
      data: undefined,
      error: responseError('Failed to retrieve token', 500),
      isSuccess: false,
      isError: true,
      isPending: false,
    })

    rerender(<OrganizationInvite />)

    expect(screen.getByText('Unable to load invitation')).toBeInTheDocument()
    expect(screen.getByText('Failed to retrieve token')).toBeInTheDocument()
  })
})
