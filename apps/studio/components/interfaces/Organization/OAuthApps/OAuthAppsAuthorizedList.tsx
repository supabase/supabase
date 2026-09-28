import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useIntersectionObserver } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { Fragment, useEffect } from 'react'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { OAuthAppsAuthorizedRow } from './OAuthAppsAuthorizedRow'
import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import { useOAuthApprovalsQuery } from '@/data/oauth-apps/oauth-apps-approvals-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

export const OAuthAppsAuthorizedList = () => {
  const { slug } = useParams()

  const { can: canReadOAuthApps, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
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
  } = useOAuthApprovalsQuery({ slug })

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
        {(isPending || isLoadingPermissions) && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}

        {!isLoadingPermissions && !canReadOAuthApps && (
          <NoPermission resourceText="view authorized apps" />
        )}

        {isError && <AlertError subject="Failed to retrieve authorized apps" error={error} />}

        {isSuccess && canReadOAuthApps && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pages.length === 0 ? (
                  <TableRow className="[&>td]:hover:bg-inherit">
                    <TableCell colSpan={3}>
                      <p className="text-sm text-foreground-lighter">
                        No apps have been authorized in this organization yet.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {data.pages.map((page, pageIndex) => (
                      <Fragment key={pageIndex}>
                        {page.data.map((approval) => (
                          <OAuthAppsAuthorizedRow key={approval.app.id} approval={approval} />
                        ))}
                      </Fragment>
                    ))}
                    <TableRow ref={sentinelRef} className="[&>td]:hover:bg-inherit">
                      <TableCell colSpan={3} className={isFetchingNextPage ? '' : 'p-0 hidden'}>
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
