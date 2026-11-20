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
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  ScrollArea,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { OAuthAppDatabaseAccess } from './OAuthAppsAuthorizedPreview'
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
  previewScopes?: string[]
  databaseAccess?: OAuthAppDatabaseAccess
}

export const OAuthAppsMemberGrantsDialogContent = ({
  approval,
  previewScopes,
  databaseAccess,
  ...props
}: OAuthAppsMemberGrantsDialogProps) => {
  const isPreview = previewScopes != null
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
    { slug, appId: approval?.id },
    { enabled: Boolean(approval) && !isPreview }
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
        <DialogTitle>
          {isPreview ? 'Grants' : 'Member grants'} for {approval.attributes.app.name}
        </DialogTitle>
      </DialogHeader>
      <DialogSectionSeparator />

      {isPreview && (
        <DialogSection className="space-y-4 text-sm">
          <p>
            App ID <code>{approval.id}</code>
          </p>
          <div className="space-y-1">
            <h3 className="font-medium">Permissions</h3>
            <ul className="space-y-1 text-foreground-light">
              {previewScopes.map((scope) => (
                <li key={scope}>
                  <code>{scope}</code>
                </li>
              ))}
              {databaseAccess && <li>Table data · {databaseAccess.mode}</li>}
            </ul>
          </div>
          {databaseAccess && (
            <div className="space-y-1">
              <h3 className="font-medium">Database access</h3>
              <p>
                Role <code>{databaseAccess.role}</code>
              </p>
              <p>{databaseAccess.projects?.join(', ') ?? 'All current and future projects'}</p>
            </div>
          )}
        </DialogSection>
      )}

      <p aria-live="polite" className="sr-only">
        {!isPreview && statusText}
      </p>

      {!isPreview && isPending && (
        <div className="space-y-2">
          <ShimmeringLoader />
        </div>
      )}

      {!isPreview && isError && <AlertError subject="Failed to retrieve grants" error={error} />}

      {!isPreview && isSuccess && (
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
