import { Box, Boxes } from 'lucide-react'
import { Button, Card, CardContent } from 'ui'

import { ScopeGroupCard } from './ScopeGroupCard'
import type { OAuthAppsAuthorizeGrant } from '@/data/oauth-apps/oauth-apps-authorize-approve-mutation'

export interface AuthorizeSuccessScreenProps {
  appName: string
  grant: OAuthAppsAuthorizeGrant
  onReturn: () => void
}

export const AuthorizeSuccessScreen = ({
  appName,
  grant,
  onReturn,
}: AuthorizeSuccessScreenProps) => {
  const projectNames = grant.projects.map((project) => project.name).join(', ')

  return (
    <div className="flex flex-col gap-6 px-6 pb-6">
      <Card className="overflow-hidden shadow-none bg-surface-200/60 border-muted">
        <CardContent className="border-none p-0 divide-y divide-muted">
          <div className="relative divide-y divide-muted">
            <div className="flex items-center gap-3 p-4">
              <div className="w-[30px] h-[30px] shrink-0 rounded-full border border-control flex items-center justify-center text-xs">
                {grant.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground-light">Authorized by</p>
                <p className="truncate text-sm text-foreground">
                  {grant.email} <span className="text-foreground-lighter">· {grant.role}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="w-[30px] h-[30px] shrink-0 rounded-full border border-control flex items-center justify-center">
                <Boxes size={16} className="text-foreground-light" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground-light">Organization</p>
                <p className="truncate text-sm text-foreground">{grant.organization_slug}</p>
              </div>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-muted bg-surface-200 px-2 py-0.5">
              <span className="text-[11px] uppercase tracking-wide text-foreground-lighter">
                For
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4">
            <div className="w-[30px] h-[30px] shrink-0 rounded-full border border-control flex items-center justify-center">
              <Box size={16} className="text-foreground-light" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground-light">Projects</p>
              <p className="truncate text-sm text-foreground">{projectNames}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-foreground">Permissions granted</p>
        <ScopeGroupCard
          appName={appName}
          scopeGroups={grant.scope_groups}
          memberRole={grant.role}
          showHeading={false}
          showOverRoleAnnotations={false}
        />
      </div>

      <Button variant="default" block onClick={onReturn}>
        Return to {appName}
      </Button>
    </div>
  )
}
