import { useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { AuthorizeSuccessScreen } from './AuthorizeSuccessScreen'
import { AuthorizingAsCard } from './AuthorizingAsCard'
import { NoProjectsNotice } from './NoProjectsNotice'
import { EMPTY_ORG_MOCK_SLUG, getMockScenarioId } from './OAuthAppsAuthorizeScreen.utils'
import { ProjectMultiSelect } from './ProjectMultiSelect'
import { ScopeGroupCard } from './ScopeGroupCard'
import {
  DestinationLogo,
  InterstitialLayout,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import type { OAuthAppsAuthorizeApproveResponse } from '@/data/oauth-apps/oauth-apps-authorize-approve-mutation'
import { useOAuthAppsAuthorizeApproveMutation } from '@/data/oauth-apps/oauth-apps-authorize-approve-mutation'
import { useOAuthAppsAuthorizeDenyMutation } from '@/data/oauth-apps/oauth-apps-authorize-deny-mutation'
import { useOAuthAppsAuthorizeOrganizationProjectsQuery } from '@/data/oauth-apps/oauth-apps-authorize-organization-projects-query'
import { useOAuthAppsAuthorizeOrganizationsQuery } from '@/data/oauth-apps/oauth-apps-authorize-organizations-query'
import { useOAuthAppsAuthorizeRequestQuery } from '@/data/oauth-apps/oauth-apps-authorize-request-query'
import { useSignOut } from '@/lib/auth'

export interface OAuthAppsAuthorizeScreenProps {
  authId?: string
  organizationSlug?: string
  mockState?: string
  navigate: (destination: string) => void
}

export const OAuthAppsAuthorizeScreen = ({
  organizationSlug,
  mockState,
  navigate,
}: OAuthAppsAuthorizeScreenProps) => {
  const scenarioId = getMockScenarioId(mockState)

  const { data: request } = useOAuthAppsAuthorizeRequestQuery({ id: scenarioId })
  const { data: identity } = useOAuthAppsAuthorizeOrganizationsQuery({ id: scenarioId })

  const selectedOrgSlug =
    organizationSlug ?? (mockState === 'empty_org' ? EMPTY_ORG_MOCK_SLUG : undefined)
  const [selectedProjectRefs, setSelectedProjectRefs] = useState<string[]>([])
  const [projectError, setProjectError] = useState<string>()
  const [approveResult, setApproveResult] = useState<OAuthAppsAuthorizeApproveResponse | null>(null)

  const orgSlug = selectedOrgSlug ?? identity?.organizations[0]?.slug
  const memberOrg = identity?.organizations.find((org) => org.slug === orgSlug)

  const { data: projects } = useOAuthAppsAuthorizeOrganizationProjectsQuery({
    id: scenarioId,
    slug: orgSlug,
  })

  const signOut = useSignOut()

  const approveMutation = useOAuthAppsAuthorizeApproveMutation({
    onSuccess: (data) => {
      setApproveResult(data)
    },
  })
  const denyMutation = useOAuthAppsAuthorizeDenyMutation({
    onSuccess: (data) => {
      window.location.href = data.url
    },
  })

  const isSubmitting = approveMutation.isPending
  const hasProjects = (projects?.length ?? 0) > 0

  if (!request || !identity || !orgSlug || !memberOrg) return null

  // mock_state=success lets a design review load straight into the receipt screen without
  // clicking through the flow first - it's a preview only, never a substitute for the real
  // approve mutation's result.
  const approvedUrl = approveResult?.url ?? (mockState === 'success' ? request.redirect_uri : null)

  const grantedProjects =
    selectedProjectRefs.length > 0
      ? (projects ?? []).filter((project) => selectedProjectRefs.includes(project.ref))
      : (projects ?? [])

  if (approvedUrl) {
    return (
      <InterstitialLayout
        logo={<DestinationLogo name={request.app_name} />}
        title={`${request.app_name} is connected`}
        titleClassName="text-2xl"
        description={`You can return to ${request.app_name} to continue`}
      >
        <AuthorizeSuccessScreen
          appName={request.app_name}
          grant={{
            email: identity.email,
            organization_slug: memberOrg.slug,
            projects: grantedProjects,
            scope_groups: request.scope_groups,
          }}
          onReturn={() => {
            window.location.href = approvedUrl
          }}
        />
      </InterstitialLayout>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.reload()
  }

  const handleSwitchOrg = () => navigate('/organizations')

  const handleApprove = () => {
    if (selectedProjectRefs.length === 0) {
      setProjectError('Must select at least one project to authorize.')
      return
    }
    setProjectError(undefined)
    approveMutation.mutate({
      auth_id: scenarioId,
      slug: orgSlug,
      project_refs: selectedProjectRefs,
    })
  }

  const handleDeny = () => {
    denyMutation.mutate({ auth_id: scenarioId, slug: orgSlug })
  }

  const footerMessage = isSubmitting
    ? "Don't close this window."
    : hasProjects
      ? null
      : `Cancelling will redirect you to ${request.redirect_uri} with access denied.`

  return (
    <InterstitialLayout
      logo={
        <LogoPair left={<DestinationLogo name={request.app_name} />} right={<SupabaseLogo />} />
      }
      title={`Authorize ${request.app_name}`}
      description="This application wants to access your Supabase Account"
    >
      <div className="flex flex-col gap-6 px-6 pb-6">
        {!request.is_verified && (
          <Admonition
            type="warning"
            description="This publisher isn't verified by Supabase. Only continue if you trust it."
          />
        )}

        <fieldset disabled={isSubmitting} className="contents">
          <AuthorizingAsCard
            email={identity.email}
            organizationSlug={memberOrg.slug}
            onSignOut={handleSignOut}
          />

          {hasProjects ? (
            <ProjectMultiSelect
              projects={projects ?? []}
              selectedRefs={selectedProjectRefs}
              onChange={(refs) => {
                setSelectedProjectRefs(refs)
                if (refs.length > 0) setProjectError(undefined)
              }}
              error={projectError}
            />
          ) : (
            <NoProjectsNotice
              appName={request.app_name}
              organizationSlug={orgSlug}
              onSwitchOrg={handleSwitchOrg}
            />
          )}

          {hasProjects && (
            <>
              <ScopeGroupCard appName={request.app_name} scopeGroups={request.scope_groups} />

              {request.reuses_grant_across_workspaces && (
                <Admonition
                  type="default"
                  description="Some clients may reuse one authorization across workspaces. Check your client's workspace or account settings if project access does not behave as expected."
                />
              )}
            </>
          )}
        </fieldset>

        <div className="flex flex-col gap-2">
          {hasProjects ? (
            <Button
              block
              variant={isSubmitting ? 'default' : 'primary'}
              loading={isSubmitting}
              aria-label={`Authorize ${request.app_name}`}
              onClick={handleApprove}
            >
              {isSubmitting ? 'Authorizing...' : `Authorize ${request.app_name}`}
            </Button>
          ) : (
            <Button block variant="primary" onClick={handleSwitchOrg}>
              Switch organization
            </Button>
          )}
          {!isSubmitting && (
            <Button variant="text" block onClick={handleDeny}>
              Cancel
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t pt-6 text-xs text-foreground-lighter">
          {footerMessage ? (
            <p>{footerMessage}</p>
          ) : (
            <>
              <p>
                No admin approval is needed if your role permits this access. This authorization
                will appear in Authorized apps.
              </p>
              <p>
                Authorizing will redirect you to{' '}
                <span className="text-foreground">{request.redirect_uri}</span>
              </p>
            </>
          )}
        </div>
      </div>
    </InterstitialLayout>
  )
}
