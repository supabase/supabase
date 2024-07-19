import { Check, Minus, User, X } from 'lucide-react'
import Image from 'next/legacy/image'
import { useState } from 'react'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { OrganizationMember } from 'data/organizations/organization-members-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useIsOptedIntoProjectLevelPermissions } from 'hooks/ui/useFlag'
import { useProfile } from 'lib/profile'
import { Badge, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_ } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { getUserDisplayName, isInviteExpired } from '../Organization.utils'
import { MemberActions } from './MemberActions'

interface MemberRowProps {
  member: OrganizationMember
}

export const MemberRow = ({ member }: MemberRowProps) => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const { data: projects } = useProjectsQuery()
  const selectedOrganization = useSelectedOrganization()
  const [hasInvalidImg, setHasInvalidImg] = useState(false)
  const isOptedIntoProjectLevelPermissions = useIsOptedIntoProjectLevelPermissions(slug as string)

  const { data: roles, isLoading: isLoadingRoles } = useOrganizationRolesV2Query({
    slug: selectedOrganization?.slug,
  })

  const memberIsUser = member.gotrue_id == profile?.gotrue_id
  const isInvitedUser = Boolean(member.invited_id)
  const isEmailUser = member.username === member.primary_email
  const isFlyUser = Boolean(member.primary_email?.endsWith('customer.fly.io'))

  // [Joshen] From project role POV, mask any roles for other projects
  const isObfuscated =
    member.role_ids.filter((id) => {
      const role = [
        ...(roles?.org_scoped_roles ?? []),
        ...(roles?.project_scoped_roles ?? []),
      ].find((role) => role.id === id)
      const isOrgScope = role?.project_ids === null
      if (isOrgScope) return false

      const appliedProjects = (role?.project_ids ?? [])
        .map((id) => {
          return projects?.find((p) => p.id === id)?.name ?? ''
        })
        .filter((x) => x.length > 0)

      return appliedProjects.length === 0
    }).length > 0

  return (
    <Table.tr>
      <Table.td>
        <div className="flex items-center space-x-4">
          <div>
            {isInvitedUser || isEmailUser || isFlyUser || hasInvalidImg ? (
              <div className="w-[40px] h-[40px] bg-surface-100 border border-overlay rounded-full text-foreground-lighter flex items-center justify-center">
                <User size={20} strokeWidth={1.5} />
              </div>
            ) : (
              <Image
                alt={member.username}
                src={`https://github.com/${member.username}.png?size=80`}
                width="40"
                height="40"
                className="border rounded-full"
                onError={() => {
                  setHasInvalidImg(true)
                }}
              />
            )}
          </div>
          <div className="flex item-center gap-x-2">
            {isInvitedUser === undefined ? (
              <p className="text-foreground-light truncate">{member.primary_email}</p>
            ) : (
              <p className="text-foreground truncate">{getUserDisplayName(member)}</p>
            )}
            {member.primary_email === profile?.primary_email && <Badge color="scale">You</Badge>}
          </div>
        </div>
      </Table.td>

      <Table.td>
        {isInvitedUser && member.invited_at && (
          <Badge variant={isInviteExpired(member.invited_at) ? 'destructive' : 'warning'}>
            {isInviteExpired(member.invited_at) ? 'Expired' : 'Invited'}
          </Badge>
        )}
      </Table.td>

      <Table.td>
        <div className="flex items-center justify-center">
          {member.mfa_enabled ? (
            <Check className="text-brand" strokeWidth={2} size={20} />
          ) : (
            <X className="text-foreground-light" strokeWidth={1.5} size={20} />
          )}
        </div>
      </Table.td>

      <Table.td className="max-w-64">
        {isLoadingRoles ? (
          <ShimmeringLoader className="w-32" />
        ) : isObfuscated ? (
          <Minus strokeWidth={1.5} size={20} />
        ) : (
          member.role_ids.map((id) => {
            const orgScopedRole = (roles?.org_scoped_roles ?? []).find((role) => role.id === id)
            const projectScopedRole = (roles?.project_scoped_roles ?? []).find(
              (role) => role.id === id
            )
            const role = orgScopedRole || projectScopedRole
            const roleName = (role?.name ?? '').split('_')[0]
            const projectsApplied =
              role?.project_ids === null
                ? projects?.map((p) => p.name) ?? []
                : (role?.project_ids ?? [])
                    .map((id) => {
                      return projects?.find((p) => p.id === id)?.name ?? ''
                    })
                    .filter((x) => x.length > 0)

            if (projectsApplied.length === 0) return null

            return (
              <div key={`role-${id}`} className="flex items-center gap-x-2">
                <p>{roleName}</p>
                {isOptedIntoProjectLevelPermissions && (
                  <>
                    <span>•</span>
                    {projectsApplied.length === 1 ? (
                      <span className="text-foreground truncate" title={projectsApplied[0]}>
                        {projectsApplied[0]}
                      </span>
                    ) : (
                      <Tooltip_Shadcn_>
                        <TooltipTrigger_Shadcn_ asChild>
                          <span className="text-foreground">
                            {role?.project_ids === null
                              ? 'Organization'
                              : `${projectsApplied.length} project${projectsApplied.length > 1 ? 's' : ''}`}
                          </span>
                        </TooltipTrigger_Shadcn_>
                        <TooltipContent_Shadcn_ side="bottom" className="flex flex-col gap-y-1">
                          {projectsApplied
                            ?.slice(0, 2)
                            .map((name) => <span key={name}>{name}</span>)}
                          {projectsApplied.length > 2 && (
                            <span>
                              And {projectsApplied.length - 2} other project
                              {projectsApplied.length > 4 ? 's' : ''}
                            </span>
                          )}
                        </TooltipContent_Shadcn_>
                      </Tooltip_Shadcn_>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}
      </Table.td>

      <Table.td>{!memberIsUser && <MemberActions member={member} />}</Table.td>
    </Table.tr>
  )
}
