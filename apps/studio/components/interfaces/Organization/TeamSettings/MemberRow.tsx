import { ArrowRight, User } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import {
  Badge,
  cn,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  ScrollArea,
  TableCell,
  TableRow,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { isInviteExpired } from '../Organization.utils'
import { MemberActions } from './MemberActions'
import {
  getMemberAccessScopeDisplay,
  getMemberJitGrantSummary,
  getMemberRoleNames,
  isExternalCollaboratorMember,
} from './TemporaryAccessMember.utils'
import { useIsJitDbAccessEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import PartnerIcon from '@/components/ui/PartnerIcon'
import { ProfileImage } from '@/components/ui/ProfileImage'
import type { OrgMemberJitGrantSummary } from '@/data/jit-db-access/use-org-jit-grants-query'
import { useOrganizationRolesV2Query } from '@/data/organization-members/organization-roles-query'
import { OrganizationMember } from '@/data/organizations/organization-members-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useProfile } from '@/lib/profile'

interface MemberRowProps {
  member: OrganizationMember
  grantsByUserId?: Map<string, OrgMemberJitGrantSummary[]>
}

const MEMBER_ORIGIN_TO_MANAGED_BY = {
  vercel: 'vercel-marketplace',
} as const

export const MemberRow = ({ member, grantsByUserId }: MemberRowProps) => {
  const { profile } = useProfile()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const isJitDbAccessEnabled = useIsJitDbAccessEnabled()

  const { data: roles, isPending: isLoadingRoles } = useOrganizationRolesV2Query({
    slug: selectedOrganization?.slug,
  })
  const hasProjectScopedRoles = (roles?.project_scoped_roles ?? []).length > 0

  const { data: projectsData } = useOrgProjectsInfiniteQuery({
    slug: selectedOrganization?.slug,
  })
  const orgProjects =
    useMemo(() => projectsData?.pages.flatMap((page) => page.projects), [projectsData?.pages]) || []

  const isInvitedUser = Boolean(member.invited_id)
  const jitSummary =
    isJitDbAccessEnabled && grantsByUserId ? getMemberJitGrantSummary(member, grantsByUserId) : null
  const isExternalCollaborator =
    isJitDbAccessEnabled && isExternalCollaboratorMember(member, roles, { jitSummary })

  const roleNames = useMemo(
    () => getMemberRoleNames(member, roles, { isJitGuest: isExternalCollaborator }),
    [member, roles, isExternalCollaborator]
  )
  const accessScope = useMemo(
    () =>
      getMemberAccessScopeDisplay({
        member,
        roles,
        orgProjects,
        hasProjectScopedRoles,
        jitSummary,
      }),
    [member, roles, orgProjects, hasProjectScopedRoles, jitSummary]
  )

  const profileImageUrl = undefined

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
          <div className="min-w-0">
            <div className="flex items-center gap-x-3">
              <p className="text-foreground truncate">{member.primary_email}</p>
              <div className="flex items-center gap-x-2">
                {member.gotrue_id === profile?.gotrue_id && <Badge>You</Badge>}
                {isInvitedUser && member.invited_at && (
                  <Badge variant={isInviteExpired(member.invited_at) ? 'destructive' : 'warning'}>
                    {isInviteExpired(member.invited_at) ? 'Expired' : 'Invited'}
                  </Badge>
                )}
                {member.is_sso_user && <Badge variant="default">SSO</Badge>}
                {isExternalCollaborator && <Badge>Guest</Badge>}
                {(member.metadata as any)?.origin && (
                  <PartnerIcon
                    organization={{
                      managed_by:
                        MEMBER_ORIGIN_TO_MANAGED_BY[
                          (member.metadata as any)
                            .origin as keyof typeof MEMBER_ORIGIN_TO_MANAGED_BY
                        ] ?? 'supabase',
                    }}
                    tooltipText="Managed by Vercel Marketplace."
                  />
                )}
              </div>
            </div>
            {!isInvitedUser && (
              <p className="text-sm text-foreground-lighter mt-0.5 truncate">
                MFA {member.mfa_enabled ? 'enabled' : 'disabled'}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="max-w-48">
        {isLoadingRoles ? (
          <ShimmeringLoader className="w-32" />
        ) : (
          <p className="text-foreground-light truncate" title={roleNames.join(', ')}>
            {roleNames.join(', ') || '—'}
          </p>
        )}
      </TableCell>
      <TableCell className="max-w-64">
        {isLoadingRoles ? (
          <ShimmeringLoader className="w-40" />
        ) : (
          <div className="min-w-0">
            {accessScope.projectNames.length === 1 && !accessScope.isOrgWide ? (
              <span className="text-foreground-light truncate block" title={accessScope.label}>
                {accessScope.label}
              </span>
            ) : accessScope.projectNames.length > 1 && !accessScope.isOrgWide ? (
              <HoverCard openDelay={200}>
                <HoverCardTrigger asChild>
                  <button type="button" className="text-left text-foreground-light hover:underline">
                    {accessScope.label}
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="p-0">
                  <p className="p-2 text-xs text-foreground-light">
                    Access applies to {accessScope.projectNames.length} projects
                  </p>
                  <div className="border-t flex flex-col py-1">
                    <ScrollArea
                      className={cn(accessScope.projectNames.length > 5 ? 'h-[130px]' : '')}
                    >
                      {accessScope.projectNames.map((name) => {
                        const ref = orgProjects?.find((project) => project.name === name)?.ref
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
                </HoverCardContent>
              </HoverCard>
            ) : (
              <span className="text-foreground-light truncate block" title={accessScope.label}>
                {accessScope.label}
              </span>
            )}
            {accessScope.expiryMeta && (
              <p
                className="text-sm text-foreground-lighter mt-0.5 truncate"
                title={accessScope.expiryMeta}
              >
                {accessScope.expiryMeta}
              </p>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        <MemberActions member={member} />
      </TableCell>
    </TableRow>
  )
}
