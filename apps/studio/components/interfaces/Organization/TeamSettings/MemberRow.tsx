import { ArrowRight, Check, User, X } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { useParams } from 'common'
import PartnerIcon from 'components/ui/PartnerIcon'
import { ProfileImage } from 'components/ui/ProfileImage'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { OrganizationMember } from 'data/organizations/organization-members-query'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { getGitHubProfileImgUrl } from 'lib/github'
import { useProfile } from 'lib/profile'
import {
  Badge,
  HoverCardContent_Shadcn_,
  HoverCardTrigger_Shadcn_,
  HoverCard_Shadcn_,
  ScrollArea,
  TableCell,
  TableRow,
  cn,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { isInviteExpired } from '../Organization.utils'
import { MemberActions } from './MemberActions'

interface MemberRowProps {
  member: OrganizationMember
}

const MEMBER_ORIGIN_TO_MANAGED_BY = {
  vercel: 'vercel-marketplace',
} as const

export const MemberRow = ({ member }: MemberRowProps) => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const { data: roles, isPending: isLoadingRoles } = useOrganizationRolesV2Query({
    slug: selectedOrganization?.slug,
  })
  const hasProjectScopedRoles = (roles?.project_scoped_roles ?? []).length > 0

  const { data: projectsData } = useOrgProjectsInfiniteQuery({ slug })
  const orgProjects =
    useMemo(() => projectsData?.pages.flatMap((page) => page.projects), [projectsData?.pages]) || []

  const isInvitedUser = Boolean(member.invited_id)
  const isEmailUser = member.username === member.primary_email
  const isFlyUser = Boolean(member.primary_email?.endsWith('customer.fly.io'))

  const profileImageUrl =
    isInvitedUser || isEmailUser || isFlyUser ? undefined : getGitHubProfileImgUrl(member.username)

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-x-4">
          <ProfileImage
            alt={member.primary_email ?? member.username ?? ''}
            src={profileImageUrl}
            className="border rounded-full w-[32px] h-[32px] md:w-[40px] md:h-[40px]"
            placeholder={
              <div
                className={cn(
                  'w-[32px] h-[32px] md:w-[40px] md:h-[40px]',
                  'bg-surface-100 border border-overlay rounded-full text-foreground-lighter flex items-center justify-center'
                )}
              >
                <User size={20} strokeWidth={1.5} />
              </div>
            }
          />
          <div className="flex item-center gap-x-2">
            <p className="text-foreground-light truncate">{member.primary_email}</p>
            {member.gotrue_id === profile?.gotrue_id && <Badge>You</Badge>}
          </div>

          {(member.metadata as any)?.origin && (
            <PartnerIcon
              organization={{
                managed_by:
                  MEMBER_ORIGIN_TO_MANAGED_BY[
                    (member.metadata as any).origin as keyof typeof MEMBER_ORIGIN_TO_MANAGED_BY
                  ] ?? 'supabase',
              }}
              tooltipText="This user is managed by Vercel Marketplace."
            />
          )}
        </div>
      </TableCell>

      <TableCell>
        {isInvitedUser && member.invited_at && (
          <Badge variant={isInviteExpired(member.invited_at) ? 'destructive' : 'warning'}>
            {isInviteExpired(member.invited_at) ? 'Expired' : 'Invited'}
          </Badge>
        )}
        {member.is_sso_user && <Badge variant="default">SSO</Badge>}
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-center">
          {member.mfa_enabled ? (
            <Check className="text-brand" strokeWidth={2} size={20} />
          ) : (
            <X className="text-foreground-light" strokeWidth={1.5} size={20} />
          )}
        </div>
      </TableCell>

      <TableCell className="max-w-64">
        {isLoadingRoles ? (
          <ShimmeringLoader className="w-32" />
        ) : (
          member.role_ids.map((id) => {
            const orgScopedRole = (roles?.org_scoped_roles ?? []).find((role) => role.id === id)
            const projectScopedRole = (roles?.project_scoped_roles ?? []).find(
              (role) => role.id === id
            )
            const role = orgScopedRole || projectScopedRole
            const roleName = (role?.name ?? '').split('_')[0]
            const projectsApplied =
              role?.projects.length === 0
                ? orgProjects?.map((p) => p.name) ?? []
                : (role?.projects ?? [])
                    .map(({ ref }) => orgProjects?.find((p) => p.ref === ref)?.name ?? '')
                    .filter((x) => x.length > 0)

            return (
              <div key={`role-${id}`} className="flex items-center gap-x-2">
                <p>{roleName}</p>
                {hasProjectScopedRoles && (
                  <>
                    <span>•</span>
                    {projectsApplied.length === 1 ? (
                      <span className="text-foreground truncate" title={projectsApplied[0]}>
                        {projectsApplied[0]}
                      </span>
                    ) : (
                      <HoverCard_Shadcn_ openDelay={200}>
                        <HoverCardTrigger_Shadcn_ asChild>
                          <span className="text-foreground">
                            {role?.projects.length === 0
                              ? 'Organization'
                              : `${projectsApplied.length} project${projectsApplied.length > 1 ? 's' : ''}`}
                          </span>
                        </HoverCardTrigger_Shadcn_>
                        <HoverCardContent_Shadcn_ className="p-0">
                          <p className="p-2 text-xs">
                            {roleName} role applies to {projectsApplied.length} project
                            {projectsApplied.length > 1 ? 's' : ''}
                          </p>
                          <div className="border-t flex flex-col py-1">
                            <ScrollArea
                              className={cn(projectsApplied.length > 5 ? 'h-[130px]' : '')}
                            >
                              {projectsApplied.map((name) => {
                                const ref = orgProjects?.find((p) => p.name === name)?.ref
                                return (
                                  <Link
                                    key={name}
                                    href={`/project/${ref}`}
                                    className="px-2 py-1 group hover:bg-surface-300 hover:text-foreground transition flex items-center justify-between"
                                  >
                                    <span className="text-xs truncate max-w-[60%]">{name}</span>
                                    <span className="text-xs text-foreground flex items-center gap-x-1 opacity-0 group-hover:opacity-100 transition">
                                      Go to project
                                      <ArrowRight size={14} />
                                    </span>
                                  </Link>
                                )
                              })}
                            </ScrollArea>
                          </div>
                        </HoverCardContent_Shadcn_>
                      </HoverCard_Shadcn_>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}
      </TableCell>

      <TableCell>
        <MemberActions member={member} />
      </TableCell>
    </TableRow>
  )
}
