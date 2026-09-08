import { LogOut } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export interface AuthorizingAsCardProps {
  email: string
  organizationSlug: string
  onSignOut: () => void
}

export const AuthorizingAsCard = ({
  email,
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
      </div>
      <p className="text-xs text-foreground-lighter">
        This grant acts as you, it can never do more than your role in this organization allows.
      </p>
    </section>
  )
}
