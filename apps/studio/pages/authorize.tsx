import { useFlag, useParams } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { ApiAuthorizationScreen } from '@/components/interfaces/ApiAuthorization/ApiAuthorization'
import { ApiAuthorizationLoadingScreen } from '@/components/interfaces/ApiAuthorization/ApiAuthorization.Loading'
import { OAuthAppsAuthorizeScreen } from '@/components/interfaces/Organization/OAuthApps/Consent'
import { OAUTH_APPS_MOCK_SCENARIOS, USE_MOCKS } from '@/data/oauth-apps/mocks'
import { useOAuthAppsAuthorizeRequestQuery } from '@/data/oauth-apps/oauth-apps-authorize-request-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

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
  suggested_projects: { authId: OAUTH_APPS_MOCK_SCENARIOS.vercelSuggestedProjects },
}

const APIAuthorizationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const routerReady = router.isReady
  const { auth_id, organization_slug, mock_scenario } = useParams()
  const oauthAppScopedGrants = useFlag('OauthAppScopedGrants')

  const mockScenario = USE_MOCKS
    ? (MOCK_SCENARIOS[mock_scenario ?? 'default'] ?? MOCK_SCENARIOS.default)
    : undefined
  const authId = mockScenario?.authId ?? auth_id
  const organizationSlug = organization_slug ?? mockScenario?.organizationSlug

  const projectRefParam = router.query.project_ref
  const suggestedProjectRefs = (
    Array.isArray(projectRefParam)
      ? projectRefParam
      : typeof projectRefParam === 'string'
        ? [projectRefParam]
        : []
  ).slice(0, 10)

  const { data: request } = useOAuthAppsAuthorizeRequestQuery(
    { id: authId },
    { enabled: oauthAppScopedGrants }
  )

  if (!routerReady) {
    return (
      <>
        <Head>
          <title>{PAGE_TITLE}</title>
        </Head>
        <ApiAuthorizationLoadingScreen />
      </>
    )
  }

  if (oauthAppScopedGrants) {
    if (!authId || !request) {
      return (
        <>
          <Head>
            <title>{PAGE_TITLE}</title>
          </Head>
          <ApiAuthorizationLoadingScreen />
        </>
      )
    }

    return (
      <>
        <Head>
          <title>{PAGE_TITLE}</title>
        </Head>
        <OAuthAppsAuthorizeScreen
          authId={authId}
          request={request}
          organizationSlug={organizationSlug}
          suggestedProjectRefs={suggestedProjectRefs}
          navigate={(destination) => router.push(destination)}
        />
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      <ApiAuthorizationScreen
        auth_id={auth_id}
        organization_slug={organization_slug}
        navigate={(destination) => router.push(destination)}
      />
    </>
  )
}

export default withAuth(APIAuthorizationPage)
