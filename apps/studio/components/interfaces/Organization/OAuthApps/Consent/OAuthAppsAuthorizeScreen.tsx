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
import { useOAuthAppsAuthorizeApproveMutation } from '@/data/oauth-apps/oauth-apps-authorize-approve-mutation'
import { useOAuthAppsAuthorizeDenyMutation } from '@/data/oauth-apps/oauth-apps-authorize-deny-mutation'
import { useOAuthAppsAuthorizeOrganizationProjectsQuery } from '@/data/oauth-apps/oauth-apps-authorize-organization-projects-query'
import { useOAuthAppsAuthorizeOrganizationsQuery } from '@/data/oauth-apps/oauth-apps-authorize-organizations-query'
import type { OAuthAppsAuthorizeRequest } from '@/data/oauth-apps/oauth-apps-authorize-request-query'
import type {
  OAuthAppsAuthorizeRedirect,
  OAuthAppsAuthorizeRoleValidationFailure,
  OAuthGrantProjectScope,
} from '@/data/oauth-apps/types'
import {
  getFailedProjects,
  getOAuthConsentModel,
  getScopedProjectRefs,
  isAllProjectsScope,
  isRoleValidationFailure,
} from '@/data/oauth-apps/types'
import { useSignOut } from '@/lib/auth'

export interface OAuthAppsAuthorizeScreenProps {
  authId: string
  request: OAuthAppsAuthorizeRequest
  organizationSlug?: string
  navigate: (destination: string) => void
}

export const OAuthAppsAuthorizeScreen = ({
  authId,
  request,
  organizationSlug,
  navigate,
}: OAuthAppsAuthorizeScreenProps) => {
  const model = getOAuthConsentModel(request.grant_config)
  const grantKind = model.grant_kind
  const projectSelection = model.project_selection
  const showProjectPicker = projectSelection !== 'off'
  const allowAllProjects = projectSelection === 'optional'
  const isDynamicClient = request.grant_config.is_dynamic_client

  const { data: identity } = useOAuthAppsAuthorizeOrganizationsQuery({ id: authId })

  const [selectedProjectRefs, setSelectedProjectRefs] = useState<string[]>([])
  const [allProjectsSelected, setAllProjectsSelected] = useState(false)
  const [approveRedirect, setApproveRedirect] = useState<OAuthAppsAuthorizeRedirect | null>(null)
  const [roleFailure, setRoleFailure] = useState<OAuthAppsAuthorizeRoleValidationFailure | null>(
    null
  )

  const orgSlug = organizationSlug ?? identity?.organizations[0]?.slug
  const memberOrg = identity?.organizations.find((org) => org.slug === orgSlug)

  const { data: projects } = useOAuthAppsAuthorizeOrganizationProjectsQuery({
    id: authId,
    slug: orgSlug,
  })

  const seededFromExistingGrant = useRef(false)
  useEffect(() => {
    const grant = request.existing_grant
    if (seededFromExistingGrant.current || !grant || !projects) return
    seededFromExistingGrant.current = true

    if (isAllProjectsScope(grant.project_scope)) {
      if (allowAllProjects) setAllProjectsSelected(true)
      return
    }

    const liveRefs = getScopedProjectRefs(grant.project_scope).filter((ref) =>
      projects.some((project) => project.ref === ref)
    )
    if (liveRefs.length > 0) setSelectedProjectRefs(liveRefs.slice(0, MAX_SELECTED_PROJECTS))
  }, [request.existing_grant, projects, allowAllProjects])

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

  if (!identity || !orgSlug || !memberOrg) return null

  const isBlockedOnProjects = showProjectPicker && !hasProjects
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
    : `Authorize ${request.app_name}`
  const primaryActionVariant = hasRoleFailure || isSubmitting ? 'default' : 'primary'

  const usesSelectedProjects = showProjectPicker && !allProjectsSelected
  const hasNoSelection = usesSelectedProjects && selectedProjectRefs.length === 0

  const projectScope: OAuthGrantProjectScope = usesSelectedProjects
    ? { target: 'selected_projects', project_refs: selectedProjectRefs }
    : { target: 'all_projects' }

  if (approveRedirect) {
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
            project_scope: projectScope,
            projects: grantedProjects,
            scope_groups: request.scope_groups,
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
    approveMutation.mutate({
      auth_id: authId,
      slug: orgSlug,
      project_scope: projectScope,
    })
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
      logo={
        <LogoPair left={<DestinationLogo name={request.app_name} />} right={<SupabaseLogo />} />
      }
      title={`Authorize ${request.app_name}`}
      description="This application wants to access your Supabase Account"
    >
      <div className="flex flex-col gap-6 px-6 pb-6">
        {!request.is_verified && (
          <Admonition type="warning" description={CONSENT_COPY.unverifiedPublisher} />
        )}

        {hasRoleFailure && (
          <Admonition
            type="destructive"
            title={CONSENT_COPY.roleFailure.title(flaggedRefs.length)}
            description={CONSENT_COPY.roleFailure.description(request.app_name)}
          />
        )}

        <fieldset disabled={isSubmitting} className="contents">
          <AuthorizingAsCard
            email={identity.email}
            organizationSlug={memberOrg.slug}
            grantKind={grantKind}
            onSignOut={handleSignOut}
          />

          {isBlockedOnProjects && (
            <NoProjectsNotice
              appName={request.app_name}
              organizationSlug={orgSlug}
              onSwitchOrg={handleSwitchOrg}
            />
          )}

          {canProceed && showProjectPicker && (
            <div className="flex flex-col gap-2">
              <ProjectMultiSelect
                projects={projects ?? []}
                selectedRefs={selectedProjectRefs}
                onChange={setSelectedProjectRefs}
                maxSelected={MAX_SELECTED_PROJECTS}
                error={hasNoSelection ? CONSENT_COPY.selectionRequired : undefined}
                flaggedRefs={flaggedRefs}
                unavailableRefs={getFailedProjects(roleFailure).map((project) => project.ref)}
                showAllProjectsOption={allowAllProjects}
                allProjectsSelected={allProjectsSelected}
                onAllProjectsChange={setAllProjectsSelected}
              />
              {isDynamicClient && (
                <p className="text-xs text-foreground-lighter">{CONSENT_COPY.dynamicClient}</p>
              )}
            </div>
          )}

          {canProceed && (
            <>
              <ScopeGroupCard appName={request.app_name} scopeGroups={request.scope_groups} />

              {!showProjectPicker && (
                <Admonition
                  type="default"
                  title={CONSENT_COPY.coversEveryProject.title}
                  description={CONSENT_COPY.coversEveryProject.description(
                    request.app_name,
                    orgSlug
                  )}
                />
              )}

              {request.reuses_grant_across_workspaces && (
                <Admonition type="default" description={CONSENT_COPY.workspaceReuse} />
              )}

              {grantKind === 'organization_bound' && (
                <Admonition
                  type="default"
                  title={CONSENT_COPY.organizationBoundGrant.title}
                  description={CONSENT_COPY.organizationBoundGrant.description(
                    request.app_name,
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
