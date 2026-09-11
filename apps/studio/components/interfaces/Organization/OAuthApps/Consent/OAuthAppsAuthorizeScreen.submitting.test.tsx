import { screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { OAuthAppsAuthorizeScreen } from './OAuthAppsAuthorizeScreen'
import {
  getMockOAuthAppsAuthorizeRequest,
  OAUTH_APPS_MOCK_SCENARIOS,
} from '@/data/oauth-apps/mocks'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/data/oauth-apps/oauth-apps-authorize-approve-mutation', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/data/oauth-apps/oauth-apps-authorize-approve-mutation')>()

  return {
    ...actual,
    useOAuthAppsAuthorizeApproveMutation: () => ({ mutate: vi.fn(), isPending: true }),
  }
})

describe('OAuthAppsAuthorizeScreen while the approve mutation is in flight', () => {
  test('shows the do-not-close message and hides the cancel action', async () => {
    customRender(
      <OAuthAppsAuthorizeScreen
        authId={OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper}
        request={getMockOAuthAppsAuthorizeRequest(OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper)}
        navigate={vi.fn()}
      />
    )

    expect(await screen.findByText("Don't close this window.")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.getByText('Authorizing...')).toBeInTheDocument()
  })
})
