import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { AuthorizeSuccessScreen } from './AuthorizeSuccessScreen'
import { AuthorizingAsCard } from './AuthorizingAsCard'
import { NoProjectsNotice } from './NoProjectsNotice'
import { CONSENT_COPY } from './OAuthAppsAuthorizeScreen.utils'
import { MAX_SELECTED_PROJECTS, ProjectMultiSelect } from './ProjectMultiSelect'
import { ScopeGroupCard } from './ScopeGroupCard'
import { useMemberOrganization } from './useMemberOrganization'
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
import { useOAuthOrgAppDetailsQuery } from '@/data/oauth-apps/oauth-apps-org-app-details-query'
import { useOAuthAppsPreflightValidationQuery } from '@/data/oauth-apps/oauth-apps-preflight-validation-query'
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

  const [selectedProjectRefs, setSelectedProjectRefs] = useState<string[]>([])
  const [allProjectsSelected, setAllProjectsSelected] = useState(false)
  const [approveRedirect, setApproveRedirect] = useState<OAuthAppsAuthorizeRedirect | null>(null)
  const [roleFailure, setRoleFailure] = useState<OAuthAppsAuthorizeRoleValidationFailure | null>(
    null
  )

  const identityQuery = useOAuthAppsAuthorizeOrganizationsQuery({ id: authId })
  const memberOrgQuery = useMemberOrganization({
    authId,
    organizationSlug,
    projectRef,
    request,
  })

  const projectsQuery = useOAuthAppsAuthorizeOrganizationProjectsQuery(
    {
      id: authId,
      slug: memberOrgQuery.data || '',
    },
    {
      enabled: !memberOrgQuery.isPending && !!memberOrgQuery.data,
    }
  )
  const appDetailsQuery = useOAuthOrgAppDetailsQuery(
    {
      slug: memberOrgQuery.data || '',
      appId: request.app_id,
    },
    {
      enabled: !memberOrgQuery.isPending && !!memberOrgQuery.data,
    }
  )

  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || !projectsQuery.data || !appDetailsQuery.data || !memberOrgQuery.data)
      return
    seeded.current = true
    if (!isProjectScopingModeEnabled) return

    const grant = appDetailsQuery.data.existing_grant
    const hasAllProjectsGrant = grant !== null && grant.project_refs.length === 0
    if (hasAllProjectsGrant && isProjectScopingModeEnabled) {
      setAllProjectsSelected(true)
      return
    }

    const refs = getPreselectedProjectRefs({
      existingGrant: grant,
      projectRef,
      liveProjects: projectsQuery.data,
    })
    if (refs.length > 0) setSelectedProjectRefs(refs.slice(0, MAX_SELECTED_PROJECTS))
  }, [
    appDetailsQuery.data,
    projectsQuery.data,
    memberOrgQuery.data,
    isProjectScopingModeEnabled,
    projectRef,
  ])

  const signOut = useSignOut()

  const preflightQuery = useOAuthAppsPreflightValidationQuery(
    {
      appId: request.app_id,
      slug: memberOrgQuery.data!,
    },
    {
      enabled: !memberOrgQuery.isPending && !!memberOrgQuery.data,
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
  const hasProjects = (projectsQuery.data?.length ?? 0) > 0

  const isBlockedOnProjects = isProjectScopingModeEnabled && !hasProjects
  const canProceed = !isBlockedOnProjects

  const grantedProjects = (projectsQuery.data ?? []).filter((project) =>
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

  if (identityQuery.isPending || memberOrgQuery.isPending) {
    return null
  }

  if (identityQuery.isError) {
    return (
      <InterstitialLayout
        logo={<DestinationLogo name={request.name} />}
        title={`Authorize ${request.name}`}
        description="This application wants to access your Supabase Account"
      >
        <div className="flex flex-col gap-6 px-6 pb-6">
          <AlertError
            subject="An error occurred while loading your data"
            error={identityQuery.error}
          />
        </div>
      </InterstitialLayout>
    )
  }

  if (memberOrgQuery.isError) {
    return (
      <InterstitialLayout
        logo={<DestinationLogo name={request.name} />}
        title={`Authorize ${request.name}`}
        description="This application wants to access your Supabase Account"
      >
        <div className="flex flex-col gap-6 px-6 pb-6">
          <AlertError
            subject="We couldn't find the organization for this application authorization"
            error={memberOrgQuery.error}
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
            email: identityQuery.data.email,
            organization_slug: memberOrgQuery.data,
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
    approveMutation.mutate({ auth_id: authId, slug: memberOrgQuery.data, body: approveBody })
  }

  const handleDeny = () => {
    denyMutation.mutate({ auth_id: authId, slug: memberOrgQuery.data })
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
      description="This application wants to access your Supabase Account"
    >
      <div className="flex flex-col gap-6 px-6 pb-6">
        {preflightQuery.data?.status === 'error' && (
          <Admonition
            type="warning"
            title={CONSENT_COPY.roleFailureAllProjects.title(request.name)}
            description={CONSENT_COPY.roleFailureAllProjects.description(memberOrgQuery.data)}
          />
        )}
        {hasRoleFailure && (
          <Admonition
            type="warning"
            title={CONSENT_COPY.roleFailure.title(flaggedRefs.length)}
            description={CONSENT_COPY.roleFailure.description(request.name)}
          />
        )}

        <fieldset disabled={isSubmitting} className="contents">
          <AuthorizingAsCard
            email={identityQuery.data.email}
            organizationSlug={memberOrgQuery.data}
            onSignOut={handleSignOut}
            request={request}
          />

          {isBlockedOnProjects && (
            <NoProjectsNotice
              appName={request.name}
              organizationSlug={memberOrgQuery.data}
              onSwitchOrg={handleSwitchOrg}
            />
          )}

          {canProceed && isProjectScopingModeEnabled && (
            <div className="flex flex-col gap-2">
              <ProjectMultiSelect
                projects={projectsQuery.data ?? []}
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
                <p className="text-sm text-foreground">Permissions requested</p>
                <ScopeGroupCard scopes={request.scopes} />
                <p className="text-xs text-foreground-lighter">
                  Authorizing {request.name} grants it access to the permissions
                  {isProjectScopingModeEnabled && !allProjectsSelected
                    ? ' and selected projects '
                    : ' '}
                  above.
                </p>
              </section>

              {grantKind === 'organization_bound' && (
                <Admonition
                  type="default"
                  title={CONSENT_COPY.organizationBoundGrant.title}
                  description={CONSENT_COPY.organizationBoundGrant.description(request.name)}
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
