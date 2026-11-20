import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { AuthorizeSuccessScreen } from './AuthorizeSuccessScreen'
import { AuthorizingAsCard } from './AuthorizingAsCard'
import { DatabaseAccessProjectIssues } from './DatabaseAccessProjectIssues'
import { NoProjectsNotice } from './NoProjectsNotice'
import { getFailedProjects, getPreselectedProjectRefs } from './OAuthAppsAuthorizeScreen.utils'
import { MAX_SELECTED_PROJECTS, ProjectMultiSelect } from './ProjectMultiSelect'
import { ScopeGroupCard } from './ScopeGroupCard'
import { ScopeGroupCardWithDiff } from './ScopeGroupCardWithDiff'
import { useMemberOrganization } from './useMemberOrganization'
import { ApiAuthorizationInvalidScreen } from '@/components/interfaces/ApiAuthorization/ApiAuthorization.Invalid'
import { ApiAuthorizationLoadingScreen } from '@/components/interfaces/ApiAuthorization/ApiAuthorization.Loading'
import {
  DestinationLogo,
  InterstitialLayout,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  getMockOAuthAppsAuthorizeApproveResult,
  getMockOAuthAppsAuthorizeIdentity,
  getMockOAuthAppsAuthorizeOrganizationProjects,
  getMockOAuthAppsAuthorizeRequest,
  getMockOAuthAppsPreflightValidation,
} from '@/data/oauth-apps/mocks'
import {
  OAuthAppsAuthorizeApproveData,
  useOAuthAppsAuthorizeApproveMutation,
} from '@/data/oauth-apps/oauth-apps-authorize-approve-mutation'
import { useOAuthAppsAuthorizeDenyMutation } from '@/data/oauth-apps/oauth-apps-authorize-deny-mutation'
import { getOAuthAppsAuthorizeRequestQueryOptions } from '@/data/oauth-apps/oauth-apps-authorize-request-query'
import { useOAuthAppsPreflightValidationQuery } from '@/data/oauth-apps/oauth-apps-preflight-validation-query'
import { isOAuthRoleValidationError, OAuthScopeValidationResult } from '@/data/oauth-apps/types'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useSignOut } from '@/lib/auth'
import { useProfile } from '@/lib/profile'

export interface OAuthAppsAuthorizeScreenProps {
  authId?: string
  isPreview?: boolean
  organizationSlug?: string
  projectRef?: string
  navigate: (destination: string) => void
}

