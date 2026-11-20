import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { AuthorizeSuccessScreen } from './AuthorizeSuccessScreen'
import { AuthorizingAsCard } from './AuthorizingAsCard'
import { NoProjectsNotice } from './NoProjectsNotice'
import { getFailedProjects, getPreselectedProjectRefs } from './OAuthAppsAuthorizeScreen.utils'
import { OrganizationSelect } from './OrganizationSelect'
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
  organizationSlug?: string
  projectRef?: string
}

export const OAuthAppsAuthorizeScreen = ({
  authId,
  organizationSlug: initialOrganizationSlug,
  projectRef,
}: OAuthAppsAuthorizeScreenProps) => {
  const signOut = useSignOut()

  const {
    data: request,
    error: requestError,
    isPending: isPendingRequest,
    isError: isErrorRequest,
  } = useQuery(
    getOAuthAppsAuthorizeRequestQueryOptions({
      id: authId,
    })
  )

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

  const [organizationSlug, setOrganizationSlug] = useState(initialOrganizationSlug)

  const {
    data: memberOrg,
    error: memberOrgError,
    isPending: isPendingMemberOrg,
    isError: isErrorMemberOrg,
  } = useMemberOrganization({
    organizationSlug,
    projectRef,
    request,
  })

  const [search, setSearch] = useState('')

  const handleOrganizationChange = (slug: string) => {
    if (slug === memberOrg?.slug) return
    setOrganizationSlug(slug)
    setSelectedProjectRefs([])
    setAllProjectsSelected(false)
    setSearch('')
  }

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
      enabled: memberOrg != null,
    }
  )

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
      auth_id: authId,
      slug: memberOrg?.slug,
    },
    {
      enabled: !isPendingRequest && !isPendingMemberOrg && memberOrg != null,
    }
  )

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
    const refs = new Set<string>()
    if (preflightData?.existing_grant?.project_refs) {
      preflightData.existing_grant.project_refs.forEach((ref) => refs.add(ref))
    }
    if (projectRef) {
      refs.add(projectRef)
    }
    return Array.from(refs)
  }, [preflightData?.existing_grant?.project_refs, projectRef])

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
      enabled: memberOrg != null && initialRefs.length > 0,
    }
  )

  useEffect(() => {
    if (!preflightData || !memberOrg) return

    const grant = preflightData.existing_grant
    const hasAllProjectsGrant =
      grant !== null && (grant?.project_refs == null || grant?.project_refs?.length === 0)
    if (!hasAllProjectsGrant && !initialProjectsData) return

    if (hasAllProjectsGrant && isProjectScopingModeEnabled) {
      setAllProjectsSelected(true)
      return
    }

    const refs = getPreselectedProjectRefs({
      existingGrant: grant,
      projectRef,
      liveProjects: initialProjectsData?.pages.flatMap((page) => page.projects) ?? [],
    })
    if (refs.length > 0) setSelectedProjectRefs(refs.slice(0, MAX_SELECTED_PROJECTS))
  }, [preflightData, initialProjectsData, memberOrg, isProjectScopingModeEnabled, projectRef])

  const { data: selectedProjectsData } = useOrgProjectsInfiniteQuery(
    {
      slug: memberOrg?.slug,
      refs: selectedProjectRefs,
    },
    {
      enabled: memberOrg != null && selectedProjectRefs.length > 0,
    }
  )
  const selectedProjects = useMemo(
    () =>
      selectedProjectsData?.pages
        .flatMap((page) => page.projects)
        .filter((project) => selectedProjectRefs.includes(project.ref)),
    [selectedProjectsData, selectedProjectRefs]
  )

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
    isProjectScopingModeEnabled && !isPendingProjects && !hasProjects && search.length === 0
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
        description="An application wants to access your Supabase Account"
      >
        <div className="flex flex-col gap-6 px-6 pb-6">
          <AlertError subject="An error occurred while loading your data" error={requestError} />
        </div>
      </InterstitialLayout>
    )
  }
  if (isErrorIdentity || (!isPendingIdentity && profile == null)) {
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

  if (isErrorPreflight && !isOAuthRoleValidationError(preflightError)) {
    return (
      <InterstitialLayout
        logo={<DestinationLogo name={request.name} />}
        title={`Authorize ${request.name}`}
        description="This application wants to access your Supabase Account"
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
    isPendingIdentity ||
    isPendingMemberOrg ||
    (isPendingInitialProjects && initialRefs.length > 0)
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
            email: profile!.primary_email,
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

  const handleDeselectFlagged = () =>
    setSelectedProjectRefs((refs) => refs.filter((ref) => !flaggedRefs.includes(ref)))

  const handleApprove = () => {
    if (hasNoSelection || isBlockedOnProjects) return
    const approveBody = usesSelectedProjects ? { project_refs: selectedProjectRefs } : {}
    approveMutation.mutate({ auth_id: authId, slug: memberOrg.slug, body: approveBody })
  }

  const handleDeny = () => {
    denyMutation.mutate({ auth_id: authId, slug: memberOrg.slug })
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
      description={
        preflightData?.existing_grant ? (
          <>
            You authorized {request.name} for this organization on{' '}
            <TimestampInfo
              className="text-sm inline-block"
              utcTimestamp={preflightData.existing_grant.approved_at}
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
        {isOAuthRoleValidationError(preflightError) && (
          <Admonition
            type="warning"
            title={`Couldn't authorize ${request.name}`}
            description={preflightError.message}
          />
        )}
        {roleFailure?.scope_target === 'all_projects' && !request.project_scoping_mode && (
          <Admonition
            type="warning"
            title={`Couldn't authorize ${request.name}`}
            description={
              <span>
                Your <strong>{roleFailure.role.name}</strong> role in{' '}
                <strong>{memberOrg.name}</strong> can't grant write access. Ask an admin to change
                your role, or switch organization.
              </span>
            }
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
            email={profile!.primary_email}
            onSignOut={handleSignOut}
            request={request}
          />
          <OrganizationSelect
            organization={memberOrg}
            onOrganizationChange={handleOrganizationChange}
          />
          {isBlockedOnProjects && (
            <NoProjectsNotice appName={request.name} organizationName={memberOrg.name} />
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
                selectedProjectRefs={selectedProjectRefs}
                selectedProjects={selectedProjects ?? []}
                onLoadMore={handleLoadMoreProjects}
              />
            </div>
          )}

          {canProceed && (
            <>
              <section className="flex flex-col gap-3">
                <p className="text-sm text-foreground">Permissions requested</p>
                {preflightData?.existing_grant?.approved_scopes != null &&
                request.scopes != null ? (
                  <ScopeGroupCardWithDiff
                    scopes={request.scopes}
                    previousScopes={preflightData.existing_grant.approved_scopes}
                  />
                ) : request.scopes != null ? (
                  <ScopeGroupCard scopes={request.scopes} />
                ) : null}
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
          <Button
            block
            variant={primaryActionVariant}
            loading={isSubmitting || isPendingPreflight}
            aria-label={primaryActionLabel}
            onClick={hasRoleFailure ? handleDeselectFlagged : handleApprove}
          >
            {isSubmitting ? 'Authorizing...' : primaryActionLabel}
          </Button>

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
