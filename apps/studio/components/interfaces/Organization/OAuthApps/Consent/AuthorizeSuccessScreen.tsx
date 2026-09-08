import type { ReactNode } from 'react'
import { Button } from 'ui'

import { ScopeGroupCard } from './ScopeGroupCard'
import type {
  OAuthAppsAuthorizeOrganizationProject,
  OAuthScopeGroup,
} from '@/data/oauth-apps/types'

export type AuthorizeSuccessGrant = {
  email: string
  organization_slug: string
  projects: OAuthAppsAuthorizeOrganizationProject[]
  scope_groups: OAuthScopeGroup[]
}

export interface AuthorizeSuccessScreenProps {
  appName: string
  grant: AuthorizeSuccessGrant
  onReturn: () => void
}

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 text-xs">
    <span className="shrink-0 text-foreground-light">{label}</span>
    <span className="min-w-0 text-right text-foreground">{children}</span>
  </div>
)

export const AuthorizeSuccessScreen = ({
  appName,
  grant,
  onReturn,
}: AuthorizeSuccessScreenProps) => {
  return (
    <div className="flex flex-col gap-6 px-6 pb-6">
      <div className="divide-y rounded-md border bg-surface-75 px-4">
        <DetailRow label="Authorized by">{grant.email}</DetailRow>
        <DetailRow label="Organization">{grant.organization_slug}</DetailRow>
        <DetailRow label="Projects">
          <span className="flex flex-wrap justify-end gap-x-1">
            {grant.projects.map((project, index) => (
              <span key={project.ref}>
                {project.name}
                {index < grant.projects.length - 1 ? ',' : ''}
              </span>
            ))}
          </span>
        </DetailRow>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-foreground">Permissions granted</p>
        <ScopeGroupCard appName={appName} scopeGroups={grant.scope_groups} showHeading={false} />
      </div>

      <Button variant="text" block onClick={onReturn}>
        Return to {appName}
      </Button>
    </div>
  )
}
