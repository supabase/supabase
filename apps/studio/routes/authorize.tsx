import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { useFlag } from 'common'

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
  const isScopedOAuthConsentEnabled = useFlag('enableScopedOAuthConsent')

  // first value when the param repeats, like Next's query arrays
  const projectRef = new URLSearchParams(searchStr).get('project_ref')
  const authId = new URLSearchParams(searchStr).get('auth_id') ?? undefined
  const organizationSlug = new URLSearchParams(searchStr).get('organization_slug') ?? undefined

  if (isScopedOAuthConsentEnabled) {
    return (
      <>
        <title>{PAGE_TITLE}</title>
        <OAuthAppsAuthorizeScreen
          key={authId}
          authId={authId}
          organizationSlug={organizationSlug && projectRef ? organizationSlug : undefined}
          projectRef={organizationSlug && projectRef ? projectRef : undefined}
          navigate={(destination) => navigate({ href: destination })}
        />
      </>
    )
  }

  return (
    <>
      <title>{PAGE_TITLE}</title>
      <ApiAuthorizationScreen
        auth_id={authId}
        organization_slug={organizationSlug}
        navigate={(destination) => void navigate({ href: destination })}
      />
    </>
  )
}

const APIAuthorizationPageWithAuth = withAuth(APIAuthorizationPage)
