import { useQueries } from '@tanstack/react-query'

import { oauthAppsKeys } from '@/data/oauth-apps/keys'
import { USE_MOCKS } from '@/data/oauth-apps/mocks'
import { getOAuthAppsAuthorizeOrganizationProjects } from '@/data/oauth-apps/oauth-apps-authorize-organization-projects-query'
import { useOAuthAppsAuthorizeOrganizationsQuery } from '@/data/oauth-apps/oauth-apps-authorize-organizations-query'
import { OAuthAppsAuthorizeRequest } from '@/data/oauth-apps/types'

export interface OAuthAppsAuthorizeScreenProps {
  authId: string
  request: OAuthAppsAuthorizeRequest
  organizationSlug?: string
  projectRef?: string | null
}

export const useMemberOrganization = ({
  authId,
  organizationSlug,
  projectRef = null,
  request,
}: Omit<OAuthAppsAuthorizeScreenProps, 'navigate'>):
  | { isPending: false; isError: true; error: Error; data: null }
  | { isPending: true; isError: false; error: null; data: null }
  | { isPending: false; isError: false; error: null; data: string } => {
  const isProjectScopingModeEnabled = request.project_scoping_mode
  const needsOrgResolution = isProjectScopingModeEnabled && !organizationSlug && projectRef !== null
  const identityQuery = useOAuthAppsAuthorizeOrganizationsQuery({ id: authId })

  const resolveOrgFromProjectQuery = useQueries({
    queries: (identityQuery.data?.organizations ?? []).map((organization) => ({
      queryKey: oauthAppsKeys.authorizeOrganizationProjects(authId, organization.slug),
      queryFn: () =>
        getOAuthAppsAuthorizeOrganizationProjects({ id: authId, slug: organization.slug }),
      enabled: USE_MOCKS && needsOrgResolution && identityQuery.isSuccess,
    })),
    combine: (queries) => {
      // When combine is called, this cannot be null/undefined as it's a condition for the query to be enabled
      // TS doesn't know though
      if (!identityQuery.data) {
        return {
          isPending: true,
          isError: false,
        }
      }

      const owners = identityQuery.data.organizations.filter((_, index) =>
        (queries[index].data ?? []).some((project) => project.ref === projectRef)
      )
      return {
        isPending: queries.some((query) => query.isPending),
        isError: queries.some((query) => query.isError),
        error: queries.find((query) => !!query.error)?.error,
        data: owners.length === 1 ? owners[0].slug : undefined,
      }
    },
  })

  if (identityQuery.isPending) {
    return {
      isPending: true,
      isError: false,
      data: null,
      error: null,
    }
  }

  if (identityQuery.isError) {
    return {
      isPending: false,
      isError: true,
      data: null,
      error: identityQuery.error,
    }
  }

  // An organization slug was provided
  if (organizationSlug != null) {
    const organization = identityQuery.data?.organizations.find(
      (org) => org.slug === organizationSlug
    )

    if (organization) {
      return {
        isPending: false,
        isError: false,
        data: organization.slug,
        error: null,
      }
    }

    return {
      isPending: false,
      isError: true,
      data: null,
      error: new Error(`You are not part of organization ${organizationSlug}`),
    }
  }

  // No organization slug was provided, nor a project ref, fallback to the first user org if available
  if (!needsOrgResolution) {
    if (identityQuery.data.organizations.length > 0) {
      return {
        isPending: false,
        isError: false,
        data: identityQuery.data?.organizations[0].slug,
        error: null,
      }
    }

    return {
      isPending: false,
      isError: true,
      data: null,
      error: new Error('No organizations found'),
    }
  }

  // A project ref was provided and the authorization request is scoped to projects
  if (resolveOrgFromProjectQuery.isPending) {
    return {
      isPending: true,
      isError: false,
      data: null,
      error: null,
    }
  }

  if (resolveOrgFromProjectQuery.isError) {
    return {
      isPending: false,
      isError: true,
      data: null,
      error: resolveOrgFromProjectQuery.error!,
    }
  }

  const orgSlug = resolveOrgFromProjectQuery.data ?? identityQuery.data?.organizations[0]?.slug
  const memberOrg = identityQuery.data?.organizations.find((org) => org.slug === orgSlug)
  if (!memberOrg) {
    return {
      isPending: false,
      isError: true,
      data: null,
      error: new Error('No organizations found'),
    }
  }

  return {
    isPending: false,
    isError: false,
    data: memberOrg.slug,
    error: null,
  }
}
