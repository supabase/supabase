import { OAUTH_APPS_MOCK_SCENARIOS } from '@/data/oauth-apps/mocks'

const MOCK_STATE_SCENARIOS: Record<string, string> = {
  ideal: OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper,
  over_role: OAUTH_APPS_MOCK_SCENARIOS.vercelReadOnly,
  unverified: OAUTH_APPS_MOCK_SCENARIOS.kemalBot,
  empty_org: OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper,
  success: OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper,
}

export const EMPTY_ORG_MOCK_SLUG = 'some-other-org'

// mock_state is a dev/QA affordance only (USE_MOCKS is forced off in production) - it stands in
// for the real authorization request id until the backend for this flow exists.
export function getMockScenarioId(mockState: string | undefined): string {
  return MOCK_STATE_SCENARIOS[mockState ?? 'ideal'] ?? OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper
}
