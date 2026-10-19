import { useIntersectionObserver } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { BuildingIcon, UserIcon } from 'lucide-react'
import { ComponentProps, useEffect, useMemo } from 'react'
import {
  Button,
  cn,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  ScrollArea,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { OAuthGrantAccordion, OAuthGrantAccordionItem } from './OAuthGrantAccordionItem'
import { AlertError } from '@/components/ui/AlertError'
import { useOAuthAppMemberGrantsQuery } from '@/data/oauth-apps/oauth-apps-member-grants-query'
import type { OAuthApprovalItem, OAuthGrantItem } from '@/data/oauth-apps/types'
import { pluralize } from '@/lib/helpers'

export interface OAuthAppsMemberGrantsDialogProps extends ComponentProps<typeof DialogContent> {
  approval?: OAuthApprovalItem
}

export const OAuthAppsMemberGrantsDialogContent = ({
  approval,
  ...props
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
    if (hasNextPage && entry?.isIntersecting && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, entry?.isIntersecting, fetchNextPage, isFetchingNextPage])

  const statusText = useMemo(() => {
    if (isFetchingNextPage) return 'Loading more grants...'
    if (isPending) return 'Loading grants...'
    if (isError) return ''
    return 'Grants loaded'
  }, [isPending, isFetchingNextPage, isError])

  const memberGrants = data?.pages.flatMap((page) => page.data) ?? []
  const isEmpty = memberGrants.length === 0

  if (!approval) return null

  return (
    <DialogContent size="medium" {...props}>
      <DialogHeader>
        <DialogTitle>Member grants for {approval.app.name}</DialogTitle>
      </DialogHeader>
      <DialogSectionSeparator />

      <p aria-live="polite" className="sr-only">
        {statusText}
      </p>

      {isPending && (
        <div className="space-y-2">
          <ShimmeringLoader />
        </div>
      )}

      {isError && <AlertError subject="Failed to retrieve grants" error={error} />}

      {isSuccess && (
        <ScrollArea className="px-4 h-94">
          <p
            className={cn('text-sm text-foreground-lighter', !isEmpty && 'sr-only')}
            aria-live="polite"
          >
            {isEmpty ? 'No grants have been authorized for this application.' : ''}
          </p>

          <OAuthGrantAccordion>
            {memberGrants.map((grant) => (
              <GrantAccordionItem key={grant.grant_id} grant={grant} />
            ))}
          </OAuthGrantAccordion>
          <p ref={sentinelRef} className="text-sm text-foreground-lighter">
            {isFetchingNextPage ? 'Loading...' : ''}
          </p>
        </ScrollArea>
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
  const Icon = isOrganizationBound ? BuildingIcon : UserIcon

  const projectsSummary =
    grant.projects == null
      ? 'All projects'
      : `${grant.projects.length} ${pluralize(grant.projects.length, 'project')}`

  return (
    <OAuthGrantAccordionItem
      value={grant.grant_id}
      icon={<Icon size={16} />}
      title={getGrantLabel(grant)}
      description={`${projectsSummary} · ${permissionCount} ${pluralize(permissionCount, 'permission')}`}
      sections={[
        { label: 'Projects', values: grant.projects?.map((project) => project.name) ?? [] },
        { label: 'Permissions', values: grant.approved_scopes },
      ]}
    />
  )
}

const getGrantLabel = (grant: OAuthGrantItem) => {
  if (grant.user) return grant.user.email
  return 'Organization-wide'
}
