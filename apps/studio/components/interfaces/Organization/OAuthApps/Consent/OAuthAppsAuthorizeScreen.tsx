import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { AuthorizeSuccessScreen } from './AuthorizeSuccessScreen'
import { AuthorizingAsCard } from './AuthorizingAsCard'
import { NoProjectsNotice } from './NoProjectsNotice'
import { MAX_SELECTED_PROJECTS, ProjectMultiSelect } from './ProjectMultiSelect'
import { ScopeGroupCard } from './ScopeGroupCard'
import { ScopeGroupCardWithDiff } from './ScopeGroupCardWithDiff'
import { useMemberOrganization } from './useMemberOrganization'
import { useProjectsByRefQuery } from './useProjectsByRefQuery'
import { ApiAuthorizationLoadingScreen } from '@/components/interfaces/ApiAuthorization/ApiAuthorization.Loading'
import {
  DestinationLogo,
  InterstitialLayout,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { AlertError } from '@/components/ui/AlertError'
import { useOAuthAppsAuthorizeApproveMutation } from '@/data/oauth-apps/oauth-apps-authorize-approve-mutation'
import { useOAuthAppsAuthorizeDenyMutation } from '@/data/oauth-apps/oauth-apps-authorize-deny-mutation'
import { useOAuthAppsAuthorizeOrganizationProjectsQuery } from '@/data/oauth-apps/oauth-apps-authorize-organization-projects-query'
import { useOAuthAppsAuthorizeOrganizationsQuery } from '@/data/oauth-apps/oauth-apps-authorize-organizations-query'
import { useOAuthAppsAuthorizeRequestQuery } from '@/data/oauth-apps/oauth-apps-authorize-request-query'
import { useOAuthOrgAppDetailsQuery } from '@/data/oauth-apps/oauth-apps-org-app-details-query'
import { useOAuthAppsPreflightValidationQuery } from '@/data/oauth-apps/oauth-apps-preflight-validation-query'
import type {
  OAuthAppsAuthorizeRedirect,
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
  authId?: string
  organizationSlug?: string
  projectRef?: string | null
  navigate: (destination: string) => void
}

export const OAuthAppsAuthorizeScreen = ({
  authId,
  organizationSlug,
  projectRef = null,
  navigate,
}: OAuthAppsAuthorizeScreenProps) => {
  const signOut = useSignOut()

  const {
    data: request,
    error: requestError,
    isPending: isPendingRequest,
    isError: isErrorRequest,
  } = useOAuthAppsAuthorizeRequestQuery({ id: authId })

  const grantKind = request?.grant_kind
  const isProjectScopingModeEnabled = request?.project_scoping_mode

  const [selectedProjectRefs, setSelectedProjectRefs] = useState<string[]>([])
  const [allProjectsSelected, setAllProjectsSelected] = useState(false)
  const [approveRedirect, setApproveRedirect] = useState<OAuthAppsAuthorizeRedirect | null>(null)
  const [roleFailure, setRoleFailure] = useState<OAuthAppsAuthorizeRoleValidationFailure | null>(
    null
  )

  const {
    data: identity,
    error: identityError,
    isPending: isPendingIdentity,
    isError: isErrorIdentity,
  } = useOAuthAppsAuthorizeOrganizationsQuery({ id: authId })

  const {
    data: memberOrg,
    error: memberOrgError,
    isPending: isPendingMemberOrg,
    isError: isErrorMemberOrg,
  } = useMemberOrganization({
    authId,
    organizationSlug,
    projectRef,
    request,
  })
  const [search, setSearch] = useState('')

  // TODO: replace with useOrgProjectsInfiniteQuery
  const {
    data: projectsData,
    isPending: isPendingProjects,
    isFetching: isFetchingProjects,
    isFetchingNextPage: isFetchingNextPageProjects,
    hasNextPage: hasNextPageProjects,
    fetchNextPage: fetchNextPageProjects,
  } = useOAuthAppsAuthorizeOrganizationProjectsQuery({
    slug: memberOrg,
    search,
  })

  const projects = useMemo(
    () => projectsData?.pages.flatMap((page) => page.projects),
    [projectsData]
  )

  const handleLoadMoreProjects = () => {
    if (
      !isPendingProjects &&
      !isFetchingProjects &&
      !isFetchingNextPageProjects &&
      hasNextPageProjects
    ) {
      fetchNextPageProjects()
    }
  }

  const {
    data: appDetails,
    isPending: isPendingAppDetails,
    isError: isErrorAppDetails,
    error: errorAppDetails,
  } = useOAuthOrgAppDetailsQuery(
    {
      slug: memberOrg || '',
      appId: request?.app_id,
    },
    {
      enabled: !isPendingRequest && !isPendingMemberOrg && !!memberOrg,
    }
  )

  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || !projects || !appDetails || !memberOrg) return
    seeded.current = true
    if (!isProjectScopingModeEnabled) return

    const grant = appDetails.existing_grant
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
  }, [appDetails, projects, memberOrg, isProjectScopingModeEnabled, projectRef])

  const { data: selectedProjects } = useProjectsByRefQuery(selectedProjectRefs)

  const preflightQuery = useOAuthAppsPreflightValidationQuery(
    {
      appId: request?.app_id,
      slug: memberOrg!,
    },
    {
      enabled: !isPendingRequest && !isPendingMemberOrg && !!memberOrg,
    }
  )

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

  const isBlockedOnProjects = isProjectScopingModeEnabled && !isPendingProjects && !hasProjects
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
    : `Authorize ${request?.name}`
  const primaryActionVariant = hasRoleFailure || isSubmitting ? 'default' : 'primary'

  const usesSelectedProjects = isProjectScopingModeEnabled && !allProjectsSelected
  const hasNoSelection = usesSelectedProjects && selectedProjectRefs.length === 0

  if (isPendingRequest || isPendingIdentity || isPendingMemberOrg) {
    return <ApiAuthorizationLoadingScreen />
  }

  if (isErrorRequest) {
    return (
      <InterstitialLayout
        title="Application authorization"
        description="An application wants to access your Supabase Account"
      >
        <div className="flex flex-col gap-6 px-6 pb-6">
          <AlertError subject="An error occurred while loading your data" error={requestError} />
        </div>
      </InterstitialLayout>
    )
  }
  if (isErrorIdentity) {
    return (
      <InterstitialLayout
        logo={<DestinationLogo name={request.name} />}
        title={`Authorize ${request.name}`}
        description="This application wants to access your Supabase Account"
      >
        <div className="flex flex-col gap-6 px-6 pb-6">
          <AlertError subject="An error occurred while loading your data" error={identityError} />
        </div>
      </InterstitialLayout>
    )
  }

  if (isErrorAppDetails) {
    return (
      <InterstitialLayout
        logo={<DestinationLogo name={request.name} />}
        title={`Authorize ${request.name}`}
        description="This application wants to access your Supabase Account"
      >
        <div className="flex flex-col gap-6 px-6 pb-6">
          <AlertError subject="An error occurred while loading your data" error={errorAppDetails} />
        </div>
      </InterstitialLayout>
    )
  }

  if (isErrorMemberOrg) {
    return (
      <InterstitialLayout
        logo={<DestinationLogo name={request.name} />}
        title={`Authorize ${request.name}`}
        description="This application wants to access your Supabase Account"
      >
        <div className="flex flex-col gap-6 px-6 pb-6">
          <AlertError
            error={memberOrgError}
            subject="We couldn't find the organization for this application authorization"
          />
        </div>
      </InterstitialLayout>
    )
  }

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
            organization_slug: memberOrg,
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
    const approveBody: OAuthAuthorizeApproveRequest = usesSelectedProjects
      ? { project_refs: selectedProjectRefs }
      : {}
    approveMutation.mutate({ auth_id: authId, slug: memberOrg, body: approveBody })
  }

  const handleDeny = () => {
    denyMutation.mutate({ auth_id: authId, slug: memberOrg })
  }

  const footerMessage = isSubmitting
    ? "Don't close this window."
    : canProceed
      ? null
      : `Cancelling will redirect you to ${request.redirect_uri} with access denied.`

  const cannotApprove = preflightQuery.data?.status === 'error' || hasNoSelection

  return (
    <InterstitialLayout
      logo={<LogoPair left={<DestinationLogo name={request.name} />} right={<SupabaseLogo />} />}
      title={`Authorize ${request.name}`}
      description={
        appDetails?.existing_grant ? (
          <>
            You authorized {request.name} for this organization on{' '}
            <TimestampInfo
              className="text-sm inline-block"
              utcTimestamp={appDetails.existing_grant.approved_at}
              labelFormat="D MMM YYYY"
            />
            . It's now asking for different access.
          </>
        ) : (
          'This application wants to access your Supabase Account'
        )
      }
    >
      <div className="flex flex-col gap-6 px-6 pb-6">
        {preflightQuery.data?.status === 'error' && (
          <Admonition
            type="warning"
            title={`Couldn't authorize ${request.name}`}
            description={`Your Read-only role in ${memberOrg} can't grant write access. Ask an admin to change your role, or switch organization.`}
          />
        )}
        {hasRoleFailure && (
          <Admonition
            type="warning"
            title={
              flaggedRefs.length === 1
                ? "Couldn't authorize 1 project"
                : `Couldn't authorize ${flaggedRefs.length} projects`
            }
            description={`${request.name} needs write access but your role is read-only on the projects highlighted. Deselect them to continue.`}
          />
        )}

        <fieldset disabled={isSubmitting} className="contents">
          <AuthorizingAsCard
            email={identity.email}
            organizationSlug={memberOrg}
            onSignOut={handleSignOut}
            request={request}
          />

          {isBlockedOnProjects && (
            <NoProjectsNotice
              appName={request.name}
              organizationSlug={memberOrg}
              onSwitchOrg={handleSwitchOrg}
            />
          )}

          {canProceed && isProjectScopingModeEnabled && (
            <div className="flex flex-col gap-2">
              <ProjectMultiSelect
                onChange={setSelectedProjectRefs}
                maxSelected={MAX_SELECTED_PROJECTS}
                error={
                  hasNoSelection ? 'Must select at least one project to authorize.' : undefined
                }
                flaggedRefs={flaggedRefs}
                unavailableRefs={getFailedProjects(roleFailure).map((project) => project.ref)}
                allProjectsSelected={allProjectsSelected}
                onAllProjectsChange={setAllProjectsSelected}
                onSearchChange={setSearch}
                projects={projects ?? []}
                selectedProjects={selectedProjects ?? []}
                onLoadMore={handleLoadMoreProjects}
              />
            </div>
          )}

          {canProceed && (
            <>
              <section className="flex flex-col gap-3">
                <p className="text-sm text-foreground">Permissions requested</p>
                {appDetails?.existing_grant?.approved_scopes ? (
                  <ScopeGroupCardWithDiff
                    scopes={request.scopes}
                    previousScopes={appDetails.existing_grant.approved_scopes}
                  />
                ) : (
                  <ScopeGroupCard scopes={request.scopes} />
                )}
                <p className="text-xs text-foreground-lighter">
                  Authorizing {request.name} grants it access to the permissions
                  {isProjectScopingModeEnabled && !allProjectsSelected ? (
                    <span>{' and selected projects '}</span>
                  ) : (
                    ' '
                  )}
                  <span>above.</span>
                </p>
              </section>

              {grantKind === 'organization_bound' && (
                <Admonition
                  type="default"
                  title="Want this scoped to one member?"
                  description={`Have them authorize ${request.name} from their own account. Authorizing here gives it your Administrator access on every project, including ones created later.`}
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
              loading={isSubmitting || isPendingAppDetails}
              disabled={cannotApprove}
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
                {grantKind === 'member_bound' && (
                  <span>No admin approval is needed if your role permits this access. </span>
                )}
                <span>This authorization will appear in Authorized apps.</span>
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
