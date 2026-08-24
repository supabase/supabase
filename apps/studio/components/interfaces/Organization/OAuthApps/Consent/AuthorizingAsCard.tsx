import { Boxes, LogOut, RefreshCcw } from 'lucide-react'
import { Button, Card, CardContent } from 'ui'

import type { OAuthOrganizationRole } from '@/data/oauth-apps/types'

export interface AuthorizingAsCardProps {
  email: string
  memberRole: OAuthOrganizationRole['role']
  organizationSlug: string
  onSignOut: () => void
  showSwitcher?: boolean
  onSwitchOrg?: () => void
}

export const AuthorizingAsCard = ({
  email,
  memberRole,
  organizationSlug,
  onSignOut,
  showSwitcher = false,
  onSwitchOrg,
}: AuthorizingAsCardProps) => {
  return (
    <section className="flex flex-col gap-2">
      <Card className="relative overflow-hidden shadow-none bg-surface-200/60 border-muted">
        <CardContent className="border-none p-0 divide-y divide-muted">
          <div className="flex items-center gap-3 p-4">
            <div className="w-[30px] h-[30px] shrink-0 rounded-full border border-control flex items-center justify-center text-xs">
              {email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground-light">Authorizing as</p>
              <p className="truncate text-sm text-foreground">
                {email} <span className="text-foreground-lighter">· {memberRole}</span>
              </p>
            </div>
            <Button
              variant="default"
              icon={<LogOut size={16} />}
              className="px-1"
              aria-label="Sign out"
              onClick={onSignOut}
            />
          </div>
          <div className="flex items-center gap-3 p-4">
            <div className="w-[30px] h-[30px] shrink-0 rounded-full border border-control flex items-center justify-center">
              <Boxes size={18} className="text-foreground-light" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground-light">Organization</p>
              <p className="truncate text-sm text-foreground">{organizationSlug}</p>
            </div>
            {showSwitcher && (
              <Button
                variant="default"
                icon={<RefreshCcw size={16} />}
                className="px-1"
                aria-label="Switch organization"
                onClick={onSwitchOrg}
              />
            )}
          </div>
        </CardContent>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-muted bg-surface-200 px-2 py-0.5">
          <span className="text-[11px] uppercase tracking-wide text-foreground-lighter">For</span>
        </div>
      </Card>
      <p className="text-xs text-foreground-lighter">
        This grant acts as you, it can never do more than your role in this organization allows.
      </p>
    </section>
  )
}
