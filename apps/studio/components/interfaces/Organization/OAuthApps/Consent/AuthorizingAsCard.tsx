import { LogOut } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { OAuthAppsAuthorizeRequest } from '@/data/oauth-apps/types'

export interface AuthorizingAsCardProps {
  email: string
  request: OAuthAppsAuthorizeRequest
  organizationSlug: string
  onSignOut: () => void
}

export const AuthorizingAsCard = ({
  email,
  request,
  organizationSlug,
  onSignOut,
}: AuthorizingAsCardProps) => {
  return (
    <section className="flex flex-col gap-2">
      <div className="divide-y rounded-md border bg-surface-75 px-4">
        <div className="flex items-center justify-between gap-4 py-1.5 text-xs">
          <span className="shrink-0 text-foreground-light">Authorizing as</span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-right text-foreground">{email}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="text"
                  size="tiny"
                  icon={<LogOut size={14} />}
                  className="shrink-0 size-6 px-0 text-foreground-light hover:text-foreground"
                  aria-label="Sign out"
                  aria-describedby={undefined}
                  // Tooltip repeats the label; screen readers would read it twice
                  onClick={onSignOut}
                />
              </TooltipTrigger>
              <TooltipContent side="top">Sign out</TooltipContent>
            </Tooltip>
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 py-2.5 text-xs">
          <span className="shrink-0 text-foreground-light">Organization</span>
          <span className="min-w-0 truncate text-right text-foreground">{organizationSlug}</span>
        </div>
        {!request.project_scoping_mode && (
          <div className="flex items-center justify-between gap-4 py-2.5 text-xs">
            <span className="shrink-0 text-foreground-light">Projects</span>
            <span className="min-w-0 truncate text-right text-foreground">
              All projects, including future ones
            </span>
          </div>
        )}
      </div>
      {request.grant_kind === 'member_bound' && (
        <p className="text-xs text-foreground-lighter">
          This grant acts as you, it can never do more than your role in this organization allows.
        </p>
      )}
    </section>
  )
}
