import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { useFlag, useParams } from 'common'

import { ApiAuthorizationScreen } from '@/components/interfaces/ApiAuthorization/ApiAuthorization'
import { OAuthAppsAuthorizeScreen } from '@/components/interfaces/Organization/OAuthApps/Consent'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/authorize')({
  component: Authorize,
})

function Authorize() {
  return <APIAuthorizationPageWithAuth />
}

const PAGE_TITLE = buildStudioPageTitle({ section: 'Authorize API Access', brand: 'Supabase' })

function APIAuthorizationPage() {
  const navigate = useNavigate()
  const { searchStr } = useLocation()
  const { auth_id, organization_slug } = useParams()
  const isScopedOAuthConsentEnabled = useFlag('enableScopedOAuthConsent')

  // first value when the param repeats, like Next's query arrays
  const projectRef = new URLSearchParams(searchStr).get('project_ref')

  if (isScopedOAuthConsentEnabled) {
    return (
      <>
        <title>{PAGE_TITLE}</title>
        <OAuthAppsAuthorizeScreen
          authId={auth_id}
          organizationSlug={organization_slug && projectRef ? organization_slug : undefined}
          projectRef={organization_slug && projectRef ? organization_slug : undefined}
          navigate={(destination) => navigate({ href: destination })}
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
