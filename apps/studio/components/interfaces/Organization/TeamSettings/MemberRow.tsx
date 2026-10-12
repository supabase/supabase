import { useParams } from 'common'
import { ArrowRight, Check, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { memo, useMemo } from 'react'
import {
  Badge,
  cn,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { isInviteExpired } from '../Organization.utils'
import { MemberActions } from './MemberActions'
import { MEMBERS_GRID_CLASS } from './MembersList.constants'
import { useTeamSettingsData } from './TeamSettingsDataContext'
import { type RowComponentBaseProps } from '@/components/ui/InfiniteList'
import { InlineLink } from '@/components/ui/InlineLink'
import PartnerIcon from '@/components/ui/PartnerIcon'
import { ProfileImage } from '@/components/ui/ProfileImage'
import { OrganizationRole } from '@/data/organization-members/organization-roles-query'
import { OrganizationMember } from '@/data/organizations/organization-members-query'
import { useProfile } from '@/lib/profile'

const MEMBER_ORIGIN_TO_MANAGED_BY = {
  vercel: 'vercel-marketplace',
} as const

export const MemberRow = memo(function MemberRow({
  item: member,
  index,
  style,
}: RowComponentBaseProps<OrganizationMember>) {
  const { slug } = useParams()
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
    <div
      role="row"
      aria-rowindex={index + 2}
      style={style}
      className={cn(MEMBERS_GRID_CLASS, 'border-b hover:bg-surface-200 transition-colors')}
    >
      <div role="cell" className="min-w-0">
        <div className="flex items-center gap-x-4 min-w-0">
          <ProfileImage
            alt={member.primary_email ?? member.username ?? ''}
            src={profileImageUrl}
            className="border rounded-full w-6 h-6 md:w-8 md:h-8 shrink-0"
            placeholder={
              <div
                className={cn(
                  'w-6 h-6 md:w-8 md:h-8 text-xs shrink-0',
                  'bg-surface-100 border border-overlay rounded-full text-foreground-lighter flex items-center justify-center'
                )}
              >
                {member.primary_email?.[0]?.toUpperCase()}
              </div>
            }
          />
          <div className="flex items-center gap-x-3 min-w-0">
            <p
              title={member.primary_email ?? ''}
              className="text-foreground-light truncate text-sm"
            >
              {member.primary_email}
            </p>
            <div className="flex items-center gap-x-2 shrink-0 text-sm">
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
      </div>

      <div role="cell">
        <div className="flex items-center ml-1">
          <Tooltip>
            <TooltipTrigger>
              {member.mfa_enabled ? (
                <Check className="text-primary" strokeWidth={2} size={16} />
              ) : (
                <X className="text-foreground-muted" strokeWidth={1.5} size={16} />
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-70 text-center">
              {member.mfa_enabled ? (
                'Member has MFA enabled'
              ) : (
                <span className="text-balance">
                  Member does not have MFA enabled. You can enforce MFA from your organization's{' '}
                  <InlineLink href={`/org/${slug}/security`}>security settings</InlineLink>,
                  restricting access until members enable it.
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div role="cell" className="min-w-0">
        {isLoadingRoles ? (
          <ShimmeringLoader className="w-32" />
        ) : (
          roleRows.map(({ id, roleName, appliesToAllProjects, projectsApplied }) => (
            <div key={`role-${id}`} className="flex items-center gap-x-2 min-w-0 text-sm">
              <p className="text-foreground-light whitespace-nowrap">{roleName}</p>
              {hasProjectScopedRoles && (
                <>
                  <ChevronRight className="text-foreground-muted/50 shrink-0" size={14} />
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
                        <span className="text-foreground-light truncate">
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
      </div>

      <div role="cell">
        <MemberActions member={member} />
      </div>
    </div>
  )
})
