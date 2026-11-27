import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useIntersectionObserver } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { Fragment, useEffect, useMemo } from 'react'
import { Card, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { authorizedAppsPreview } from './OAuthAppsAuthorizedPreview'
import { OAuthAppsAuthorizedRow } from './OAuthAppsAuthorizedRow'
import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import { useOAuthApprovalsQuery } from '@/data/oauth-apps/oauth-apps-approvals-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

export const OAuthAppsAuthorizedList = ({
  isPreview = false,
  accessApp,
  onCloseLinkedAccess,
}: {
  isPreview?: boolean
  accessApp?: string | null
  onCloseLinkedAccess?: () => void
}) => {
  const { slug } = useParams()

  const { can: canReadOAuthApps, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'approved_oauth_apps'
  )

  const { can: canRevokeOAuthApps } = useAsyncCheckPermissions(
    PermissionAction.DELETE,
    'approved_oauth_apps'
  )

  const {
    data,
    isPending,
    isSuccess,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useOAuthApprovalsQuery({ slug }, { enabled: !isPreview })

  const [sentinelRef, entry] = useIntersectionObserver({
    root: null,
    threshold: 0,
    rootMargin: '0px',
  })

  useEffect(() => {
    if (hasNextPage && entry?.isIntersecting && !isFetchingNextPage && !isError) {
      fetchNextPage()
    }
  }, [hasNextPage, entry?.isIntersecting, fetchNextPage, isFetchingNextPage, isError])

  const statusText = useMemo(() => {
    if (isPreview) return 'Authorized apps preview loaded'
    if (isFetchingNextPage) return 'Loading more authorized apps...'
    if (isPending || isLoadingPermissions) return 'Loading...'
    return 'Authorized apps loaded'
  }, [isPreview, isPending, isLoadingPermissions, isFetchingNextPage])

  const hasAuthorizedApps = isPreview || (isSuccess && Boolean(data.pages[0]?.data.length))

  return (
    <PageSection id="authorized-apps">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Authorized apps</PageSectionTitle>
          <PageSectionDescription>
            Applications that have access to your organizations and projects
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>

      <PageSectionContent className="space-y-4">
        <p aria-live="polite" className="sr-only">
          {statusText}
        </p>
        {!isPreview && (isPending || isLoadingPermissions) && !isFetchingNextPage && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
          </div>
        )}

        {!isPreview && !isLoadingPermissions && !canReadOAuthApps && (
          <NoPermission resourceText="view authorized apps" />
        )}

        {!isPreview && isError && (
          <AlertError subject="Failed to retrieve authorized apps" error={error} />
        )}

        {(isPreview || (isSuccess && canReadOAuthApps)) && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className={cn(
                      hasAuthorizedApps
                        ? 'w-[54px] min-w-[54px] max-w-[54px]'
                        : 'w-0 min-w-0 max-w-0 p-0',
                      !hasAuthorizedApps && 'text-foreground-muted'
                    )}
                  >
                    <span className="sr-only">Application icon</span>
                  </TableHead>
                  <TableHead
                    className={cn(
                      hasAuthorizedApps && 'pl-0',
                      !hasAuthorizedApps && 'text-foreground-muted'
                    )}
                  >
                    App
                  </TableHead>
                  <TableHead className={cn(!hasAuthorizedApps && 'text-foreground-muted')}>
                    {isPreview ? 'Scope' : 'Access'}
                  </TableHead>
                  {isPreview && <TableHead>Permissions</TableHead>}
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPreview ? (
                  authorizedAppsPreview.map(
                    ({ approval, projects, scopes, databaseAccess, grants }) => (
                      <OAuthAppsAuthorizedRow
                        key={approval.id}
                        approval={approval}
                        databaseAccess={databaseAccess}
                        onCloseLinkedAccess={
                          approval.id === accessApp ? onCloseLinkedAccess : undefined
                        }
                        previewScopes={scopes}
                        previewGrants={grants}
                        previewProjects={projects}
                        canRevoke
                      />
                    )
                  )
                ) : !data?.pages[0]?.data.length ? (
                  <TableRow className="[&>td]:hover:bg-inherit">
                    <TableCell colSpan={4}>
                      <p className="text-sm text-foreground">No results found</p>
                      <p className="text-sm text-foreground-lighter">
                        No apps have been authorized in this organization yet.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {data.pages.map((page, pageIndex) => (
                      <Fragment key={pageIndex}>
                        {page.data.map((approval, index) => (
                          <OAuthAppsAuthorizedRow
                            key={approval.id}
                            approval={approval}
                            className={cn(
                              // Avoid a double bottom border when next page isn't loading
                              pageIndex === data.pages.length - 1 &&
                                index === page.data.length - 1 &&
                                !isFetchingNextPage &&
                                'border-none'
                            )}
                            canRevoke={canRevokeOAuthApps}
                          />
                        ))}
                      </Fragment>
                    ))}
                    <TableRow ref={sentinelRef} className="[&>td]:hover:bg-inherit">
                      <TableCell colSpan={4} className={isFetchingNextPage ? '' : 'p-0'}>
                        <p aria-live="polite" className="text-sm text-foreground-lighter">
                          {isFetchingNextPage ? 'Loading...' : ''}
                        </p>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </PageSectionContent>
    </PageSection>
  )
}
