import { LogOutIcon } from 'lucide-react'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
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
            <ButtonTooltip
              variant="text"
              size="tiny"
              icon={<LogOutIcon size={14} />}
              className="shrink-0 size-6 px-0 text-foreground-light hover:text-foreground"
              aria-label="Sign out"
              aria-describedby={undefined}
              onClick={onSignOut}
              tooltip={{ content: { side: 'bottom', text: 'Sign out' } }}
            />
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
