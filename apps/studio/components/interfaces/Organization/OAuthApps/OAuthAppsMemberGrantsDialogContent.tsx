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
import { OAuthApproval } from '@/data/oauth-apps/oauth-apps-approvals-query'
import {
  OAuthAppMemberGrant,
  useOAuthAppMemberGrantsQuery,
} from '@/data/oauth-apps/oauth-apps-member-grants-query'
import { pluralize } from '@/lib/helpers'

export interface OAuthAppsMemberGrantsDialogProps extends ComponentProps<typeof DialogContent> {
  approval?: OAuthApproval
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
  } = useOAuthAppMemberGrantsQuery({ slug, appId: approval?.id }, { enabled: Boolean(approval) })

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
        <DialogTitle>Member grants for {approval.attributes.app.name}</DialogTitle>
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
              <GrantAccordionItem key={grant.id} grant={grant} />
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

const GrantAccordionItem = ({ grant }: { grant: OAuthAppMemberGrant }) => {
  const isOrganizationBound = grant.attributes.kind === 'organization_bound'
  const permissionCount = grant.attributes.approved_scopes.length
  const Icon = isOrganizationBound ? BuildingIcon : UserIcon

  const projectsSummary =
    grant.attributes.projects == null
      ? 'All projects'
      : `${grant.attributes.projects.length} ${pluralize(grant.attributes.projects.length, 'project')}`

  return (
    <OAuthGrantAccordionItem
      value={grant.id}
      icon={<Icon size={16} />}
      title={getGrantLabel(grant)}
      description={`${projectsSummary} · ${permissionCount} ${pluralize(permissionCount, 'permission')}`}
      sections={[
        {
          label: 'Projects',
          values: grant.attributes.projects?.map((project) => project.name) ?? [],
        },
        { label: 'Permissions', values: grant.attributes.approved_scopes },
      ]}
    />
  )
}

const getGrantLabel = (grant: OAuthAppMemberGrant) => {
  if (grant.attributes.user) return grant.attributes.user.email ?? grant.attributes.user.username
  return 'Organization-wide'
}