export const OAuthAppsAuthorizeScreen = ({
  authId,
  isPreview = false,
  organizationSlug,
  projectRef,
  navigate,
}: OAuthAppsAuthorizeScreenProps) => {
  const signOut = useSignOut()
  const previewRequest = isPreview && authId ? getMockOAuthAppsAuthorizeRequest(authId) : undefined
  const previewIdentity =
    isPreview && authId ? getMockOAuthAppsAuthorizeIdentity(authId) : undefined
  const previewOrg =
    previewIdentity?.organizations.find((org) =>
      organizationSlug
        ? org.slug === organizationSlug
        : projectRef &&
          previewRequest?.project_scoping_mode &&
          getMockOAuthAppsAuthorizeOrganizationProjects(org.slug).some(
            ({ ref }) => ref === projectRef
          )
    ) ?? previewIdentity?.organizations[0]
  const previewProjects = useMemo(
    () => (previewOrg ? getMockOAuthAppsAuthorizeOrganizationProjects(previewOrg.slug) : []),
    [previewOrg]
  )

  const {
    data: liveRequest,
    error: requestError,
    isPending: isPendingLiveRequest,
    isError: isErrorRequest,
  } = useQuery(
    getOAuthAppsAuthorizeRequestQueryOptions({
      id: isPreview ? undefined : authId,
    })
  )

  const request = previewRequest ?? liveRequest
  const isPendingRequest = !isPreview && isPendingLiveRequest
  const databaseAccess = previewRequest?.databaseAccess
  const grantKind = request?.grant_kind
  const isProjectScopingModeEnabled = request?.project_scoping_mode

  const [selectedProjectRefs, setSelectedProjectRefs] = useState<string[]>([])
  const [allProjectsSelected, setAllProjectsSelected] = useState(false)
  const [approveRedirect, setApproveRedirect] = useState<OAuthAppsAuthorizeApproveData | null>(null)
  const [roleFailure, setRoleFailure] = useState<OAuthScopeValidationResult | null>(null)

  const {
    profile,
    error: identityError,
    isLoading: isPendingIdentity,
    isError: isErrorIdentity,
  } = useProfile()

  const {
    data: liveMemberOrg,
    error: memberOrgError,
    isPending: isPendingMemberOrg,
    isError: isErrorMemberOrg,
  } = useMemberOrganization({
    organizationSlug,
    projectRef,
    request: liveRequest,
    enabled: !isPreview,
  })
  const memberOrg = previewOrg ?? liveMemberOrg
  const email = previewIdentity?.email ?? profile?.primary_email
  const [search, setSearch] = useState('')

  const {
    data: projectsData,
    isPending: isPendingProjects,
    isFetching: isFetchingProjects,
    isFetchingNextPage: isFetchingNextPageProjects,
    hasNextPage: hasNextPageProjects,
    fetchNextPage: fetchNextPageProjects,
  } = useOrgProjectsInfiniteQuery(
    {
      slug: memberOrg?.slug,
      search,
    },
    {
      enabled: !isPreview && memberOrg != null,
    }
  )

  const liveProjects = useMemo(
    () => projectsData?.pages.flatMap((page) => page.projects),
    [projectsData]
  )

  const projects = isPreview
    ? previewProjects.filter(({ name }) => name.includes(search))
    : liveProjects

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
    data: livePreflight,
    isPending: isPendingLivePreflight,
    isError: isErrorPreflight,
    error: preflightError,
  } = useOAuthAppsPreflightValidationQuery(
    {
      auth_id: authId,
      slug: memberOrg?.slug,
    },
    {
      enabled: !isPreview && !isPendingRequest && !isPendingMemberOrg && memberOrg != null,
    }
  )

  const previewPreflight = useMemo(
    () =>
      previewRequest && previewOrg
        ? getMockOAuthAppsPreflightValidation(previewOrg.slug, previewRequest.app_id)
        : undefined,
    [previewRequest, previewOrg]
  )
  const preflightData = previewPreflight ?? livePreflight
  const isPendingPreflight = !isPreview && isPendingLivePreflight

  useEffect(() => {
    if (preflightData?.validation_failure) {
      return setRoleFailure(preflightData.validation_failure)
    }
    if (isOAuthRoleValidationError(preflightError)) {
      return setRoleFailure(preflightError.validation)
    }
    setRoleFailure(null)
  }, [preflightData, preflightError])

  const initialRefs = useMemo(() => {
    if (!isProjectScopingModeEnabled) return []
    const refs = new Set<string>()
    if (preflightData?.existing_grant?.project_refs) {
      preflightData.existing_grant.project_refs.forEach((ref) => refs.add(ref))
    }
    if (projectRef) {
      refs.add(projectRef)
    }
    return Array.from(refs)
  }, [isProjectScopingModeEnabled, preflightData?.existing_grant?.project_refs, projectRef])

  const {
    data: initialProjectsData,
    isPending: isPendingInitialProjects,
    isError: isErrorInitialProjects,
    error: initialProjectsError,
  } = useOrgProjectsInfiniteQuery(
    {
      slug: memberOrg?.slug,
      refs: initialRefs,
    },
    {
      enabled: !isPreview && memberOrg != null && initialRefs.length > 0,
    }
  )

  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || !preflightData || !memberOrg) return

    const grant = preflightData.existing_grant
    const hasAllProjectsGrant =
      grant !== null && (grant?.project_refs == null || grant?.project_refs?.length === 0)
    if (!hasAllProjectsGrant && !isPreview && initialRefs.length > 0 && !initialProjectsData) return

    seeded.current = true

    if (hasAllProjectsGrant && isProjectScopingModeEnabled && !databaseAccess) {
      setAllProjectsSelected(true)
      return
    }

    const refs = getPreselectedProjectRefs({
      existingGrant: grant ? { project_refs: grant.project_refs } : null,
      projectRef,
      liveProjects: isPreview
        ? previewProjects
        : (initialProjectsData?.pages.flatMap((page) => page.projects) ?? []),
    })
    if (refs.length > 0) setSelectedProjectRefs(refs.slice(0, MAX_SELECTED_PROJECTS))
  }, [
    preflightData,
    initialProjectsData,
    memberOrg,
    isProjectScopingModeEnabled,
    projectRef,
    databaseAccess,
    initialRefs.length,
    isPreview,
    previewProjects,
  ])

  const { data: selectedProjectsData } = useOrgProjectsInfiniteQuery(
    {
      slug: memberOrg?.slug,
      refs: selectedProjectRefs,
    },
    {
      enabled: !isPreview && memberOrg != null && selectedProjectRefs.length > 0,
    }
  )
  const liveSelectedProjects = useMemo(
    () =>
      selectedProjectsData?.pages
        .flatMap((page) => page.projects)
        .filter((project) => selectedProjectRefs.includes(project.ref)),
    [selectedProjectsData, selectedProjectRefs]
  )

  const selectedProjects = isPreview
    ? previewProjects.filter(({ ref }) => selectedProjectRefs.includes(ref))
    : liveSelectedProjects

  const approveMutation = useOAuthAppsAuthorizeApproveMutation({
    onSuccess: (data) => {
      setRoleFailure(null)
      setApproveRedirect(data)
    },
    onError: (error) => {
      if (isOAuthRoleValidationError(error)) {
        setRoleFailure(error.validation)
      } else {
        toast.error(`Failed to authorize access to OAuth app: ${error.message}`)
      }
    },
  })
  const denyMutation = useOAuthAppsAuthorizeDenyMutation({
    onSuccess: () => {
      if (request) {
        const url = new URL(request.redirect_uri)
        url.searchParams.append('error', 'access_denied')
        window.location.href = url.toString()
      }
    },
  })

  const isSubmitting = approveMutation.isPending || denyMutation.isPending
  const hasProjects = (projects?.length ?? 0) > 0

  // If there are no projects because of a search, we must not block users from changing their search query
  const isBlockedOnProjects =
    isProjectScopingModeEnabled &&
    (isPreview || !isPendingProjects) &&
    !hasProjects &&
    search.length === 0
  const canProceed = !isBlockedOnProjects

  const grantedProjects = selectedProjects ?? []

  const usesSelectedProjects = isProjectScopingModeEnabled && !allProjectsSelected
  const projectsInGrant = usesSelectedProjects ? (selectedProjects ?? []) : previewProjects
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

  if (!authId) {
    return <ApiAuthorizationInvalidScreen missingParameters={['auth_id']} />
  }

  if (isPendingRequest) {
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
  if (!request) return <ApiAuthorizationLoadingScreen />

  if (!isPreview && (isErrorIdentity || (!isPendingIdentity && profile == null))) {
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

  if (isErrorPreflight && !isOAuthRoleValidationError(preflightError)) {
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

  if (!isPreview && isErrorMemberOrg) {
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

  if (isErrorInitialProjects && isProjectScopingModeEnabled) {
    return (
      <InterstitialLayout
        logo={<DestinationLogo name={request.name} />}
        title={`Authorize ${request.name}`}
        description="This application wants to access your Supabase Account"
      >
        <div className="flex flex-col gap-6 px-6 pb-6">
          <AlertError
            error={initialProjectsError}
            subject="Failed to load projects for this authorization"
          />
        </div>
      </InterstitialLayout>
    )
  }

  if (
    isPendingRequest ||
    !memberOrg ||
    !email ||
    (!isPreview && isPendingInitialProjects && initialRefs.length > 0)
  ) {
    return <ApiAuthorizationLoadingScreen />
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
            email: email,
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
    if (cannotApprove || isPendingPreflight) return
    const approveBody = usesSelectedProjects ? { project_refs: selectedProjectRefs } : {}
    if (isPreview) {
      try {
        setApproveRedirect(
          getMockOAuthAppsAuthorizeApproveResult(authId, {
            slug: memberOrg.slug,
            projectRefs: approveBody.project_refs,
          })
        )
        setRoleFailure(null)
      } catch (error) {
        if (isOAuthRoleValidationError(error)) setRoleFailure(error.validation)
        else throw error
      }
      return
    }
    approveMutation.mutate({ auth_id: authId, slug: memberOrg.slug, body: approveBody })
  }

  const redirectUri = request.redirect_uri
  const handleDeny = () => {
    if (isPreview) {
      window.location.href = redirectUri
      return
    }
    denyMutation.mutate({ auth_id: authId, slug: memberOrg.slug })
  }

  const footerMessage = isSubmitting
    ? "Don't close this window."
    : canProceed
      ? null
      : `Cancelling will redirect you to ${request.redirect_uri} with access denied.`

  const validationFailure = isOAuthRoleValidationError(preflightError)
    ? preflightError.validation
    : (preflightData?.validation_failure ?? roleFailure)
  const cannotGrantRequestedAccess =
    validationFailure != null && validationFailure.scope_target !== 'projects'
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
            description={
              <span>
                {request.name} needs write access but your role is read-only on the projects
                highlighted. Deselect them to continue.
              </span>
            }
          />
        )}

        <fieldset disabled={isSubmitting} className="contents">
          <AuthorizingAsCard
            email={email}
            organizationName={memberOrg.name}
            onSignOut={handleSignOut}
            request={request}
          />

          {isBlockedOnProjects && (
            <NoProjectsNotice
              appName={request.name}
              organizationName={memberOrg.name}
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
                      selectedProjectRefs={selectedProjectRefs}
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
                    description="Any non-SSL connections will close. These clients will need to use SSL to reconnect."
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
                  <h2 className="text-sm text-foreground font-medium">Permissions requested</h2>
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
                    previousDatabaseAccess={previewPreflight?.existing_grant?.databaseAccessMode}
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
            description={`Your role in “${memberOrg.name}” can’t grant the requested access. Ask an admin or switch organizations.`}
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
              disabled={!hasRoleFailure && cannotApprove}
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
