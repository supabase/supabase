import { useParams } from 'common'
import { Building2, ChevronDown, ChevronUp, User } from 'lucide-react'
import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from 'ui'

import { useOAuthAppMemberGrantsQuery } from '@/data/oauth-apps/oauth-apps-member-grants-query'
import type { OAuthAppOverviewItem, OAuthGrantItem } from '@/data/oauth-apps/types'

export interface OAuthAppsMemberGrantsDialogProps {
  app?: OAuthAppOverviewItem
  onClose: () => void
}

export const OAuthAppsMemberGrantsDialog = ({ app, onClose }: OAuthAppsMemberGrantsDialogProps) => {
  const { slug } = useParams()
  const [expandedGrantIds, setExpandedGrantIds] = useState<string[]>([])

  const { data } = useOAuthAppMemberGrantsQuery({ slug, appId: app?.id }, { enabled: Boolean(app) })
  const grants = data?.data ?? []

  const handleClose = () => {
    setExpandedGrantIds([])
    onClose()
  }

  const handleToggle = (grantId: string) => {
    setExpandedGrantIds((previous) =>
      previous.includes(grantId)
        ? previous.filter((entry) => entry !== grantId)
        : [...previous, grantId]
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
            const isExpanded = expandedGrantIds.includes(grant.grant_id)
            const isOrganizationBound = grant.kind === 'organization_bound'
            const projectRefs = grant.project_refs ?? []
            const permissionCount = grant.approved_scopes.length

            return (
              <div key={grant.grant_id} className="py-3">
                <button
                  type="button"
                  className="flex w-full items-center gap-x-3 text-left"
                  onClick={() => handleToggle(grant.grant_id)}
                >
                  {isOrganizationBound ? (
                    <Building2 size={16} className="shrink-0 text-foreground-lighter" />
                  ) : (
                    <User size={16} className="shrink-0 text-foreground-lighter" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{getGrantLabel(grant)}</p>
                    <p className="text-xs text-foreground-lighter">
                      {grant.project_refs === null
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
                    <div className="flex flex-col gap-1">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-foreground-light">
                        Permissions
                      </p>
                      <p className="text-xs text-foreground">{grant.approved_scopes.join(', ')}</p>
                    </div>
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

function getGrantLabel(grant: OAuthGrantItem) {
  if (grant.user) return grant.user.email
  return 'Organization-wide'
}
