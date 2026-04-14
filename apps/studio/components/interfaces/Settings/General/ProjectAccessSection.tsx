import Link from 'next/link'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { summarizeProjectAccess } from './General.utils'
import AlertError from '@/components/ui/AlertError'
import { useOrganizationRolesV2Query } from '@/data/organization-members/organization-roles-query'
import { useOrganizationMembersQuery } from '@/data/organizations/organization-members-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProfile } from '@/lib/profile'

export const ProjectAccessSection = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { profile } = useProfile()

  const isBranch = Boolean(project?.parent_project_ref)
  const projectRef = project?.parent_project_ref ?? project?.ref

  const {
    data: organizationMembers = [],
    error: organizationMembersError,
    isPending: isLoadingOrganizationMembers,
    isError: isErrorOrganizationMembers,
  } = useOrganizationMembersQuery(
    { slug: organization?.slug },
    {
      enabled: !!organization?.slug,
    }
  )
  const {
    data: organizationRoles,
    error: organizationRolesError,
    isPending: isLoadingOrganizationRoles,
    isError: isErrorOrganizationRoles,
  } = useOrganizationRolesV2Query(
    { slug: organization?.slug },
    {
      enabled: !!organization?.slug,
    }
  )

  const userMemberData = organizationMembers.find(
    (member) => member.gotrue_id === profile?.gotrue_id
  )
  const orgScopedRoleIds = new Set(
    (organizationRoles?.org_scoped_roles ?? []).map((role) => role.id)
  )
  const hasProjectScopedRoles = (organizationRoles?.project_scoped_roles ?? []).length > 0
  const isOrgScopedRole = (userMemberData?.role_ids ?? []).some((roleId) =>
    orgScopedRoleIds.has(roleId)
  )
  const hasLimitedVisibility = hasProjectScopedRoles && !isOrgScopedRole

  const {
    visibleMembers,
    hiddenMembersCount,
    projectMemberCount,
    organizationMemberCount,
    shouldShowOrgComparison,
    hasOrganizationWideAccess,
  } = summarizeProjectAccess({
    organizationMembers,
    roles: organizationRoles,
    projectRef,
    hasLimitedVisibility,
    currentUserId: profile?.gotrue_id,
  })

  const isLoadingProjectAccess = isLoadingOrganizationMembers || isLoadingOrganizationRoles
  const isErrorProjectAccess = isErrorOrganizationMembers || isErrorOrganizationRoles
  const projectAccessError = organizationMembersError ?? organizationRolesError

  if (isBranch) return null

  const projectAccessTitle = hasLimitedVisibility
    ? 'You have limited visibility in this organization'
    : shouldShowOrgComparison && hasOrganizationWideAccess
      ? 'Organization-wide access'
      : 'Restricted project access'

  const projectAccessDescription = hasLimitedVisibility
    ? 'Your access is limited to specific projects, so you can’t see all members or settings.'
    : shouldShowOrgComparison
      ? hasOrganizationWideAccess
        ? `All ${organizationMemberCount} organization members can access this project.`
        : `${projectMemberCount} of ${organizationMemberCount} organization members can access this project.`
      : `${projectMemberCount} project member${projectMemberCount === 1 ? '' : 's'} currently ${projectMemberCount === 1 ? 'has' : 'have'} access.`

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Project access</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        {isErrorProjectAccess ? (
          <AlertError error={projectAccessError} subject="Failed to retrieve project members" />
        ) : (
          <Card>
            {isLoadingProjectAccess ? (
              <CardContent>
                <GenericSkeletonLoader />
              </CardContent>
            ) : (
              <>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col @lg:flex-row @lg:items-center @lg:justify-between gap-3">
                    <div>
                      <p className="text-sm">{projectAccessTitle}</p>
                      <p className="text-sm text-foreground-light">{projectAccessDescription}</p>
                    </div>
                    {!!organization?.slug && (
                      <Button asChild type="default">
                        <Link href={`/org/${organization.slug}/team`}>
                          {hasLimitedVisibility ? 'View team' : 'Manage members'}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>

                {visibleMembers.length > 0 ? (
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead className="w-[180px]">Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="align-top">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-foreground break-all">{member.email}</p>
                                {member.id === profile?.gotrue_id && (
                                  <Badge variant="default">You</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="align-top text-sm text-foreground-light w-[180px]">
                              {member.role ?? ''}
                            </TableCell>
                          </TableRow>
                        ))}
                        {hiddenMembersCount > 0 && (
                          <TableRow className="[&>td]:hover:bg-inherit">
                            <TableCell colSpan={2}>
                              <p className="text-sm text-foreground-lighter">
                                +{hiddenMembersCount} more project member
                                {hiddenMembersCount === 1 ? '' : 's'}
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                ) : (
                  <CardContent className="pt-0">
                    <p className="text-sm text-foreground-lighter">
                      No visible project members in your current access scope.
                    </p>
                  </CardContent>
                )}
              </>
            )}
          </Card>
        )}
      </PageSectionContent>
    </PageSection>
  )
}
