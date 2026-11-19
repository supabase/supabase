import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { AuthorizeSuccessScreen } from './AuthorizeSuccessScreen'
import { AuthorizingAsCard } from './AuthorizingAsCard'
import { DatabaseAccessProjectIssues } from './DatabaseAccessProjectIssues'
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
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useOAuthAppsAuthorizeApproveMutation } from '@/data/oauth-apps/oauth-apps-authorize-approve-mutation'
import { useOAuthAppsAuthorizeDenyMutation } from '@/data/oauth-apps/oauth-apps-authorize-deny-mutation'
import { useOAuthAppsAuthorizeOrganizationProjectsQuery } from '@/data/oauth-apps/oauth-apps-authorize-organization-projects-query'
import { useOAuthAppsAuthorizeOrganizationsQuery } from '@/data/oauth-apps/oauth-apps-authorize-organizations-query'
import { useOAuthAppsAuthorizeRequestQuery } from '@/data/oauth-apps/oauth-apps-authorize-request-query'
import { useOAuthAppsPreflightValidationQuery } from '@/data/oauth-apps/oauth-apps-preflight-validation-query'
import type {
  OAuthAppsAuthorizeRedirect,
  OAuthAuthorizeApproveRequest,
  OAuthScopeValidationResult,
} from '@/data/oauth-apps/types'
import { getFailedProjects, getPreselectedProjectRefs } from '@/data/oauth-apps/types'
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
  const [roleFailure, setRoleFailure] = useState<OAuthScopeValidationResult | null>(null)

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
    data: preflightData,
    isPending: isPendingPreflight,
    isError: isErrorPreflight,
    error: preflightError,
  } = useOAuthAppsPreflightValidationQuery(
    {
      appId: request?.app_id,
      slug: memberOrg!,
    },
    {
      enabled: !isPendingRequest && !isPendingMemberOrg && !!memberOrg,
    }
  )

  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || !projects || !preflightData || !memberOrg) return
    seeded.current = true
    if (!isProjectScopingModeEnabled) return

    const grant = preflightData.existing_grant
    const hasAllProjectsGrant =
      grant !== null && (grant.project_refs == null || grant.project_refs?.length === 0)

    if (hasAllProjectsGrant && !request?.databaseAccess) {
      setAllProjectsSelected(true)
      return
    }

    const refs = getPreselectedProjectRefs({
      existingGrant: grant,
      projectRef,
      liveProjects: projects,
    })
    if (refs.length > 0) setSelectedProjectRefs(refs.slice(0, MAX_SELECTED_PROJECTS))
  }, [
    preflightData,
    projects,
    memberOrg,
    isProjectScopingModeEnabled,
    projectRef,
    request?.databaseAccess,
  ])

  const { data: selectedProjects } = useProjectsByRefQuery(selectedProjectRefs)

  const approveMutation = useOAuthAppsAuthorizeApproveMutation({
    onSuccess: (data) => {
      setRoleFailure(null)
      setApproveRedirect(data)
    },
    onError: (error) => {
      // TODO: cleanup when removing mock data
      // @ts-expect-error
      setRoleFailure(error.validation)
    },
  })
  const denyMutation = useOAuthAppsAuthorizeDenyMutation({
    onSuccess: () => {
      if (request) {
        window.location.href = request.redirect_uri
      }
    },
  })

  const isSubmitting = approveMutation.isPending
  const hasProjects = (projects?.length ?? 0) > 0

  const isBlockedOnProjects = isProjectScopingModeEnabled && !isPendingProjects && !hasProjects
  const canProceed = !isBlockedOnProjects

  const grantedProjects = (projects ?? []).filter((project) =>
    selectedProjectRefs.includes(project.ref)
  )

  const databaseAccess = request?.databaseAccess
  const usesSelectedProjects = isProjectScopingModeEnabled && !allProjectsSelected
  const projectsInGrant = usesSelectedProjects ? (selectedProjects ?? []) : (projects ?? [])
  const readinessIssues = databaseAccess?.projectIssues
  const blockedProjects = projectsInGrant.flatMap(({ ref, name }) => {
    const issue = readinessIssues?.[ref]
    return issue && issue !== 'ssl_enforcement_required' ? [{ ref, name, issue }] : []
  })
  const sslProjects = projectsInGrant.filter(
    ({ ref }) => readinessIssues?.[ref] === 'ssl_enforcement_required'
  )
  const hasBlockedProjects = usesSelectedProjects
    ? selectedProjectRefs.some((ref) =>
        Boolean(readinessIssues?.[ref] && readinessIssues[ref] !== 'ssl_enforcement_required')
      )
    : blockedProjects.length > 0

  const flaggedRefs = getFailedProjects(roleFailure)
    .map((project) => project.ref)
    .filter((ref) => selectedProjectRefs.includes(ref))
  const hasRoleFailure = flaggedRefs.length > 0
  const primaryActionLabel = hasRoleFailure
    ? `Deselect ${flaggedRefs.length} ${flaggedRefs.length === 1 ? 'project' : 'projects'}`
    : `Authorize ${request?.name}`
  const primaryActionVariant = hasRoleFailure || isSubmitting ? 'default' : 'primary'

  const hasNoSelection = usesSelectedProjects && selectedProjectRefs.length === 0

  if (isPendingRequest || isPendingIdentity || isPendingMemberOrg) {
    return <ApiAuthorizationLoadingScreen />
  }

  if (isErrorRequest) {
    return (
      <InterstitialLayout
        title="Application authorization"
        description="An application wants to access your Supabase account."
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
        description="This application wants to access your Supabase account."
      >
        <div className="flex flex-col gap-6 px-6 pb-6">
          <AlertError subject="An error occurred while loading your data" error={identityError} />
        </div>
      </InterstitialLayout>
    )
  }

  if (isErrorPreflight) {
    return (
      <InterstitialLayout
        logo={<DestinationLogo name={request.name} />}
        title={`Authorize ${request.name}`}
        description="This application wants to access your Supabase account."
      >
        <div className="flex flex-col gap-6 px-6 pb-6">
          <AlertError subject="An error occurred while loading your data" error={preflightError} />
        </div>
      </InterstitialLayout>
    )
  }

  if (isErrorMemberOrg) {
    return (
      <InterstitialLayout
        logo={<DestinationLogo name={request.name} />}
        title={`Authorize ${request.name}`}
        description="This application wants to access your Supabase account."
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
    if (hasNoSelection || hasBlockedProjects) return
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

  const cannotGrantRequestedAccess = preflightData?.validation_failure != null
  const cannotApprove = cannotGrantRequestedAccess || hasNoSelection || hasBlockedProjects

  return (
    <InterstitialLayout
      logo={<LogoPair left={<DestinationLogo name={request.name} />} right={<SupabaseLogo />} />}
      title={`Authorize ${request.name}`}
      description={
        preflightData?.existing_grant ? (
          <>
            You authorized {request.name} for this organization on{' '}
            <TimestampInfo
              className="text-sm inline-block"
              utcTimestamp={preflightData.existing_grant.approved_at}
              labelFormat="D MMM YYYY"
            />
            . It’s now asking for different access.
          </>
        ) : (
          'This application wants to access your Supabase account.'
        )
      }
    >
      <div className="flex flex-col gap-6 px-6 pb-6">
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

          {canProceed &&
            (isProjectScopingModeEnabled ||
              blockedProjects.length > 0 ||
              (!cannotGrantRequestedAccess && sslProjects.length > 0)) && (
              <div className="flex flex-col gap-2">
                {canProceed && isProjectScopingModeEnabled && (
                  <div className="flex flex-col gap-2">
                    <ProjectMultiSelect
                      onChange={setSelectedProjectRefs}
                      maxSelected={MAX_SELECTED_PROJECTS}
                      error={
                        hasNoSelection
                          ? 'Must select at least one project to authorize.'
                          : undefined
                      }
                      flaggedRefs={flaggedRefs}
                      unavailableRefs={getFailedProjects(roleFailure).map((project) => project.ref)}
                      readinessIssues={readinessIssues}
                      allProjectsSelected={allProjectsSelected}
                      onAllProjectsChange={databaseAccess ? undefined : setAllProjectsSelected}
                      onSearchChange={setSearch}
                      projects={projects ?? []}
                      selectedProjects={selectedProjects ?? []}
                      onLoadMore={handleLoadMoreProjects}
                    />
                  </div>
                )}

                {canProceed && blockedProjects.length > 0 && (
                  <DatabaseAccessProjectIssues
                    projects={blockedProjects}
                    onRemove={
                      usesSelectedProjects
                        ? (ref) =>
                            setSelectedProjectRefs((refs) =>
                              refs.filter((selected) => selected !== ref)
                            )
                        : undefined
                    }
                  />
                )}

                {canProceed && !cannotGrantRequestedAccess && sslProjects.length > 0 && (
                  <Admonition
                    type="note"
                    title="SSL enforcement will be enabled"
                    description="Setup will enable SSL enforcement on these projects. Clients without SSL will no longer connect."
                  >
                    <div
                      role="list"
                      aria-label="Projects that will require SSL"
                      className="mt-2 divide-y text-xs"
                    >
                      {sslProjects.map(({ ref, name }) => (
                        <div key={ref} role="listitem" className="py-2 font-medium text-foreground">
                          {name}
                        </div>
                      ))}
                    </div>
                  </Admonition>
                )}
              </div>
            )}

          {canProceed && !cannotGrantRequestedAccess && (
            <>
              <section className="flex flex-col gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-foreground font-medium">Permissions requested</p>
                  {grantKind === 'member_bound' && (
                    <p className="text-xs text-foreground-lighter">
                      The app can only use the permissions listed below, and only where your role
                      allows them.
                    </p>
                  )}
                </div>
                {preflightData?.existing_grant?.approved_scopes != null ? (
                  <ScopeGroupCardWithDiff
                    scopes={request.scopes ?? []}
                    previousScopes={preflightData.existing_grant.approved_scopes}
                    databaseAccess={databaseAccess?.mode}
                    previousDatabaseAccess={preflightData.existing_grant.databaseAccessMode}
                  />
                ) : request.scopes != null || databaseAccess ? (
                  <ScopeGroupCard
                    scopes={request.scopes ?? []}
                    databaseAccess={databaseAccess?.mode}
                  />
                ) : null}
                {databaseAccess && (
                  <Admonition
                    type="warning"
                    title="Direct database access"
                    description={
                      databaseAccess.mode === 'write'
                        ? 'The app will be able to read rows that your access rules normally hide, and change data and database structure.'
                        : 'The app will be able to read rows that your access rules normally hide.'
                    }
                  />
                )}
              </section>
            </>
          )}
        </fieldset>

        {cannotGrantRequestedAccess && (
          <Admonition
            type="warning"
            title="You don’t have permission to authorize this application"
            description={`Your role in “${memberOrg}” can’t grant the requested access. Ask an admin or switch organizations.`}
          />
        )}

        <div className="flex flex-col gap-2">
          {canProceed ? (
            <ButtonTooltip
              block
              tooltip={{
                content: {
                  side: 'top',
                  text: hasBlockedProjects
                    ? usesSelectedProjects
                      ? 'Fix or remove the projects listed above.'
                      : 'Fix the projects listed above.'
                    : undefined,
                },
              }}
              variant={primaryActionVariant}
              loading={isSubmitting || isPendingPreflight}
              disabled={cannotApprove}
              aria-label={primaryActionLabel}
              onClick={hasRoleFailure ? handleDeselectFlagged : handleApprove}
            >
              {isSubmitting ? 'Authorizing...' : primaryActionLabel}
            </ButtonTooltip>
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

        <div className="flex flex-col gap-4 border-t pt-6 text-center text-xs text-foreground-lighter">
          {footerMessage ? (
            <p>{footerMessage}</p>
          ) : (
            <p>
              Authorizing will redirect you to{' '}
              <span className="text-foreground">{request.redirect_uri}</span>
            </p>
          )}
        </div>
      </div>
    </InterstitialLayout>
  )
}
