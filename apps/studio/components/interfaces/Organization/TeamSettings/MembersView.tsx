import { AlertCircle, HelpCircle } from 'lucide-react'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useProfile } from 'lib/profile'
import {
  Button,
  Loading,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import { MemberRow } from './MemberRow'

export interface MembersViewProps {
  searchString: string
}

const MembersView = ({ searchString }: MembersViewProps) => {
  const { slug } = useParams()
  const { profile } = useProfile()

  const {
    data: members,
    error: membersError,
    isLoading: isLoadingMembers,
    isError: isErrorMembers,
    isSuccess: isSuccessMembers,
  } = useOrganizationMembersQuery({ slug })
  const { error: rolesError, isError: isErrorRoles } = useOrganizationRolesV2Query({
    slug,
  })

  const allMembers = members ?? []
  const filteredMembers = (
    !searchString
      ? allMembers
      : allMembers.filter((member) => {
          if (member.invited_at) {
            return member.primary_email?.includes(searchString)
          }
          if (member.gotrue_id) {
            return (
              member.username.includes(searchString) || member.primary_email?.includes(searchString)
            )
          }
        })
  )
    .slice()
    .sort((a, b) => {
      // [Joshen] Have own account show up top
      if (a.primary_email === profile?.primary_email) return -1
      return a.username.localeCompare(b.username)
    })

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
        <div className="rounded w-full">
          <Loading active={!filteredMembers}>
            <Table
              head={[
                <Table.th key="header-user">User</Table.th>,
                <Table.th key="header-status" className="w-24" />,
                <Table.th key="header-mfa" className="text-center w-32">
                  Enabled MFA
                </Table.th>,
                <Table.th key="header-role" className="flex items-center space-x-1">
                  <span>Role</span>
                  <Tooltip_Shadcn_>
                    <TooltipTrigger_Shadcn_ asChild>
                      <Button asChild type="text" className="px-1">
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href="https://supabase.com/docs/guides/platform/access-control"
                        >
                          <HelpCircle size={14} className="text-foreground-light" />
                        </a>
                      </Button>
                    </TooltipTrigger_Shadcn_>
                    <TooltipContent_Shadcn_ side="bottom">
                      How to configure access control?
                    </TooltipContent_Shadcn_>
                  </Tooltip_Shadcn_>
                </Table.th>,
                <Table.th key="header-action" />,
              ]}
              body={[
                ...filteredMembers.map((member) => (
                  <MemberRow key={member.gotrue_id} member={member} />
                )),
                ...(searchString.length > 0 && filteredMembers.length === 0
                  ? [
                      <Table.tr key="no-results" className="bg-panel-secondary-light">
                        <Table.td colSpan={12}>
                          <div className="flex items-center space-x-3 opacity-75">
                            <AlertCircle size={16} strokeWidth={2} />
                            <p className="text-foreground-light">
                              No users matched the search query "{searchString}"
                            </p>
                          </div>
                        </Table.td>
                      </Table.tr>,
                    ]
                  : []),
                <Table.tr key="footer" className="bg-panel-secondary-light">
                  <Table.td colSpan={12}>
                    <p className="text-foreground-light">
                      {searchString ? `${filteredMembers.length} of ` : ''}
                      {allMembers.length || '0'} {allMembers.length == 1 ? 'user' : 'users'}
                    </p>
                  </Table.td>
                </Table.tr>,
              ]}
            />
          </Loading>
        </div>
      )}
    </>
  )
}

export default MembersView
