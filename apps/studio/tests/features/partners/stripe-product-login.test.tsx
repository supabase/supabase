import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { customRender } from 'tests/lib/custom-render'

const mockGetAccountRequest = vi.fn()
const mockConfirmAccountRequest = vi.fn()
const mockRouterPush = vi.fn()
const mockSignOut = vi.fn()
const mockUseParams = vi.fn().mockReturnValue({ ar_id: 'ar_test_123' })

vi.mock('data/partners/stripe-product', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as any),
    getAccountRequest: (...args: any[]) => mockGetAccountRequest(...args),
    confirmAccountRequest: (...args: any[]) => mockConfirmAccountRequest(...args),
  }
})

vi.mock('hooks/misc/withAuth', () => ({
  withAuth: (component: any) => component,
}))

vi.mock('components/layouts/APIAuthorizationLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('lib/auth', () => ({
  useSignOut: () => mockSignOut,
}))

vi.mock('next/router', () => ({
  useRouter: () => ({
    isReady: true,
    push: mockRouterPush,
    query: {},
  }),
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as any),
    useParams: (...args: any[]) => mockUseParams(...args),
  }
})

const MOCK_ACCOUNT_REQUEST = {
  id: 'ar_test_123',
  email: 'user@example.com',
  name: 'Test User',
  scopes: ['read', 'write'],
  status: 'pending',
  orchestrator: { type: 'stripe', stripe: { account: 'acct_123' } },
  expires_at: '2026-12-31T00:00:00Z',
  email_matches: true,
}

describe('CompanyProductLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows approval UI when account request loads successfully', async () => {
    mockGetAccountRequest.mockResolvedValueOnce(MOCK_ACCOUNT_REQUEST)

    const { default: CompanyProductLoginPage } = await import('pages/partners/stripe/product/login')
    customRender(<CompanyProductLoginPage dehydratedState={{}} />)

    await waitFor(() => {
      expect(screen.getByText(/Account Request/)).toBeInTheDocument()
    })

    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    expect(screen.getByText(/Test User/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
  })

  it('shows wrong account warning when email does not match', async () => {
    mockGetAccountRequest.mockResolvedValueOnce({
      ...MOCK_ACCOUNT_REQUEST,
      email_matches: false,
    })

    const { default: CompanyProductLoginPage } = await import('pages/partners/stripe/product/login')
    customRender(<CompanyProductLoginPage dehydratedState={{}} />)

    await waitFor(() => {
      expect(screen.getByText('Wrong account')).toBeInTheDocument()
    })

    expect(screen.getByText(/You need to be logged in as/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  it('calls signOut when Sign out button is clicked', async () => {
    mockGetAccountRequest.mockResolvedValueOnce({
      ...MOCK_ACCOUNT_REQUEST,
      email_matches: false,
    })

    const { default: CompanyProductLoginPage } = await import('pages/partners/stripe/product/login')
    customRender(<CompanyProductLoginPage dehydratedState={{}} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('shows success state after approving', async () => {
    mockGetAccountRequest.mockResolvedValueOnce(MOCK_ACCOUNT_REQUEST)
    mockConfirmAccountRequest.mockResolvedValueOnce({
      success: true,
      organization_slug: 'my-org',
    })

    const { default: CompanyProductLoginPage } = await import('pages/partners/stripe/product/login')
    customRender(<CompanyProductLoginPage dehydratedState={{}} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))

    await waitFor(() => {
      expect(screen.getByText('Organization Created')).toBeInTheDocument()
    })

    expect(screen.getByText(/linked successfully/)).toBeInTheDocument()
    expect(screen.getByText('You can close this window.')).toBeInTheDocument()
    expect(mockConfirmAccountRequest).toHaveBeenCalledWith('ar_test_123')
  })

  it('shows error state when loading the account request fails', async () => {
    mockGetAccountRequest.mockRejectedValueOnce(new Error('Request expired'))

    const { default: CompanyProductLoginPage } = await import('pages/partners/stripe/product/login')
    customRender(<CompanyProductLoginPage dehydratedState={{}} />)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    expect(screen.getByText('Request expired')).toBeInTheDocument()
  })

  it('reverts to approval state when confirm fails', async () => {
    mockGetAccountRequest.mockResolvedValueOnce(MOCK_ACCOUNT_REQUEST)
    mockConfirmAccountRequest.mockRejectedValueOnce(new Error('Network error'))

    const { default: CompanyProductLoginPage } = await import('pages/partners/stripe/product/login')
    customRender(<CompanyProductLoginPage dehydratedState={{}} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))

    // Should revert back to approval state after error
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    })
  })
})

describe('CompanyProductLoginPage without ar_id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to 404 when ar_id is missing', async () => {
    mockUseParams.mockReturnValue({})

    const { default: CompanyProductLoginPage } = await import('pages/partners/stripe/product/login')
    customRender(<CompanyProductLoginPage dehydratedState={{}} />)

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/404')
    })
  })
})
