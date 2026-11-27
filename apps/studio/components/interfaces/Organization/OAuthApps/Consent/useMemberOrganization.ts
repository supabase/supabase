import { useMemo } from 'react'

import { OAuthAppsAuthorizeRequestData } from '@/data/oauth-apps/oauth-apps-authorize-request-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { Organization } from '@/types'

export interface OAuthAppsAuthorizeScreenProps {
  authId?: string
  request?: OAuthAppsAuthorizeRequestData
  organizationSlug?: string
  projectRef?: string
}

export const useMemberOrganization = ({
  organizationSlug,
  projectRef,
  request,
}: Omit<OAuthAppsAuthorizeScreenProps, 'navigate'>):
  | { isPending: false; isError: true; error: Error; data: null }
  | { isPending: true; isError: false; error: null; data: null }
  | {
      isPending: false
      isError: false
      error: null
      data: Organization
    } => {
  const organizationsQuery = useOrganizationsQuery()
  const projectQuery = useProjectDetailQuery(
    {
      ref: projectRef ?? undefined,
      skipWake: true,
    },
    {
      enabled: projectRef != null,
    }
  )

  return useMemo(() => {
    if (!request) {
      return {
        isPending: true,
        isError: false,
        data: null,
        error: null,
      }
    }
    const isProjectScopingModeEnabled = request?.project_scoping_mode
    const needsOrgResolution =
      isProjectScopingModeEnabled && !organizationSlug && projectRef != null

    if (organizationsQuery.isPending) {
      return {
        isPending: true,
        isError: false,
        data: null,
        error: null,
      }
    }

    if (organizationsQuery.isError) {
      return {
        isPending: false,
        isError: true,
        data: null,
        error: organizationsQuery.error,
      }
    }

    // An organization slug was provided
    if (organizationSlug != null) {
      const organization = organizationsQuery.data.find((org) => org.slug === organizationSlug)

      if (organization) {
        return {
          isPending: false,
          isError: false,
          data: organization,
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
      if (organizationsQuery.data.length > 0) {
        return {
          isPending: false,
          isError: false,
          data: organizationsQuery.data[0],
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
    if (projectQuery.isPending) {
      return {
        isPending: true,
        isError: false,
        data: null,
        error: null,
      }
    }
    if (projectQuery.isError) {
      return {
        isPending: false,
        isError: true,
        data: null,
        error: projectQuery.error,
      }
    }

    const memberOrg = organizationsQuery.data.find(
      (org) => org.id === projectQuery.data.organization_id
    )
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
      data: memberOrg,
      error: null,
    }
  }, [organizationSlug, projectRef, request, organizationsQuery, projectQuery])
}
