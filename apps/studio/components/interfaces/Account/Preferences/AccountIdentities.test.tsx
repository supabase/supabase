import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AccountIdentities } from './AccountIdentities'
import { BASE_PATH } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

// Radix Dialog relies on the Web Animations API, which jsdom lacks.
mockAnimationsApi()

const { getUserMock, updateUserMock, refreshSessionMock, signOutMock, useFlagMock } = vi.hoisted(
  () => ({
    getUserMock: vi.fn(),
    updateUserMock: vi.fn(),
    refreshSessionMock: vi.fn(),
    signOutMock: vi.fn(),
    useFlagMock: vi.fn(),
  })
)

// Overrides the global partial mock from vitestSetup, so re-apply `useParams` alongside `useFlag`.
vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ ref: 'default' }),
    useFlag: useFlagMock,
  }
})

vi.mock('@/lib/gotrue', () => ({
  auth: {
    getUser: getUserMock,
    updateUser: updateUserMock,
    refreshSession: refreshSessionMock,
    signOut: signOutMock,
  },
  buildPathWithParams: (path: string) => path,
}))

const EMAIL = 'user@example.com'
const VALID_PASSWORD = 'Str0ng!password'

type IdentityFixture = {
  identity_id: string
  id: string
  user_id: string
  provider: string
  identity_data: Record<string, string>
  email: string
}

const githubIdentity: IdentityFixture = {
  identity_id: 'github-identity-id',
  id: 'github-user-id',
  user_id: 'user-id',
  provider: 'github',
  identity_data: { user_name: 'testuser' },
  email: EMAIL,
}

const emailIdentity: IdentityFixture = {
  identity_id: 'email-identity-id',
  id: 'user-id',
  user_id: 'user-id',
  provider: 'email',
  identity_data: {},
  email: EMAIL,
}

const ssoIdentity: IdentityFixture = {
  identity_id: 'sso-identity-id',
  id: 'sso-user-id',
  user_id: 'user-id',
  provider: 'sso:4d21b3cf-3a2f-44d3-b7d6-2b0dd393f671',
  identity_data: {},
  email: EMAIL,
}

const mockGetUser = (identities: IdentityFixture[]) => {
  getUserMock.mockResolvedValue({
    data: { user: { id: 'user-id', email: EMAIL, identities } },
    error: null,
  })
}

const renderAccountIdentities = () => {
  mswServer.use(
    http.get(`${BASE_PATH}/api/enabled-features-overrides`, () =>
      HttpResponse.json({ disabled_features: [] })
    )
  )

  return customRender(<AccountIdentities />)
}

const openAddPasswordDialog = async () => {
  const openButton = await screen.findByRole('button', { name: 'Add password' })
  fireEvent.click(openButton)

  return await screen.findByRole('dialog')
}

describe('AccountIdentities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    refreshSessionMock.mockResolvedValue({ data: {}, error: null })
    signOutMock.mockResolvedValue({ error: null })
    useFlagMock.mockImplementation((name: string) => name === 'enableAccountPassword')
  })

  it('offers to add a password when the user only has OAuth identities', async () => {
    mockGetUser([githubIdentity])

    renderAccountIdentities()

    expect(await screen.findByRole('button', { name: 'Add password' })).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Change password' })).not.toBeInTheDocument()
  })

  it('does not offer to add a password when an email identity exists', async () => {
    mockGetUser([githubIdentity, emailIdentity])

    renderAccountIdentities()

    expect(await screen.findByRole('link', { name: 'Change password' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add password' })).not.toBeInTheDocument()
  })

  it('does not offer to add a password when the feature flag is disabled', async () => {
    useFlagMock.mockReturnValue(false)
    mockGetUser([githubIdentity])

    renderAccountIdentities()

    expect(await screen.findByText('GitHub')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add password' })).not.toBeInTheDocument()
    expect(screen.queryByText('Email')).not.toBeInTheDocument()
  })

  it('does not offer to add a password to SSO users', async () => {
    mockGetUser([ssoIdentity])

    renderAccountIdentities()

    expect(await screen.findByText('SSO')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add password' })).not.toBeInTheDocument()
  })

  it('adds a password and flips the row to the email identity actions', async () => {
    mockGetUser([githubIdentity])
    updateUserMock.mockImplementation(async () => {
      // GoTrue creates the email identity when the password is set, so the
      // post-mutation refetch sees both identities.
      mockGetUser([githubIdentity, emailIdentity])
      return { data: { user: { id: 'user-id', email: EMAIL } }, error: null }
    })

    renderAccountIdentities()
    const dialog = await openAddPasswordDialog()

    const emailInput = within(dialog).getByLabelText('Email')
    expect(emailInput).toBeDisabled()
    expect(emailInput).toHaveValue(EMAIL)

    await userEvent.type(within(dialog).getByPlaceholderText('••••••••'), VALID_PASSWORD)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add password' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(updateUserMock).toHaveBeenCalledWith({ password: VALID_PASSWORD })
    expect(signOutMock).toHaveBeenCalledWith({ scope: 'others' })

    expect(await screen.findByRole('link', { name: 'Change password' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add password' })).not.toBeInTheDocument()
  })

  it('keeps the dialog open when setting the password fails', async () => {
    mockGetUser([githubIdentity])
    updateUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'Password update failed' },
    })

    renderAccountIdentities()
    const dialog = await openAddPasswordDialog()

    await userEvent.type(within(dialog).getByPlaceholderText('••••••••'), VALID_PASSWORD)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add password' }))

    await waitFor(() => expect(updateUserMock).toHaveBeenCalledWith({ password: VALID_PASSWORD }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(signOutMock).not.toHaveBeenCalled()
  })

  it('does not submit a password that fails validation', async () => {
    mockGetUser([githubIdentity])

    renderAccountIdentities()
    const dialog = await openAddPasswordDialog()

    await userEvent.type(within(dialog).getByPlaceholderText('••••••••'), 'weak')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add password' }))

    expect(
      await within(dialog).findByText(
        'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'
      )
    ).toBeInTheDocument()
    expect(updateUserMock).not.toHaveBeenCalled()
  })
})
