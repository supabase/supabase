import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { useFlag, useParams } from 'common'

import { ApiAuthorizationScreen } from '@/components/interfaces/ApiAuthorization/ApiAuthorization'
import { ApiAuthorizationLoadingScreen } from '@/components/interfaces/ApiAuthorization/ApiAuthorization.Loading'
import { OAuthAppsAuthorizeScreen } from '@/components/interfaces/Organization/OAuthApps/Consent'
import { OAUTH_APPS_MOCK_SCENARIOS, USE_MOCKS } from '@/data/oauth-apps/mocks'
import { useOAuthAppsAuthorizeRequestQuery } from '@/data/oauth-apps/oauth-apps-authorize-request-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/authorize')({
  component: Authorize,
})

function Authorize() {
  return <APIAuthorizationPageWithAuth />
}

const PAGE_TITLE = buildStudioPageTitle({ section: 'Authorize API Access', brand: 'Supabase' })

const MOCK_SCENARIOS: Record<string, { authId: string; organizationSlug?: string }> = {
  default: { authId: OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper },
  reconsent: { authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent },
  reconsent_all_projects: { authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReconsentAllProjects },
  role_validation: { authId: OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation },
  empty_org: {
    authId: OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper,
    organizationSlug: 'contoso-labs',
  },
  dynamic_client: { authId: OAUTH_APPS_MOCK_SCENARIOS.dynamicMcpClient },
  org_bound: { authId: OAUTH_APPS_MOCK_SCENARIOS.kemalBot },
  org_bound_all: { authId: OAUTH_APPS_MOCK_SCENARIOS.kemalBotOrgWide },
  user_bound_all: { authId: OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects },
}

function APIAuthorizationPage() {
  const navigate = useNavigate()
  const { searchStr } = useLocation()
  const { auth_id, organization_slug, mock_scenario } = useParams()
  const isScopedOAuthConsentEnabled = useFlag('enableScopedOAuthConsent')
  const isScopedOAuthFlowEnabled = isScopedOAuthConsentEnabled && USE_MOCKS

  const mockScenario = USE_MOCKS
    ? (MOCK_SCENARIOS[mock_scenario ?? 'default'] ?? MOCK_SCENARIOS.default)
    : undefined
  const authId = mockScenario?.authId ?? auth_id
  const organizationSlug = organization_slug ?? mockScenario?.organizationSlug

  // first value when the param repeats, like Next's query arrays
  const projectRef = new URLSearchParams(searchStr).get('project_ref')

  const { data: request } = useOAuthAppsAuthorizeRequestQuery(
    { id: authId },
    { enabled: isScopedOAuthFlowEnabled }
  )

  if (isScopedOAuthFlowEnabled) {
    if (!authId || !request) {
      return (
        <>
          <title>{PAGE_TITLE}</title>
          <ApiAuthorizationLoadingScreen />
        </>
      )
    }

    return (
      <>
        <title>{PAGE_TITLE}</title>
        <OAuthAppsAuthorizeScreen
          authId={authId}
          request={request}
          organizationSlug={organizationSlug}
          projectRef={projectRef}
          navigate={(destination) => void navigate({ href: destination })}
        />
      </>
    )
  }

  return (
    <>
      <title>{PAGE_TITLE}</title>
      <ApiAuthorizationScreen
        auth_id={auth_id}
        organization_slug={organization_slug}
        navigate={(destination) => void navigate({ href: destination })}
      />
    </>
  )
}

const APIAuthorizationPageWithAuth = withAuth(APIAuthorizationPage)
