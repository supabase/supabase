import { BadgeCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { AuthorizeSuccessScreen } from './AuthorizeSuccessScreen'
import { AuthorizingAsCard } from './AuthorizingAsCard'
import { NoProjectsNotice } from './NoProjectsNotice'
import { EMPTY_ORG_MOCK_SLUG, getMockScenarioId } from './OAuthAppsAuthorizeScreen.utils'
import { isScopeGroupOverRole } from './OverRoleAnnotation.utils'
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
  authId,
  organizationSlug,
  mockState,
  navigate,
}: OAuthAppsAuthorizeScreenProps) => {
  const scenarioId = getMockScenarioId(mockState)

  const { data: request } = useOAuthAppsAuthorizeRequestQuery({ id: scenarioId })
  const { data: identity } = useOAuthAppsAuthorizeOrganizationsQuery({ id: scenarioId })

  const [selectedOrgSlug, setSelectedOrgSlug] = useState(
    () => organizationSlug ?? (mockState === 'empty_org' ? EMPTY_ORG_MOCK_SLUG : undefined)
  )
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

  const overRoleGroups = useMemo(
    () =>
      (request?.scope_groups ?? []).filter((group) =>
        isScopeGroupOverRole(group.level, memberOrg?.role ?? '')
      ),
    [request?.scope_groups, memberOrg?.role]
  )

  if (!request || !identity || !orgSlug || !memberOrg) return null

  // mock_state=success lets a design review load straight into the receipt screen without
  // clicking through the flow first - it's a preview only, never a substitute for the real
  // approve mutation's result.
  const approvedResult: OAuthAppsAuthorizeApproveResponse | null =
    approveResult ??
    (mockState === 'success'
      ? {
          url: request.redirect_uri,
          grant: {
            email: identity.email,
            role: memberOrg.role,
            organization_slug: memberOrg.slug,
            projects: projects ?? [],
            scope_groups: request.scope_groups,
          },
        }
      : null)

  if (approvedResult) {
    return (
      <InterstitialLayout
        logo={<DestinationLogo name={request.app_name} />}
        title={`${request.app_name} is connected`}
        titleClassName="text-2xl"
        description={`You can return to ${request.app_name} to continue`}
      >
        <AuthorizeSuccessScreen
          appName={request.app_name}
          grant={approvedResult.grant}
          onReturn={() => {
            window.location.href = approvedResult.url
          }}
        />
      </InterstitialLayout>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.reload()
  }

  const handleSwitchOrg = () => {
    const otherOrg = identity.organizations.find((org) => org.slug !== orgSlug)
    if (!otherOrg) return

    setSelectedOrgSlug(otherOrg.slug)
    setSelectedProjectRefs([])
    setProjectError(undefined)

    const params = new URLSearchParams()
    if (authId) params.set('auth_id', authId)
    params.set('organization_slug', otherOrg.slug)
    if (mockState) params.set('mock_state', mockState)
    navigate(`/authorize?${params.toString()}`)
  }

  const handleApprove = () => {
    if (selectedProjectRefs.length === 0) {
      setProjectError('Must select at least one project to authorize.')
      return
    }
    setProjectError(undefined)
    approveMutation.mutate({ id: scenarioId, slug: orgSlug, projectRefs: selectedProjectRefs })
  }

  const handleDeny = () => {
    denyMutation.mutate({ id: scenarioId, slug: orgSlug })
  }

  const footerMessage = isSubmitting
    ? "Don't close this window."
    : hasProjects
      ? `Authorizing will redirect you to ${request.redirect_uri}.`
      : `Cancelling will redirect you to ${request.redirect_uri} with access denied.`

  return (
    <InterstitialLayout
      logo={
        <LogoPair left={<DestinationLogo name={request.app_name} />} right={<SupabaseLogo />} />
      }
      title={
        <span className="inline-flex items-center gap-1.5">
          Authorize {request.app_name}
          {request.is_verified && (
            <BadgeCheck role="img" aria-label="Verified" className="size-4 text-brand" />
          )}
        </span>
      }
      description="This application wants to access your Supabase Account"
    >
      <div className="flex flex-col gap-4 px-6 pb-6">
        {!request.is_verified && (
          <Admonition
            type="warning"
            description="This publisher isn't verified by Supabase. Only continue if you trust it."
          />
        )}

        <fieldset disabled={isSubmitting} className="contents">
          <AuthorizingAsCard
            email={identity.email}
            memberRole={memberOrg.role}
            organizationSlug={memberOrg.slug}
            onSignOut={handleSignOut}
            showSwitcher={identity.organizations.length > 1}
            onSwitchOrg={handleSwitchOrg}
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
              <ScopeGroupCard
                appName={request.app_name}
                scopeGroups={request.scope_groups}
                memberRole={memberOrg.role}
              />

              {overRoleGroups.length > 0 && (
                <Admonition
                  type="default"
                  title="Some requested permissions exceed your role"
                  description={`You can still authorize, ${request.app_name} will work within what your role allows.`}
                />
              )}

              <Admonition
                type="default"
                description="Some clients may reuse one authorization across workspaces. Check your client's workspace or account settings if project access does not behave as expected."
              />
            </>
          )}
        </fieldset>

        <div className="flex flex-col gap-3">
          <Button
            block
            variant={isSubmitting ? 'default' : 'primary'}
            loading={isSubmitting}
            aria-label={`Authorize ${request.app_name}`}
            onClick={handleApprove}
          >
            {isSubmitting ? 'Authorizing...' : `Authorize ${request.app_name}`}
          </Button>
          {!isSubmitting && (
            <Button variant="text" block onClick={handleDeny}>
              Cancel
            </Button>
          )}
        </div>

        <div className="mt-3 border-t border-muted pt-5">
          <p className="text-center text-xs text-foreground-lighter text-balance">
            {footerMessage}
          </p>
        </div>
      </div>
    </InterstitialLayout>
  )
}
