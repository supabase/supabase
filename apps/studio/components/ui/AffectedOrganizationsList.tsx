import { UsersIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { InlineLink } from '@/components/ui/InlineLink'
import type { AffectedOrganization } from '@/data/organizations/free-project-limit-check.utils'

export const AffectedOrganizationsList = ({
  organizations,
}: {
  organizations: AffectedOrganization[]
}) => {
  return (
    <div className="flex flex-col gap-y-2 max-h-[300px] overflow-y-auto">
      {organizations.map((org) => (
        <div key={org.key} className="rounded border bg-surface-100 px-3 py-2">
          <div className="flex items-center justify-between gap-x-2">
            {org.slug ? (
              <InlineLink className="text-sm text-foreground" href={`/org/${org.slug}`}>
                {org.name}
              </InlineLink>
            ) : (
              <span className="text-sm text-foreground">{org.name}</span>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-x-1 text-xs text-foreground-light cursor-default">
                  <UsersIcon size={14} />
                  {org.members.length}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="flex flex-col gap-y-1">
                <span className="text-foreground-lighter">Owners/Admins at their limit</span>
                {org.members.map((member) => (
                  <span key={member.key}>
                    {`${member.email || member.label} (limit: ${member.limit} free projects)`}
                  </span>
                ))}
              </TooltipContent>
            </Tooltip>
          </div>
          <ul className="mt-1 pl-5 text-sm list-disc text-foreground-light">
            {org.projects.map((project) => (
              <li key={project.key}>
                {project.ref ? (
                  <InlineLink href={`/project/${project.ref}/settings/general`}>
                    {project.name}
                  </InlineLink>
                ) : (
                  <span>{project.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
