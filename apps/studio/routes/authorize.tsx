import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { useFlag, useParams } from 'common'
import { ChevronDownIcon } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

import { ApiAuthorizationScreen } from '@/components/interfaces/ApiAuthorization/ApiAuthorization'
import { OAuthAppsAuthorizeScreen } from '@/components/interfaces/Organization/OAuthApps/Consent'
import { OAUTH_APPS_MOCK_SCENARIOS, USE_MOCKS } from '@/data/oauth-apps/mocks'
import { withAuth } from '@/hooks/misc/withAuth'
import { IS_STAGING_OR_LOCAL } from '@/lib/constants'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/authorize')({
  component: Authorize,
})

function Authorize() {
  return <APIAuthorizationPageWithAuth />
}

const PAGE_TITLE = buildStudioPageTitle({ section: 'Authorize API Access', brand: 'Supabase' })

const MOCK_SCENARIOS: Record<string, { authId: string; organizationSlug?: string }> = {
  trusted_partner_write: { authId: OAUTH_APPS_MOCK_SCENARIOS.trustedPartnerWrite },
  trusted_partner_mixed: { authId: OAUTH_APPS_MOCK_SCENARIOS.trustedPartnerMixed },
  trusted_partner_reconsent: { authId: OAUTH_APPS_MOCK_SCENARIOS.trustedPartnerReconsent },
  trusted_partner_read: { authId: OAUTH_APPS_MOCK_SCENARIOS.trustedPartnerRead },
  trusted_partner_blocked: { authId: OAUTH_APPS_MOCK_SCENARIOS.trustedPartnerBlocked },
  trusted_partner_multiple_blocked: {
    authId: OAUTH_APPS_MOCK_SCENARIOS.trustedPartnerMultipleBlocked,
  },
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

const CONSENT_PREVIEWS = [
  { value: 'default', label: 'Standard app', project: 'northwindstorefront1' },
  { value: 'trusted_partner_read', label: 'Partner · read-only', project: 'northwindstorefront1' },
  {
    value: 'trusted_partner_write',
    label: 'Partner · read-write',
    project: 'northwindstorefront1',
  },
  {
    value: 'trusted_partner_mixed',
    label: 'Partner · mixed permissions',
    project: 'northwindstorefront1',
  },
  {
    value: 'trusted_partner_blocked',
    label: 'Partner · blocked project',
    project: 'northwindcms1',
  },
  { value: 'trusted_partner_multiple_blocked', label: 'Partner · blocked projects' },
  { value: 'trusted_partner_reconsent', label: 'Returning partner · Table data upgrade' },
  { value: 'reconsent', label: 'Returning app · changed permissions' },
  { value: 'dynamic_client', label: 'Unverified app' },
  { value: 'org_bound_all', label: 'App · organization-wide' },
]

function APIAuthorizationPage() {
  const navigate = useNavigate()
  const { searchStr } = useLocation()
  const { auth_id, organization_slug, mock_scenario } = useParams()
  const isScopedOAuthConsentEnabled = useFlag('enableScopedOAuthConsent')
  const consentPreview =
    !auth_id && (import.meta.env.DEV || IS_STAGING_OR_LOCAL)
      ? CONSENT_PREVIEWS.find(({ value }) => value === mock_scenario)
      : undefined
  const isScopedOAuthFlowEnabled =
    USE_MOCKS && (isScopedOAuthConsentEnabled || Boolean(consentPreview))

  const mockScenario = USE_MOCKS
    ? (MOCK_SCENARIOS[mock_scenario ?? 'default'] ?? MOCK_SCENARIOS.default)
    : undefined
  const authId = mockScenario?.authId ?? auth_id
  const organizationSlug = organization_slug ?? mockScenario?.organizationSlug

  // first value when the param repeats, like Next's query arrays
  const projectRef = new URLSearchParams(searchStr).get('project_ref')

  if (isScopedOAuthFlowEnabled) {
    return (
      <>
        <title>{PAGE_TITLE}</title>
        {consentPreview && (
          <div className="fixed bottom-3 right-3 z-50 sm:bottom-auto sm:top-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="tiny"
                  variant="default"
                  iconRight={<ChevronDownIcon />}
                  aria-label={`Consent preview: ${consentPreview.label}`}
                >
                  {consentPreview.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={mock_scenario}
                  onValueChange={(value) => {
                    const preview = CONSENT_PREVIEWS.find((option) => option.value === value)
                    if (!preview) return
                    const search = new URLSearchParams({ mock_scenario: preview.value })
                    if (preview.project) search.set('project_ref', preview.project)
                    void navigate({ href: `/authorize?${search}`, replace: true })
                  }}
                >
                  {CONSENT_PREVIEWS.map(({ value, label }) => (
                    <DropdownMenuRadioItem key={value} value={value}>
                      {label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <OAuthAppsAuthorizeScreen
          key={consentPreview?.value}
          authId={authId}
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
