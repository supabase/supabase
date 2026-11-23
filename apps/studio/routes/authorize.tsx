import { createFileRoute, useNavigate } from '@tanstack/react-router'
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
  const { auth_id, organization_slug, project_ref } = useParams()
  const isScopedOAuthConsentEnabled = useFlag('enableScopedOAuthConsent')

  if (isScopedOAuthConsentEnabled) {
    return (
      <>
        <title>{PAGE_TITLE}</title>
        <OAuthAppsAuthorizeScreen
          key={`${auth_id}_${organization_slug ?? ''}_${project_ref ?? ''}`}
          authId={auth_id}
          organizationSlug={organization_slug}
          projectRef={organization_slug && project_ref ? project_ref : undefined}
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
