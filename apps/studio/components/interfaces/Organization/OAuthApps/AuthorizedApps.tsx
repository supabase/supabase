import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useMemo, useState } from 'react'
import {
  Card,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
} from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { AuthorizedAppRow } from './AuthorizedAppRow'
import { parseSort, toggleSort } from './OAuthApps.utils'
import { RevokeAppModal } from './RevokeAppModal'
import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import { AuthorizedApp, useAuthorizedAppsQuery } from '@/data/oauth/authorized-apps-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

type AuthorizedAppsSort = 'authorized:asc' | 'authorized:desc'
type AuthorizedAppsSortColumn = 'authorized'

export const AuthorizedApps = () => {
  const { slug } = useParams()

  const [selectedAppToRevoke, setSelectedAppToRevoke] = useState<AuthorizedApp>()
  const [authorizedAppsSort, setAuthorizedAppsSort] = useState<AuthorizedAppsSort>('authorized:asc')

  const { can: canReadOAuthApps, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'approved_oauth_apps'
  )

  const {
    data: authorizedApps,
    isPending: isLoadingAuthorizedApps,
    isSuccess: isSuccessAuthorizedApps,
    isError: isErrorAuthorizedApps,
  } = useAuthorizedAppsQuery({ slug })

  const sortedAuthorizedApps = useMemo(() => {
    const [sortColumn, sortOrder] = parseSort<AuthorizedAppsSortColumn>(authorizedAppsSort)
    const orderMultiplier = sortOrder === 'asc' ? 1 : -1

    return [...(authorizedApps ?? [])].sort((a, b) => {
      if (sortColumn === 'authorized') {
        return (
          (new Date(a.authorized_at).getTime() - new Date(b.authorized_at).getTime()) *
          orderMultiplier
        )
      }

      return 0
    })
  }, [authorizedApps, authorizedAppsSort])

  const hasAuthorizedApps = (authorizedApps?.length ?? 0) > 0
  const avatarHeadClass = 'w-[62px] min-w-[62px] max-w-[62px]'
  const avatarHeadCollapsedClass = 'w-0 min-w-0 max-w-0 p-0'

  const handleAuthorizedSortChange = (column: AuthorizedAppsSortColumn) => {
    toggleSort(authorizedAppsSort, column, setAuthorizedAppsSort)
  }

  return (
    <PageSection id="authorized-apps">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Authorized apps</PageSectionTitle>
          <PageSectionDescription>
            Applications that have access to your organization's settings and projects
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent className="space-y-4">
        {isLoadingAuthorizedApps || isLoadingPermissions ? (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : !canReadOAuthApps ? (
          <NoPermission resourceText="view authorized apps" />
        ) : null}

        {isErrorAuthorizedApps && <AlertError subject="Failed to retrieve authorized apps" />}

        {isSuccessAuthorizedApps && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className={cn(
                      hasAuthorizedApps ? avatarHeadClass : avatarHeadCollapsedClass,
                      !hasAuthorizedApps && 'text-foreground-muted'
                    )}
                  >
                    <span className="sr-only">Avatar</span>
                  </TableHead>
                  <TableHead className={cn(!hasAuthorizedApps && 'text-foreground-muted')}>
                    Name
                  </TableHead>
                  <TableHead className={cn(!hasAuthorizedApps && 'text-foreground-muted')}>
                    Author
                  </TableHead>
                  <TableHead className={cn(!hasAuthorizedApps && 'text-foreground-muted')}>
                    App ID
                  </TableHead>
                  <TableHead className={cn(!hasAuthorizedApps && 'text-foreground-muted')}>
                    {hasAuthorizedApps ? (
                      <TableHeadSort
                        column="authorized"
                        currentSort={authorizedAppsSort}
                        onSortChange={handleAuthorizedSortChange}
                      >
                        AUTHORIZED
                      </TableHeadSort>
                    ) : (
                      'AUTHORIZED'
                    )}
                  </TableHead>
                  <TableHead
                    className={cn('text-right', !hasAuthorizedApps && 'text-foreground-muted')}
                  >
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasAuthorizedApps ? (
                  sortedAuthorizedApps?.map((app) => (
                    <AuthorizedAppRow
                      key={app.id}
                      app={app}
                      onSelectRevoke={() => setSelectedAppToRevoke(app)}
                    />
                  ))
                ) : (
                  <TableRow className="[&>td]:hover:bg-inherit">
                    <TableCell colSpan={6}>
                      <p className="text-sm text-foreground">No results found</p>
                      <p className="text-sm text-foreground-lighter">
                        You do not have any authorized applications yet
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </PageSectionContent>
      <RevokeAppModal
        selectedApp={selectedAppToRevoke}
        onClose={() => setSelectedAppToRevoke(undefined)}
      />
    </PageSection>
  )
}
