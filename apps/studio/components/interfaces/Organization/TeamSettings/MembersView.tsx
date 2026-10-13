import { useParams } from 'common'
import { partition } from 'lodash'
import { AlertCircle } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Card, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { MemberRow } from './MemberRow'
import { MEMBERS_GRID_CLASS, type MfaFilter } from './MembersList.constants'
import { getMemberRowHeight, matchesMfaFilter } from './TeamSettings.utils'
import { TeamSettingsDataProvider } from './TeamSettingsDataContext'
import { UpdateRolesPanel } from './UpdateRolesPanel/UpdateRolesPanel'
import { AlertError } from '@/components/ui/AlertError'
import {
  InfiniteListItems,
  InfiniteListScrollWrapper,
  InfiniteListSizer,
} from '@/components/ui/InfiniteList'
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

// All members are loaded up front, so there is never a loader row to render
const NoLoader = () => null

const getMemberKey = (member: OrganizationMember) =>
  member.gotrue_id ?? `invite-${member.invited_id}`

export interface MembersViewProps {
  searchString: string
  mfaFilter: MfaFilter
}

export const MembersView = ({ searchString, mfaFilter }: MembersViewProps) => {
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
    const searchedMembers = !searchString
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

    return searchedMembers.filter((member) => matchesMfaFilter(member, mfaFilter))
  }, [members, searchString, mfaFilter])

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

  const listedMembers = useMemo(
    () => (user ? [user, ...sortedMembers] : sortedMembers),
    [user, sortedMembers]
  )
  const getItemKey = useCallback(
    (index: number) => getMemberKey(listedMembers[index]),
    [listedMembers]
  )
  const getItemSize = useCallback(
    (index: number) => getMemberRowHeight(listedMembers[index]),
    [listedMembers]
  )

  const isFiltering = searchString.length > 0 || mfaFilter !== 'all'
  const hasLimitedVisibility = isSuccessRoles && isSuccessMembers && !isOrgScopedRole

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
        <div className="rounded-sm w-full overflow-hidden overflow-x-auto">
          <Card className="min-w-[760px]">
            {hasLimitedVisibility && (
              <Admonition
                type="note"
                title="You have limited visibility in this organization"
                description="Your access is limited to specific projects, so you can’t see all members or settings."
                className="border-0 border-b rounded-none"
              />
            )}

            <div role="table" aria-label="Members" aria-rowcount={listedMembers.length + 1}>
              <InfiniteListScrollWrapper
                className="max-h-[70vh]"
                items={listedMembers}
                getItemKey={getItemKey}
                getItemSize={getItemSize}
              >
                <div
                  role="row"
                  aria-rowindex={1}
                  className={cn(
                    MEMBERS_GRID_CLASS,
                    'sticky top-0 z-10 h-10 border-b bg-surface-100 heading-meta text-foreground-lighter'
                  )}
                >
                  <div role="columnheader">Member</div>
                  <div role="columnheader">MFA</div>
                  <div role="columnheader">Role</div>
                  <div role="columnheader">
                    <span className="sr-only">Actions</span>
                  </div>
                </div>

                <InfiniteListSizer>
                  <InfiniteListItems
                    items={listedMembers}
                    ItemComponent={MemberRow}
                    LoaderComponent={NoLoader}
                  />
                </InfiniteListSizer>
              </InfiniteListScrollWrapper>
            </div>

            {isFiltering && filteredMembers.length === 0 && (
              <div className="flex items-center gap-x-3 p-4">
                <AlertCircle size={16} strokeWidth={2} className="text-foreground-lighter" />
                <p className="text-foreground-lighter text-sm">
                  {searchString.length > 0
                    ? `No members matched the search query "${searchString}"`
                    : 'No members match the selected MFA filter'}
                </p>
              </div>
            )}

            <div className="px-4 py-3 text-sm text-foreground-muted border-t">
              {isFiltering
                ? `${filteredMembers.length} of ${members.length} ${members.length === 1 ? 'member' : 'members'}`
                : `${members.length || 0} ${members.length === 1 ? 'member' : 'members'}`}
            </div>
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
