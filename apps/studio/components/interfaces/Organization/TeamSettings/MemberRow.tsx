import { ArrowRight, Check, ChevronRight, User, X } from 'lucide-react'
import Link from 'next/link'
import { memo, useMemo } from 'react'
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
import { useTeamSettingsData } from './TeamSettingsDataContext'
import PartnerIcon from '@/components/ui/PartnerIcon'
import { ProfileImage } from '@/components/ui/ProfileImage'
import { OrganizationRole } from '@/data/organization-members/organization-roles-query'
import { OrganizationMember } from '@/data/organizations/organization-members-query'
import { useProfile } from '@/lib/profile'

interface MemberRowProps {
  member: OrganizationMember
}

const MEMBER_ORIGIN_TO_MANAGED_BY = {
  vercel: 'vercel-marketplace',
} as const

export const MemberRow = memo(function MemberRow({ member }: MemberRowProps) {
  const { profile } = useProfile()
  const { roles, isLoadingRoles, orgProjects } = useTeamSettingsData()

  const hasProjectScopedRoles = (roles?.project_scoped_roles ?? []).length > 0

  const isInvitedUser = Boolean(member.invited_id)

  // Use generic avatar for all team members instead of attempting to fetch from GitHub
  const profileImageUrl = undefined

  const roleById = useMemo(() => {
    const map = new Map<number, OrganizationRole>()
    for (const role of roles?.org_scoped_roles ?? []) map.set(role.id, role)
    for (const role of roles?.project_scoped_roles ?? []) map.set(role.id, role)
    return map
  }, [roles])

  const projectNameByRef = useMemo(
    () => new Map(orgProjects.map((p) => [p.ref, p.name])),
    [orgProjects]
  )

  const roleRows = useMemo(() => {
    return member.role_ids.map((id) => {
      const role = roleById.get(id)
      const roleName = (role?.name ?? '').split('_')[0]
      const appliesToAllProjects = role?.projects.length === 0
      const projectsApplied = appliesToAllProjects
        ? orgProjects.map((p) => ({ ref: p.ref, name: p.name }))
        : (role?.projects ?? [])
            .map(({ ref }) => ({ ref, name: projectNameByRef.get(ref) ?? '' }))
            .filter(({ name }) => name.length > 0)

      return { id, roleName, appliesToAllProjects, projectsApplied }
    })
  }, [member.role_ids, roleById, orgProjects, projectNameByRef])

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
          <div className="flex item-center gap-x-3">
            <p className="text-foreground-light truncate">{member.primary_email}</p>
            <div className="flex items-center gap-x-2">
              {member.gotrue_id === profile?.gotrue_id && <Badge>You</Badge>}
              {isInvitedUser && member.invited_at && (
                <Badge variant={isInviteExpired(member.invited_at) ? 'destructive' : 'warning'}>
                  {isInviteExpired(member.invited_at) ? 'Expired' : 'Invited'}
                </Badge>
              )}
              {member.is_sso_user && <Badge variant="default">SSO</Badge>}
              {Boolean(member.metadata?.origin) && (
                <PartnerIcon
                  organization={{
                    managed_by:
                      MEMBER_ORIGIN_TO_MANAGED_BY[
                        member.metadata.origin as keyof typeof MEMBER_ORIGIN_TO_MANAGED_BY
                      ] ?? 'supabase',
                  }}
                  tooltipText="Managed by Vercel Marketplace."
                />
              )}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-x-1.5">
          {member.mfa_enabled ? (
            <>
              <span className="text-foreground-lighter">Enabled</span>
              <Check className="text-brand" strokeWidth={2} size={16} />
            </>
          ) : (
            <>
              <span className="text-foreground-lighter">Disabled</span>
              <X className="text-foreground-muted" strokeWidth={1.5} size={16} />
            </>
          )}
        </div>
      </TableCell>

      <TableCell className="max-w-64">
        {isLoadingRoles ? (
          <ShimmeringLoader className="w-32" />
        ) : (
          roleRows.map(({ id, roleName, appliesToAllProjects, projectsApplied }) => (
            <div key={`role-${id}`} className="flex items-center gap-x-2">
              <p className="text-foreground-light">{roleName}</p>
              {hasProjectScopedRoles && (
                <>
                  <ChevronRight className="text-foreground-muted/50" size={14} />
                  {projectsApplied.length === 1 ? (
                    <span
                      className="text-foreground-light truncate"
                      title={projectsApplied[0].name}
                    >
                      {projectsApplied[0].name}
                    </span>
                  ) : (
                    <HoverCard openDelay={200}>
                      <HoverCardTrigger asChild>
                        <span className="text-foreground-light">
                          {appliesToAllProjects
                            ? 'Organization'
                            : `${projectsApplied.length} project${projectsApplied.length > 1 ? 's' : ''}`}
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent className="p-0">
                        <p className="p-2 text-xs">
                          {roleName} role applies to {projectsApplied.length} project
                          {projectsApplied.length > 1 ? 's' : ''}
                        </p>
                        <div className="border-t flex flex-col py-1">
                          <ScrollArea className={cn(projectsApplied.length > 5 ? 'h-[130px]' : '')}>
                            {projectsApplied.map(({ ref, name }) => (
                              <Link
                                key={ref}
                                href={`/project/${ref}`}
                                className="px-2 py-1 group hover:bg-surface-300 hover:text-foreground transition flex items-center justify-between"
                              >
                                <span className="text-xs truncate max-w-[60%]">{name}</span>
                                <span className="text-xs text-foreground flex items-center gap-x-1 opacity-0 group-hover:opacity-100 transition">
                                  Go to project
                                  <ArrowRight size={14} />
                                </span>
                              </Link>
                            ))}
                          </ScrollArea>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </TableCell>

      <TableCell>
        <MemberActions member={member} />
      </TableCell>
    </TableRow>
  )
})
