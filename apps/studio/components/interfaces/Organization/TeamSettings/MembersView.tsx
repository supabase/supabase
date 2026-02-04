import { AlertCircle, HelpCircle } from 'lucide-react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { DOCS_URL } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { partition } from 'lodash'
import { useMemo } from 'react'
import {
  Button,
  Card,
  Loading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { MemberRow } from './MemberRow'

export interface MembersViewProps {
  searchString: string
}

const MembersView = ({ searchString }: MembersViewProps) => {
  const { slug } = useParams()
  const { profile } = useProfile()

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
    isSuccess: isSuccessRoles,
    isError: isErrorRoles,
  } = useOrganizationRolesV2Query({
    slug,
  })

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
        })
  }, [members, searchString])

  const [[user], _otherMembers] = partition(
    filteredMembers,
    (m) => m.gotrue_id === profile?.gotrue_id
  )

  const userMember = members.find((m) => m.gotrue_id === profile?.gotrue_id)
  const orgScopedRoleIds = (roles?.org_scoped_roles ?? []).map((r) => r.id)
  const isOrgScopedRole = orgScopedRoleIds.includes(userMember?.role_ids?.[0] ?? -1)

  // [Joshen] Temp wait on API level changes but I think it makes sense to hide invites for
  // project scoped users since they can't see other members to begin with. Not a security issue nonetheless
  const otherMembers = isOrgScopedRole
    ? _otherMembers
    : _otherMembers.filter((x) => !('invited_id' in x))
  const sortedMembers = otherMembers.sort((a, b) =>
    (a.primary_email ?? '').localeCompare(b.primary_email ?? '')
  )

  return (
    <>
      {isLoadingMembers && <GenericSkeletonLoader />}

      {isErrorMembers && (
        <AlertError error={membersError} subject="Failed to retrieve organization members" />
      )}

      {isErrorRoles && (
        <AlertError error={rolesError} subject="Failed to retrieve organization roles" />
      )}

      {isSuccessMembers && (
        <div className="rounded w-full overflow-hidden overflow-x-scroll">
          <Card>
            <Loading active={!filteredMembers}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead key="header-user">User</TableHead>
                    <TableHead key="header-status" className="w-24" />
                    <TableHead key="header-mfa" className="text-center w-32">
                      Enabled MFA
                    </TableHead>
                    <TableHead key="header-role" className="flex items-center space-x-1">
                      <span>Role</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild type="text" className="px-1">
                            <a
                              target="_blank"
                              rel="noreferrer"
                              href={`${DOCS_URL}/guides/platform/access-control`}
                            >
                              <HelpCircle size={14} className="text-foreground-light" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          How to configure access control?
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead key="header-action" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {[
                    ...(isSuccessRoles && isSuccessMembers && !isOrgScopedRole
                      ? [
                          <TableRow key="project-scope-notice">
                            <TableCell colSpan={12} className="!p-0">
                              <Admonition
                                type="note"
                                title="You are currently assigned with project scoped roles in this organization"
                                description="All other members within the organization will not be visible to you"
                                className="bg-alternative border-0 rounded-none"
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
                                  No users matched the search query "{searchString}"
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>,
                        ]
                      : []),
                    <TableRow key="footer" className="bg-panel-secondary-light">
                      <TableCell colSpan={12}>
                        <p className="text-foreground-light">
                          {searchString ? `${filteredMembers.length} of ` : ''}
                          {members.length || '0'} {members.length == 1 ? 'user' : 'users'}
                        </p>
                      </TableCell>
                    </TableRow>,
                  ]}
                </TableBody>
              </Table>
            </Loading>
          </Card>
        </div>
      )}
    </>
  )
}

export default MembersView
