import { useParams } from 'common'
import { partition } from 'lodash'
import { AlertCircle } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  Card,
  Loading,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { MemberRow } from './MemberRow'
import { TeamSettingsDataProvider } from './TeamSettingsDataContext'
import { UpdateRolesPanel } from './UpdateRolesPanel/UpdateRolesPanel'
import { AlertError } from '@/components/ui/AlertError'
import { useOrganizationRolesV2Query } from '@/data/organization-members/organization-roles-query'
import {
  useOrganizationMembersQuery,
  type OrganizationMember,
} from '@/data/organizations/organization-members-query'
import { usePermissionsQuery } from '@/data/permissions/permissions-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useProfile } from '@/lib/profile'

export interface MembersViewProps {
  searchString: string
}

export const MembersView = ({ searchString }: MembersViewProps) => {
  const { slug } = useParams()
  const { profile } = useProfile()

  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: permissions } = usePermissionsQuery()
  const organizationMembersDeletionEnabled = useIsFeatureEnabled('organization_members:delete')

  const [memberForRoleUpdate, setMemberForRoleUpdate] = useState<OrganizationMember>()
  const [showRoleUpdatePanel, setShowRoleUpdatePanel] = useState(false)

  const {
    data: members = [],
    error: membersError,
    isPending: isLoadingMembers,
    isError: isErrorMembers,
    isSuccess: isSuccessMembers,
  } = useOrganizationMembersQuery({ slug })
  const {
    data: roles,
    error: rolesError,
    isPending: isLoadingRoles,
    isSuccess: isSuccessRoles,
    isError: isErrorRoles,
  } = useOrganizationRolesV2Query({
    slug,
  })

  const { data: projectsData } = useOrgProjectsInfiniteQuery({ slug })
  const orgProjects = useMemo(
    () => projectsData?.pages.flatMap((page) => page.projects) ?? [],
    [projectsData?.pages]
  )

  const filteredMembers = useMemo(() => {
    return !searchString
      ? members
      : members.filter((member) => {
          if (member.invited_at) {
            return member.primary_email?.includes(searchString)
          }
          if (member.gotrue_id) {
            return (
              member.username.includes(searchString) || member.primary_email?.includes(searchString)
            )
          }
          return false
        })
  }, [members, searchString])

  const handleManageAccess = useCallback((member: OrganizationMember) => {
    setMemberForRoleUpdate(member)
    setShowRoleUpdatePanel(true)
  }, [])

  const userMember = members.find((m) => m.gotrue_id === profile?.gotrue_id)
  const orgScopedRoleIds = (roles?.org_scoped_roles ?? []).map((r) => r.id)
  const isOrgScopedRole = orgScopedRoleIds.includes(userMember?.role_ids?.[0] ?? -1)

  const { user, sortedMembers } = useMemo(() => {
    const [[currentUser], _otherMembers] = partition(
      filteredMembers,
      (m) => m.gotrue_id === profile?.gotrue_id
    )

    // [Joshen] Temp wait on API level changes but I think it makes sense to hide invites for
    // project scoped users since they can't see other members to begin with. Not a security issue nonetheless
    const otherMembers = isOrgScopedRole
      ? _otherMembers
      : _otherMembers.filter((x) => !('invited_id' in x))
    const sorted = [...otherMembers].sort((a, b) =>
      (a.primary_email ?? '').localeCompare(b.primary_email ?? '')
    )

    return { user: currentUser, sortedMembers: sorted }
  }, [filteredMembers, profile?.gotrue_id, isOrgScopedRole])

  return (
    <TeamSettingsDataProvider
      members={members}
      roles={roles}
      isLoadingRoles={isLoadingRoles}
      orgProjects={orgProjects}
      permissions={permissions}
      selectedOrganization={selectedOrganization}
      organizationMembersDeletionEnabled={organizationMembersDeletionEnabled}
      onManageAccess={handleManageAccess}
    >
      {isLoadingMembers && <GenericSkeletonLoader />}

      {isErrorMembers && (
        <AlertError error={membersError} subject="Failed to retrieve organization members" />
      )}

      {isErrorRoles && (
        <AlertError error={rolesError} subject="Failed to retrieve organization roles" />
      )}

      {isSuccessMembers && (
        <div className="rounded-sm w-full overflow-hidden overflow-x-scroll">
          <Card>
            <Loading active={!filteredMembers}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead key="header-user">Member</TableHead>
                    <TableHead key="header-mfa">MFA</TableHead>
                    <TableHead key="header-role">Role</TableHead>
                    <TableHead key="header-action" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {[
                    ...(isSuccessRoles && isSuccessMembers && !isOrgScopedRole
                      ? [
                          <TableRow key="project-scope-notice">
                            <TableCell colSpan={12} className="p-0!">
                              <Admonition
                                type="note"
                                title="You have limited visibility in this organization"
                                description="Your access is limited to specific projects, so you can’t see all members or settings."
                                className="border-0 rounded-none"
                              />
                            </TableCell>
                          </TableRow>,
                        ]
                      : []),
                    ...(!!user ? [<MemberRow key={user.gotrue_id} member={user} />] : []),
                    ...sortedMembers.map((member) => (
                      <MemberRow key={member.gotrue_id} member={member} />
                    )),
                    ...(searchString.length > 0 && filteredMembers.length === 0
                      ? [
                          <TableRow key="no-results" className="bg-panel-secondary-light">
                            <TableCell colSpan={12}>
                              <div className="flex items-center space-x-3 opacity-75">
                                <AlertCircle size={16} strokeWidth={2} />
                                <p className="text-foreground-light">
                                  No members matched the search query "{searchString}"
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>,
                        ]
                      : []),
                  ]}
                </TableBody>
                <TableFooter className="font-normal">
                  <TableRow className="border-b-0 [&>td]:hover:bg-inherit">
                    <TableCell colSpan={4} className="text-foreground-muted">
                      {searchString
                        ? `${filteredMembers.length} of ${members.length} ${members.length === 1 ? 'member' : 'members'}`
                        : `${members.length || 0} ${members.length === 1 ? 'member' : 'members'}`}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </Loading>
          </Card>
        </div>
      )}

      {memberForRoleUpdate && (
        <UpdateRolesPanel
          visible={showRoleUpdatePanel}
          member={memberForRoleUpdate}
          onClose={() => setShowRoleUpdatePanel(false)}
        />
      )}
    </TeamSettingsDataProvider>
  )
}
