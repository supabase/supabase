import { useParams } from 'common'
import { ChevronDown, ChevronUp, User } from 'lucide-react'
import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from 'ui'

import { ScopeGroupCard } from './Consent/ScopeGroupCard'
import type { OAuthAuthorizedApp } from '@/data/oauth-apps/oauth-apps-authorized-apps-query'
import { useOAuthAppMemberGrantsQuery } from '@/data/oauth-apps/oauth-apps-member-grants-query'
import {
  getMemberGrantPermissionCount,
  getScopedProjectRefs,
  isAllProjectsScope,
} from '@/data/oauth-apps/types'

export interface OAuthAppsMemberGrantsDialogProps {
  app?: OAuthAuthorizedApp
  onClose: () => void
}

export const OAuthAppsMemberGrantsDialog = ({ app, onClose }: OAuthAppsMemberGrantsDialogProps) => {
  const { slug } = useParams()
  const [expandedEmails, setExpandedEmails] = useState<string[]>([])

  const { data: grants = [] } = useOAuthAppMemberGrantsQuery(
    { slug, appId: app?.id },
    { enabled: Boolean(app) }
  )

  const handleClose = () => {
    setExpandedEmails([])
    onClose()
  }

  const handleToggle = (email: string) => {
    setExpandedEmails((previous) =>
      previous.includes(email) ? previous.filter((entry) => entry !== email) : [...previous, email]
    )
  }

  return (
    <Dialog open={Boolean(app)} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Member grants for {app?.name}</DialogTitle>
        </DialogHeader>

        <div className="max-h-80 divide-y overflow-y-auto px-4">
          {grants.map((grant) => {
            const isExpanded = expandedEmails.includes(grant.member_email)
            const projectRefs = getScopedProjectRefs(grant.project_scope)
            const permissionCount = getMemberGrantPermissionCount(grant)

            return (
              <div key={grant.member_email} className="py-3">
                <button
                  type="button"
                  className="flex w-full items-center gap-x-3 text-left"
                  onClick={() => handleToggle(grant.member_email)}
                >
                  <User size={16} className="shrink-0 text-foreground-lighter" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{grant.member_email}</p>
                    <p className="text-xs text-foreground-lighter">
                      {isAllProjectsScope(grant.project_scope)
                        ? 'All projects'
                        : `${projectRefs.length} ${projectRefs.length === 1 ? 'project' : 'projects'}`}
                      {' · '}
                      {permissionCount} {permissionCount === 1 ? 'permission' : 'permissions'}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-3 pl-7">
                    {projectRefs.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-foreground-light">
                          Projects
                        </p>
                        <p className="text-xs text-foreground">{projectRefs.join(', ')}</p>
                      </div>
                    )}
                    <ScopeGroupCard
                      appName={app?.name ?? ''}
                      scopeGroups={grant.scope_groups}
                      showHeading={false}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="default" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
