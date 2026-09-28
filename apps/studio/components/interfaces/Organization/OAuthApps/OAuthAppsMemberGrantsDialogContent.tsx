import { useParams } from 'common'
import { Building2, User } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'ui'

import { useOAuthAppMemberGrantsQuery } from '@/data/oauth-apps/oauth-apps-member-grants-query'
import type { OAuthApprovalItem, OAuthGrantItem } from '@/data/oauth-apps/types'

export interface OAuthAppsMemberGrantsDialogProps {
  approval?: OAuthApprovalItem
}

export const OAuthAppsMemberGrantsDialogContent = ({
  approval,
}: OAuthAppsMemberGrantsDialogProps) => {
  const { slug } = useParams()
  const { data } = useOAuthAppMemberGrantsQuery(
    { slug, appId: approval?.app?.id },
    { enabled: Boolean(approval) }
  )
  const grants = data?.data ?? []

  if (!approval) return null

  return (
    <DialogContent size="small">
      <DialogHeader>
        <DialogTitle>Member grants for {approval.app.name}</DialogTitle>
      </DialogHeader>

      <div className="px-4 max-h-90 overflow-y-auto scrollbar-gutter-stable">
        <Accordion type="multiple">
          {grants.map((grant) => {
            const isOrganizationBound = grant.kind === 'organization_bound'
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
                      {grant.projects == null
                        ? 'All projects'
                        : `${grant.projects.length} ${grant.projects.length === 1 ? 'project' : 'projects'}`}
                      {' · '}
                      {permissionCount} {permissionCount === 1 ? 'permission' : 'permissions'}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3 pl-6">
                    {grant.projects != null && grant.projects.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-foreground-light">
                          Projects
                        </p>
                        <p className="text-xs text-foreground">
                          {grant.projects.map((project) => project.name).join(', ')}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-foreground-light">
                        Permissions
                      </p>
                      <p className="text-xs text-foreground">{grant.approved_scopes.join(', ')}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="default">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}

function getGrantLabel(grant: OAuthGrantItem) {
  if (grant.user) return grant.user.email
  return 'Organization-wide'
}
