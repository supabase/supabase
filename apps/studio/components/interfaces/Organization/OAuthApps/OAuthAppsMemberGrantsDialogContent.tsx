import { useIntersectionObserver } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { Building2, User } from 'lucide-react'
import { Fragment, useEffect } from 'react'
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
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { useOAuthAppMemberGrantsQuery } from '@/data/oauth-apps/oauth-apps-member-grants-query'
import type { OAuthApprovalItem, OAuthGrantItem } from '@/data/oauth-apps/types'

export interface OAuthAppsMemberGrantsDialogProps {
  approval?: OAuthApprovalItem
}

export const OAuthAppsMemberGrantsDialogContent = ({
  approval,
}: OAuthAppsMemberGrantsDialogProps) => {
  const { slug } = useParams()
  const {
    data,
    error,
    isPending,
    isError,
    isSuccess,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useOAuthAppMemberGrantsQuery(
    { slug, appId: approval?.app?.id },
    { enabled: Boolean(approval) }
  )

  const [sentinelRef, entry] = useIntersectionObserver({
    root: null,
    threshold: 0,
    rootMargin: '0px',
  })

  useEffect(() => {
    if (hasNextPage && entry?.isIntersecting) {
      fetchNextPage()
    }
  }, [hasNextPage, entry?.isIntersecting, fetchNextPage])

  if (!approval) return null

  return (
    <DialogContent size="small">
      <DialogHeader>
        <DialogTitle>Member grants for {approval.app.name}</DialogTitle>
      </DialogHeader>

      {isPending && (
        <div className="space-y-2">
          <ShimmeringLoader />
        </div>
      )}

      {isError && <AlertError subject="Failed to retrieve grants" error={error} />}

      {isSuccess && (
        <div className="px-4 max-h-90 overflow-y-auto scrollbar-gutter-stable">
          {data.pages.length === 0 ? (
            <p className="text-sm text-foreground-lighter">
              No grants have been authorized for this application.
            </p>
          ) : (
            <>
              <Accordion type="multiple">
                {data.pages.map((page, pageIndex) => (
                  <Fragment key={pageIndex}>
                    {page.data.map((grant) => (
                      <GrantAccordionItem key={grant.grant_id} grant={grant} />
                    ))}
                  </Fragment>
                ))}
              </Accordion>
              <p ref={sentinelRef} aria-live="polite" className="text-sm text-foreground-lighter">
                {isFetchingNextPage ? 'Loading...' : ''}
              </p>
            </>
          )}
        </div>
      )}

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="default">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}

const GrantAccordionItem = ({ grant }: { grant: OAuthGrantItem }) => {
  const isOrganizationBound = grant.kind === 'organization_bound'
  const permissionCount = grant.approved_scopes.length

  return (
    <AccordionItem value={grant.grant_id}>
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
}

const getGrantLabel = (grant: OAuthGrantItem) => {
  if (grant.user) return grant.user.email
  return 'Organization-wide'
}
