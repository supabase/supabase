import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, expect, test, vi } from 'vitest'

import { API_URL } from '@/lib/constants'
import { StripeProjectsLoginPage } from '@/pages/partners/stripe/projects/login'
import { render } from '@/tests/helpers'
import { mswServer } from '@/tests/lib/msw'

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQuery: () => ({
      data: {
        email: 'alex@example.com',
        email_matches: true,
        linked_organization: { name: 'Acme', slug: 'acme' },
      },
      isPending: false,
      isSuccess: true,
      isError: false,
      error: undefined,
    }),
  }
})

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => ({ ar_id: 'request-id' }) }
})

vi.mock('next/router', () => ({
  useRouter: () => ({ isReady: true, push: mocks.routerPush }),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

vi.mock('@/lib/auth', () => ({
  useSignOut: () => vi.fn(),
}))

vi.mock('@/lib/profile', () => ({
  useProfileNameAndPicture: () => ({
    username: 'alex',
    primaryEmail: 'alex@example.com',
    avatarUrl: undefined,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

test('shows confirmation failures inline and keeps authorization available', async () => {
  const user = userEvent.setup()
  mswServer.use(
    http.post(`${API_URL}/platform/stripe/projects/provisioning/account_requests/:id/confirm`, () =>
      HttpResponse.json({ message: 'Confirmation failed' }, { status: 500 })
    )
  )

  render(<StripeProjectsLoginPage dehydratedState={undefined} />)

  await user.click(screen.getByRole('button', { name: 'Authorize Stripe Projects' }))

  const errorMessage = await screen.findByText(
    'Failed to authorize Stripe Projects: Confirmation failed'
  )
  expect(errorMessage).toHaveAttribute('role', 'alert')
  expect(toast.error).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Authorize Stripe Projects' })).toBeEnabled()
})
