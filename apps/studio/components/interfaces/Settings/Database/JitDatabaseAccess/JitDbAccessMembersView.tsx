import { AlertCircle, HelpCircle } from 'lucide-react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useJitDbAccessMembersQuery } from 'data/jit-db-access/jit-db-access-members-query'
import { useProjectMembersQuery } from 'data/projects/project-members-query'
import { useProfile } from 'lib/profile'
import { partition } from 'lodash'
import { useMemo } from 'react'
import {
  Button,
  Loading,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Card,
} from 'ui'
import { Admonition } from 'ui-patterns'
//import { MemberRow } from './MemberRow'

export interface MembersViewProps {
  searchString: string
}

const MembersView = () => {
  const { ref } = useParams()
  const { profile } = useProfile()

  const {
    data: members = [],
    error: membersError,
    isLoading: isLoadingMembers,
    isError: isErrorMembers,
    isSuccess: isSuccessMembers,
  } = useJitDbAccessMembersQuery({ projectRef: ref })

  const {
    data: projectMembers = [],
    error: projectMembersError,
    isLoading: isLoadingProjectMembers,
    isError: isErrorProjectMembers,
    isSuccess: isSuccessProjectMembers,
  } = useProjectMembersQuery({ projectRef: ref })

  const memberMap = new Map(projectMembers.map((m) => [m.user_id, m]))

  const decoratedMembers = members.map((item) => {
    const member = memberMap.get(item.user_id)
    if (member) {
      return {
        ...item,
        primary_email: member.primary_email,
        username: member.username,
      }
    }
    return item // if no match, leave it as is
  })

  return (
    <>
      {isLoadingMembers && <GenericSkeletonLoader />}

      {isErrorMembers && (
        <AlertError error={membersError} subject="Failed to retrieve organization members" />
      )}

      {isSuccessMembers && (
        <div className="rounded w-full overflow-hidden overflow-x-scroll">
          <Card>
            <Loading active={!members}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead key="header-user">User</TableHead>
                    <TableHead key="header-status" className="w-24">
                      Roles
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {decoratedMembers.map((member) => (
                    <TableRow>
                      <TableCell>{member.primary_email}</TableCell>
                      <TableCell>{member.user_roles.map((role) => role.role)}</TableCell>
                    </TableRow>
                  ))}
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
