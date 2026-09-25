import { useParams } from 'common'
import { Building2, User } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'ui'

import { useOAuthAppMemberGrantsQuery } from '@/data/oauth-apps/oauth-apps-member-grants-query'
import type { OAuthAppOverviewItem, OAuthGrantItem } from '@/data/oauth-apps/types'

export interface OAuthAppsMemberGrantsDialogProps {
  app?: OAuthAppOverviewItem
  onClose: () => void
}

export const OAuthAppsMemberGrantsDialog = ({ app, onClose }: OAuthAppsMemberGrantsDialogProps) => {
  const { slug } = useParams()
  const { data } = useOAuthAppMemberGrantsQuery({ slug, appId: app?.id }, { enabled: Boolean(app) })
  const grants = data?.data ?? []

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={Boolean(app)} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Member grants for {app?.name}</DialogTitle>
        </DialogHeader>

        <div className="px-4 max-h-90 overflow-y-auto scrollbar-gutter-stable">
          <Accordion type="multiple">
            {grants.map((grant) => {
              const isOrganizationBound = grant.kind === 'organization_bound'
              const projectRefs = grant.project_refs ?? []
              const permissionCount = grant.approved_scopes.length

              return (
                <AccordionItem value={grant.grant_id} key={grant.grant_id}>
                  <AccordionTrigger className="hover:no-underline">
                    {isOrganizationBound ? (
                      <Building2 size={16} className="shrink-0 text-foreground-lighter rotate-0!" />
                    ) : (
                      <User size={16} className="shrink-0 text-foreground-lighter rotate-0!" />
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
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-3 pl-6">
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
                        <p className="text-xs text-foreground">
                          {grant.approved_scopes.join(', ')}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
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
