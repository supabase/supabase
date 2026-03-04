import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Check, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import CopyButton from 'components/ui/CopyButton'
import NoPermission from 'components/ui/NoPermission'
import { AuthorizedApp, useAuthorizedAppsQuery } from 'data/oauth/authorized-apps-query'
import { OAuthAppCreateResponse } from 'data/oauth/oauth-app-create-mutation'
import { OAuthApp, useOAuthAppsQuery } from 'data/oauth/oauth-apps-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
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
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { MOCK_AUTHORIZED_OAUTH_APPS, MOCK_PUBLISHED_OAUTH_APPS } from './OAuthApps.mock'
import { AuthorizedAppRow } from './AuthorizedAppRow'
import { DeleteAppModal } from './DeleteAppModal'
import { OAuthAppRow } from './OAuthAppRow'
import { PublishAppSidePanel } from './PublishAppSidePanel'
import { RevokeAppModal } from './RevokeAppModal'

// [Joshen] Note on nav UX
// Kang Ming mentioned that it might be better to split Published Apps and Authorized Apps into 2 separate tabs
// to prevent any confusion (case study: GitHub). Authorized apps could be in the "integrations" tab, but let's
// check in again after we wrap up Vercel integration

export const OAuthApps = () => {
  type PublishedAppsSort = 'created:asc' | 'created:desc'
  type PublishedAppsSortColumn = 'created'
  type PublishedAppsSortOrder = 'asc' | 'desc'
  type AuthorizedAppsSort = 'authorized:asc' | 'authorized:desc'
  type AuthorizedAppsSortColumn = 'authorized'
  type AuthorizedAppsSortOrder = 'asc' | 'desc'

  const { slug } = useParams()
  const router = useRouter()
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [createdApp, setCreatedApp] = useState<OAuthAppCreateResponse>()
  const [selectedAppToUpdate, setSelectedAppToUpdate] = useState<OAuthApp>()
  const [selectedAppToDelete, setSelectedAppToDelete] = useState<OAuthApp>()
  const [selectedAppToRevoke, setSelectedAppToRevoke] = useState<AuthorizedApp>()
  const [publishedAppsSort, setPublishedAppsSort] = useState<PublishedAppsSort>('created:asc')
  const [authorizedAppsSort, setAuthorizedAppsSort] = useState<AuthorizedAppsSort>('authorized:asc')

  const mockOAuthAppsParam = useMemo(() => {
    const queryParam = router.query.mock_oauth_apps
    return Array.isArray(queryParam) ? queryParam[0] : queryParam
  }, [router.query.mock_oauth_apps])
  const isMockOAuthAppsEnabled =
    process.env.NEXT_PUBLIC_STUDIO_OAUTH_APPS_MOCK === 'true' ||
    mockOAuthAppsParam === '1' ||
    mockOAuthAppsParam === 'true'

  const { can: canReadOAuthApps, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'approved_oauth_apps'
  )
  const { can: canCreateOAuthApps } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'approved_oauth_apps'
  )
  const canViewOAuthApps = canReadOAuthApps || isMockOAuthAppsEnabled

  const {
    data: publishedApps,
    error: publishedAppsError,
    isPending: isLoadingPublishedApps,
    isSuccess: isSuccessPublishedApps,
    isError: isErrorPublishedApps,
  } = useOAuthAppsQuery({ slug }, { enabled: canViewOAuthApps })
  const displayedPublishedApps = useMemo(
    () => (isMockOAuthAppsEnabled ? MOCK_PUBLISHED_OAUTH_APPS : publishedApps ?? []),
    [isMockOAuthAppsEnabled, publishedApps]
  )

  const sortedPublishedApps = useMemo(() => {
    const [sortColumn, sortOrder] = publishedAppsSort.split(':') as [
      PublishedAppsSortColumn,
      PublishedAppsSortOrder,
    ]
    const orderMultiplier = sortOrder === 'asc' ? 1 : -1

    return [...displayedPublishedApps].sort((a, b) => {
      if (sortColumn === 'created') {
        return (
          (new Date(a.created_at ?? '').getTime() - new Date(b.created_at ?? '').getTime()) *
          orderMultiplier
        )
      }

      return 0
    })
  }, [displayedPublishedApps, publishedAppsSort])

  const {
    data: authorizedApps,
    isPending: isLoadingAuthorizedApps,
    isSuccess: isSuccessAuthorizedApps,
    isError: isErrorAuthorizedApps,
  } = useAuthorizedAppsQuery({ slug })
  const displayedAuthorizedApps = useMemo(
    () => (isMockOAuthAppsEnabled ? MOCK_AUTHORIZED_OAUTH_APPS : authorizedApps ?? []),
    [authorizedApps, isMockOAuthAppsEnabled]
  )

  const sortedAuthorizedApps = useMemo(() => {
    const [sortColumn, sortOrder] = authorizedAppsSort.split(':') as [
      AuthorizedAppsSortColumn,
      AuthorizedAppsSortOrder,
    ]
    const orderMultiplier = sortOrder === 'asc' ? 1 : -1

    return [...displayedAuthorizedApps].sort((a, b) => {
      if (sortColumn === 'authorized') {
        return (
          (new Date(a.authorized_at).getTime() - new Date(b.authorized_at).getTime()) *
          orderMultiplier
        )
      }

      return 0
    })
  }, [authorizedAppsSort, displayedAuthorizedApps])
  const hasPublishedApps = displayedPublishedApps.length > 0
  const hasAuthorizedApps = displayedAuthorizedApps.length > 0
  const avatarHeadClass = 'w-[62px] min-w-[62px] max-w-[62px]'
  const avatarHeadCollapsedClass = 'w-0 min-w-0 max-w-0 p-0'

  const handlePublishedSortChange = (column: PublishedAppsSortColumn) => {
    const [currentColumn, currentOrder] = publishedAppsSort.split(':') as [
      PublishedAppsSortColumn,
      PublishedAppsSortOrder,
    ]

    if (currentColumn === column) {
      setPublishedAppsSort(
        (currentOrder === 'asc' ? `${column}:desc` : `${column}:asc`) as PublishedAppsSort
      )
    } else {
      setPublishedAppsSort(`${column}:asc` as PublishedAppsSort)
    }
  }

  const handleAuthorizedSortChange = (column: AuthorizedAppsSortColumn) => {
    const [currentColumn, currentOrder] = authorizedAppsSort.split(':') as [
      AuthorizedAppsSortColumn,
      AuthorizedAppsSortOrder,
    ]

    if (currentColumn === column) {
      setAuthorizedAppsSort(
        (currentOrder === 'asc' ? `${column}:desc` : `${column}:asc`) as AuthorizedAppsSort
      )
    } else {
      setAuthorizedAppsSort(`${column}:asc` as AuthorizedAppsSort)
    }
  }

  return (
    <>
      <PageContainer size="default" className="pb-16">
        <PageSection id="published-apps" className="pt-12">
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Published apps</PageSectionTitle>
              <PageSectionDescription>
                Build integrations that extend Supabase's functionality
              </PageSectionDescription>
            </PageSectionSummary>
            <PageSectionAside>
              <ButtonTooltip
                disabled={!canCreateOAuthApps}
                type="primary"
                onClick={() => setShowPublishModal(true)}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canCreateOAuthApps
                      ? 'You need additional permissions to create apps'
                      : undefined,
                  },
                }}
              >
                Publish OAuth app
              </ButtonTooltip>
            </PageSectionAside>
          </PageSectionMeta>
          <PageSectionContent className="space-y-4">
            {(isLoadingPublishedApps || isLoadingPermissions) && !isMockOAuthAppsEnabled ? (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            ) : !canViewOAuthApps ? (
              <NoPermission resourceText="view OAuth apps" />
            ) : null}

            {isErrorPublishedApps && !isMockOAuthAppsEnabled && (
              <AlertError
                error={publishedAppsError}
                subject="Failed to retrieve published OAuth apps"
              />
            )}

            {createdApp !== undefined && (
              <div
                className={cn(
                  'flex items-center justify-between p-4 px-6 border first:rounded-t last:rounded-b',
                  'bg-background-alternative',
                  'rounded'
                )}
              >
                <div className="absolute top-4 right-4">
                  <Button
                    type="text"
                    icon={<X size={18} />}
                    className="px-1"
                    onClick={() => setCreatedApp(undefined)}
                  />
                </div>
                <div className="w-full space-y-4">
                  <div className="flex flex-col gap-0">
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-brand" strokeWidth={3} />
                      <p className="text-sm">You've created your new OAuth application.</p>
                    </div>
                    <p className="text-sm text-foreground-light">
                      Ensure that you store the client secret securely - you will not be able to see
                      it again.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground-light">Client ID</p>
                      <p className="font-mono text-sm">{createdApp.client_id}</p>
                      <CopyButton text={createdApp.client_id} type="default" iconOnly />
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground-light">Client Secret</p>
                      <p className="font-mono text-sm">{createdApp.client_secret}</p>
                      <CopyButton text={createdApp.client_secret} type="default" iconOnly />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(isSuccessPublishedApps || isMockOAuthAppsEnabled) && (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className={cn(
                          hasPublishedApps ? avatarHeadClass : avatarHeadCollapsedClass,
                          !hasPublishedApps && 'text-foreground-muted'
                        )}
                      >
                        <span className="sr-only">Avatar</span>
                      </TableHead>
                      <TableHead className={cn(!hasPublishedApps && 'text-foreground-muted')}>
                        Name
                      </TableHead>
                      <TableHead className={cn(!hasPublishedApps && 'text-foreground-muted')}>
                        Client ID
                      </TableHead>
                      <TableHead className={cn(!hasPublishedApps && 'text-foreground-muted')}>
                        {hasPublishedApps ? (
                          <TableHeadSort
                            column="created"
                            currentSort={publishedAppsSort}
                            onSortChange={handlePublishedSortChange}
                          >
                            CREATED
                          </TableHeadSort>
                        ) : (
                          'CREATED'
                        )}
                      </TableHead>
                      <TableHead
                        className={cn('text-right', !hasPublishedApps && 'text-foreground-muted')}
                      >
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hasPublishedApps ? (
                      sortedPublishedApps?.map((app) => (
                        <OAuthAppRow
                          key={app.id}
                          app={app}
                          onSelectEdit={() => {
                            setShowPublishModal(true)
                            setSelectedAppToUpdate(app)
                          }}
                          onSelectDelete={() => setSelectedAppToDelete(app)}
                        />
                      ))
                    ) : (
                      <TableRow className="[&>td]:hover:bg-inherit">
                        <TableCell colSpan={5}>
                          <p className="text-sm text-foreground">No results found</p>
                          <p className="text-sm text-foreground-lighter">
                            You do not have any published applications yet
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </PageSectionContent>
        </PageSection>

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
            {(isLoadingAuthorizedApps || isLoadingPermissions) && !isMockOAuthAppsEnabled ? (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            ) : !canViewOAuthApps ? (
              <NoPermission resourceText="view authorized apps" />
            ) : null}

            {isErrorAuthorizedApps && !isMockOAuthAppsEnabled && (
              <AlertError subject="Failed to retrieve authorized apps" />
            )}

            {(isSuccessAuthorizedApps || isMockOAuthAppsEnabled) && (
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
        </PageSection>
      </PageContainer>

      <PublishAppSidePanel
        visible={showPublishModal}
        selectedApp={selectedAppToUpdate}
        onClose={() => {
          setSelectedAppToUpdate(undefined)
          setShowPublishModal(false)
        }}
        onCreateSuccess={setCreatedApp}
      />
      <DeleteAppModal
        selectedApp={selectedAppToDelete}
        onClose={() => setSelectedAppToDelete(undefined)}
      />
      <RevokeAppModal
        selectedApp={selectedAppToRevoke}
        onClose={() => setSelectedAppToRevoke(undefined)}
      />
    </>
  )
}
