import { useQueries } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { AuthorizeSuccessScreen } from './AuthorizeSuccessScreen'
import { AuthorizingAsCard } from './AuthorizingAsCard'
import { NoProjectsNotice } from './NoProjectsNotice'
import { CONSENT_COPY } from './OAuthAppsAuthorizeScreen.utils'
import { MAX_SELECTED_PROJECTS, ProjectMultiSelect } from './ProjectMultiSelect'
import { ScopeGroupCard } from './ScopeGroupCard'
import {
  DestinationLogo,
  InterstitialLayout,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { oauthAppsKeys } from '@/data/oauth-apps/keys'
import { USE_MOCKS } from '@/data/oauth-apps/mocks'
import { useOAuthAppsAuthorizeApproveMutation } from '@/data/oauth-apps/oauth-apps-authorize-approve-mutation'
import { useOAuthAppsAuthorizeDenyMutation } from '@/data/oauth-apps/oauth-apps-authorize-deny-mutation'
import {
  getOAuthAppsAuthorizeOrganizationProjects,
  useOAuthAppsAuthorizeOrganizationProjectsQuery,
} from '@/data/oauth-apps/oauth-apps-authorize-organization-projects-query'
import { useOAuthAppsAuthorizeOrganizationsQuery } from '@/data/oauth-apps/oauth-apps-authorize-organizations-query'
import { useOAuthOrgAppDetailsQuery } from '@/data/oauth-apps/oauth-apps-org-app-details-query'
import type {
  OAuthAppsAuthorizeRedirect,
  OAuthAppsAuthorizeRequest,
  OAuthAppsAuthorizeRoleValidationFailure,
  OAuthAuthorizeApproveRequest,
} from '@/data/oauth-apps/types'
import {
  getFailedProjects,
  getPreselectedProjectRefs,
  isRoleValidationFailure,
} from '@/data/oauth-apps/types'
import { useSignOut } from '@/lib/auth'

export interface OAuthAppsAuthorizeScreenProps {
  authId: string
  request: OAuthAppsAuthorizeRequest
  organizationSlug?: string
  projectRef?: string | null
  navigate: (destination: string) => void
}

export const OAuthAppsAuthorizeScreen = ({
  authId,
  request,
  organizationSlug,
  projectRef = null,
  navigate,
}: OAuthAppsAuthorizeScreenProps) => {
  const grantKind = request.grant_kind
  const isProjectScopingModeEnabled = request.project_scoping_mode

  const { data: identity } = useOAuthAppsAuthorizeOrganizationsQuery({ id: authId })

  const [selectedProjectRefs, setSelectedProjectRefs] = useState<string[]>([])
  const [allProjectsSelected, setAllProjectsSelected] = useState(false)
  const [approveRedirect, setApproveRedirect] = useState<OAuthAppsAuthorizeRedirect | null>(null)
  const [roleFailure, setRoleFailure] = useState<OAuthAppsAuthorizeRoleValidationFailure | null>(
    null
  )

  const needsOrgResolution =
    isProjectScopingModeEnabled &&
    !organizationSlug &&
    projectRef !== null &&
    (identity?.organizations.length ?? 0) > 1

  const orgProjectsQueries = useQueries({
    queries: (identity?.organizations ?? []).map((organization) => ({
      queryKey: oauthAppsKeys.authorizeOrganizationProjects(authId, organization.slug),
      queryFn: () =>
        getOAuthAppsAuthorizeOrganizationProjects({ id: authId, slug: organization.slug }),
      enabled: USE_MOCKS && needsOrgResolution,
    })),
  })
  const orgResolutionSettled =
    !needsOrgResolution || orgProjectsQueries.every((query) => query.isSuccess)

  const resolvedOrgSlug = (() => {
    if (!needsOrgResolution || !orgResolutionSettled || !identity) return undefined

    const owners = identity.organizations.filter((_, index) =>
      (orgProjectsQueries[index].data ?? []).some((project) => project.ref === projectRef)
    )
    return owners.length === 1 ? owners[0].slug : undefined
  })()

  const orgSlug = organizationSlug ?? resolvedOrgSlug ?? identity?.organizations[0]?.slug
  const memberOrg = identity?.organizations.find((org) => org.slug === orgSlug)

  const { data: projects } = useOAuthAppsAuthorizeOrganizationProjectsQuery({
    id: authId,
    slug: orgSlug,
  })
  const { data: orgAppDetails } = useOAuthOrgAppDetailsQuery({
    slug: orgSlug,
    appId: request.app_id,
  })

  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || !projects || !orgAppDetails || !orgResolutionSettled) return
    seeded.current = true
    if (!isProjectScopingModeEnabled) return

    const grant = orgAppDetails.existing_grant
    const hasAllProjectsGrant = grant !== null && grant.project_refs.length === 0
    if (hasAllProjectsGrant && isProjectScopingModeEnabled) {
      setAllProjectsSelected(true)
      return
    }

    const refs = getPreselectedProjectRefs({
      existingGrant: grant,
      projectRef,
      liveProjects: projects,
    })
    if (refs.length > 0) setSelectedProjectRefs(refs.slice(0, MAX_SELECTED_PROJECTS))
  }, [orgAppDetails, projects, orgResolutionSettled, isProjectScopingModeEnabled, projectRef])

  const signOut = useSignOut()

  const approveMutation = useOAuthAppsAuthorizeApproveMutation({
    onSuccess: (data) => {
      if (isRoleValidationFailure(data)) {
        setRoleFailure(data)
        return
      }
      setRoleFailure(null)
      setApproveRedirect(data)
    },
  })
  const denyMutation = useOAuthAppsAuthorizeDenyMutation({
    onSuccess: (data) => {
      window.location.href = data.url
    },
  })

  const isSubmitting = approveMutation.isPending
  const hasProjects = (projects?.length ?? 0) > 0

  if (!identity || !orgSlug || !memberOrg || !orgResolutionSettled || !orgAppDetails) return null

  const isBlockedOnProjects = isProjectScopingModeEnabled && !hasProjects
  const canProceed = !isBlockedOnProjects

  const grantedProjects = (projects ?? []).filter((project) =>
    selectedProjectRefs.includes(project.ref)
  )

  const flaggedRefs = getFailedProjects(roleFailure)
    .map((project) => project.ref)
    .filter((ref) => selectedProjectRefs.includes(ref))
  const hasRoleFailure = flaggedRefs.length > 0
  const primaryActionLabel = hasRoleFailure
    ? `Deselect ${flaggedRefs.length} ${flaggedRefs.length === 1 ? 'project' : 'projects'}`
    : `Authorize ${request.name}`
  const primaryActionVariant = hasRoleFailure || isSubmitting ? 'default' : 'primary'

  const usesSelectedProjects = isProjectScopingModeEnabled && !allProjectsSelected
  const hasNoSelection = usesSelectedProjects && selectedProjectRefs.length === 0

  const approveBody: OAuthAuthorizeApproveRequest = usesSelectedProjects
    ? { project_refs: selectedProjectRefs }
    : {}

  if (approveRedirect) {
    return (
      <InterstitialLayout
        logo={<DestinationLogo name={request.name} />}
        title={`${request.name} is connected`}
        titleClassName="text-2xl"
        description={`You can return to ${request.name} to continue`}
      >
        <AuthorizeSuccessScreen
          appName={request.name}
          grant={{
            email: identity.email,
            organization_slug: memberOrg.slug,
            project_refs: usesSelectedProjects ? selectedProjectRefs : null,
            projects: grantedProjects,
            scopes: request.scopes,
          }}
          onReturn={() => {
            window.location.href = approveRedirect.url
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

  const handleDeselectFlagged = () =>
    setSelectedProjectRefs((refs) => refs.filter((ref) => !flaggedRefs.includes(ref)))

  const handleApprove = () => {
    if (hasNoSelection) return
    approveMutation.mutate({ auth_id: authId, slug: orgSlug, body: approveBody })
  }

  const handleDeny = () => {
    denyMutation.mutate({ auth_id: authId, slug: orgSlug })
  }

  const footerMessage = isSubmitting
    ? "Don't close this window."
    : canProceed
      ? null
      : `Cancelling will redirect you to ${request.redirect_uri} with access denied.`

  return (
    <InterstitialLayout
      logo={<LogoPair left={<DestinationLogo name={request.name} />} right={<SupabaseLogo />} />}
      title={`Authorize ${request.name}`}
      description="This application wants to access your Supabase Account"
    >
      <div className="flex flex-col gap-6 px-6 pb-6">
        {hasRoleFailure && (
          <Admonition
            type="destructive"
            title={CONSENT_COPY.roleFailure.title(flaggedRefs.length)}
            description={CONSENT_COPY.roleFailure.description(request.name)}
          />
        )}

        <fieldset disabled={isSubmitting} className="contents">
          <AuthorizingAsCard
            email={identity.email}
            organizationSlug={memberOrg.slug}
            onSignOut={handleSignOut}
          />

          {isBlockedOnProjects && (
            <NoProjectsNotice
              appName={request.name}
              organizationSlug={orgSlug}
              onSwitchOrg={handleSwitchOrg}
            />
          )}

          {canProceed && isProjectScopingModeEnabled && (
            <div className="flex flex-col gap-2">
              <ProjectMultiSelect
                projects={projects ?? []}
                selectedRefs={selectedProjectRefs}
                onChange={setSelectedProjectRefs}
                maxSelected={MAX_SELECTED_PROJECTS}
                error={hasNoSelection ? CONSENT_COPY.selectionRequired : undefined}
                flaggedRefs={flaggedRefs}
                unavailableRefs={getFailedProjects(roleFailure).map((project) => project.ref)}
                allProjectsSelected={allProjectsSelected}
                onAllProjectsChange={setAllProjectsSelected}
              />
            </div>
          )}

          {canProceed && (
            <>
              <section className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-foreground">Permissions requested</p>
                  <p className="text-xs text-foreground-lighter">
                    Authorizing {request.name} grants it the following access permissions to{' '}
                    {isProjectScopingModeEnabled ? 'the selected' : 'all'} projects.
                  </p>
                </div>
                <ScopeGroupCard scopes={request.scopes} />
              </section>

              {!isProjectScopingModeEnabled && (
                <Admonition
                  type="default"
                  title={CONSENT_COPY.coversEveryProject.title}
                  description={CONSENT_COPY.coversEveryProject.description(request.name, orgSlug)}
                />
              )}

              {grantKind === 'organization_bound' && (
                <Admonition
                  type="default"
                  title={CONSENT_COPY.organizationBoundGrant.title}
                  description={CONSENT_COPY.organizationBoundGrant.description(
                    request.name,
                    orgSlug
                  )}
                />
              )}
            </>
          )}
        </fieldset>

        <div className="flex flex-col gap-2">
          {canProceed ? (
            <Button
              block
              variant={primaryActionVariant}
              loading={isSubmitting}
              disabled={hasNoSelection}
              aria-label={primaryActionLabel}
              onClick={hasRoleFailure ? handleDeselectFlagged : handleApprove}
            >
              {isSubmitting ? 'Authorizing...' : primaryActionLabel}
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
                {grantKind === 'member_bound' &&
                  'No admin approval is needed if your role permits this access. '}
                This authorization will appear in Authorized apps.
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
