import { cn } from '@graphiql/react'
import { useIntersectionObserver } from '@uidotdev/usehooks'
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

import { GrantRow } from './GrantRow'
import { AlertError } from '@/components/ui/AlertError'
import { useOAuthGrantsQuery } from '@/data/oauth-apps/oauth-apps-grants-query'

export const OAuthApps = () => {
  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isPending,
    isSuccess,
    isError,
    error,
  } = useOAuthGrantsQuery({})

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

      <PageSectionContent className="flex flex-col gap-4">
        {isPending && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}

        {isError && <AlertError subject="Failed to retrieve authorized apps" error={error} />}

        {isSuccess && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Approved at</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pages.length === 0 || data.pages[0].data.length === 0 ? (
                  <TableRow className="[&>td]:hover:bg-inherit">
                    <TableCell colSpan={4}>
                      <p className="text-sm text-foreground">No results found</p>
                      <p className="text-sm text-foreground-lighter">
                        No apps have been authorized for your account yet.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {data.pages.map((page, pageIndex) => (
                      <Fragment key={pageIndex}>
                        {page.data.map((grant, index) => (
                          <GrantRow
                            key={grant.id}
                            grant={grant}
                            className={cn(
                              // Avoid a double bottom border when next page isn't loading
                              pageIndex === data.pages.length - 1 &&
                                index === page.data.length - 1 &&
                                !isFetchingNextPage &&
                                'border-none'
                            )}
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
