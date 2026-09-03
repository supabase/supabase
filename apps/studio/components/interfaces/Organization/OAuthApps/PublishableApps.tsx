import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
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

import { DeleteAppModal } from './DeleteAppModal'
import { OAuthAppRow } from './OAuthAppRow'
import { parseSort, toggleSort } from './OAuthApps.utils'
import { PublishAppSidePanel } from './PublishAppSidePanel'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import CopyButton from '@/components/ui/CopyButton'
import { NoPermission } from '@/components/ui/NoPermission'
import { Shortcut } from '@/components/ui/Shortcut'
import { OAuthAppCreateResponse } from '@/data/oauth/oauth-app-create-mutation'
import { OAuthApp, useOAuthAppsQuery } from '@/data/oauth/oauth-apps-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

type PublishedAppsSort = 'created:asc' | 'created:desc'
type PublishedAppsSortColumn = 'created'

export const PublishableApps = () => {
  const { slug } = useParams()
  const [createdApp, setCreatedApp] = useState<OAuthAppCreateResponse>()
  const [publishedAppsSort, setPublishedAppsSort] = useState<PublishedAppsSort>('created:asc')
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [selectedAppToUpdate, setSelectedAppToUpdate] = useState<OAuthApp>()
  const [selectedAppToDelete, setSelectedAppToDelete] = useState<OAuthApp>()

  const { can: canReadOAuthApps, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'approved_oauth_apps'
  )
  const { can: canCreateOAuthApps } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'approved_oauth_apps'
  )

  const {
    data: publishedApps,
    error: publishedAppsError,
    isPending: isLoadingPublishedApps,
    isSuccess: isSuccessPublishedApps,
    isError: isErrorPublishedApps,
  } = useOAuthAppsQuery({ slug }, { enabled: canReadOAuthApps })

  const sortedPublishedApps = useMemo(() => {
    const [sortColumn, sortOrder] = parseSort<PublishedAppsSortColumn>(publishedAppsSort)
    const orderMultiplier = sortOrder === 'asc' ? 1 : -1

    return [...(publishedApps ?? [])].sort((a, b) => {
      if (sortColumn === 'created') {
        return (
          (new Date(a.created_at ?? '').getTime() - new Date(b.created_at ?? '').getTime()) *
          orderMultiplier
        )
      }

      return 0
    })
  }, [publishedApps, publishedAppsSort])

  const hasPublishedApps = (publishedApps?.length ?? 0) > 0

  const handlePublishedSortChange = (column: PublishedAppsSortColumn) => {
    toggleSort(publishedAppsSort, column, setPublishedAppsSort)
  }

  return (
    <PageSection id="published-apps" className="pt-12">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Published apps</PageSectionTitle>
          <PageSectionDescription>
            Build integrations that extend Supabase's functionality
          </PageSectionDescription>
        </PageSectionSummary>
        <PageSectionAside>
          <Shortcut
            id={SHORTCUT_IDS.ORG_OAUTH_APPS_PUBLISH}
            onTrigger={() => {
              if (canCreateOAuthApps) setShowPublishModal(true)
            }}
            side="bottom"
            tooltipOpen={showPublishModal ? false : undefined}
          >
            <ButtonTooltip
              disabled={!canCreateOAuthApps}
              variant="primary"
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
          </Shortcut>
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent className="space-y-4">
        {isLoadingPublishedApps || isLoadingPermissions ? (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : !canReadOAuthApps ? (
          <NoPermission resourceText="view OAuth apps" />
        ) : null}

        {isErrorPublishedApps && (
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
              'rounded-sm'
            )}
          >
            <div className="absolute top-4 right-4">
              <Button
                variant="text"
                icon={<X size={18} />}
                className="px-1"
                onClick={() => setCreatedApp(undefined)}
                aria-label="Cancel"
              />
            </div>
            <div className="w-full space-y-4">
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-brand" strokeWidth={3} />
                  <p className="text-sm">You've created your new OAuth application.</p>
                </div>
                <p className="text-sm text-foreground-light">
                  Ensure that you store the client secret securely - you will not be able to see it
                  again.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground-light">Client ID</p>
                  <p className="font-mono text-sm">{createdApp.client_id}</p>
                  <CopyButton text={createdApp.client_id} variant="default" iconOnly />
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground-light">Client Secret</p>
                  <p className="font-mono text-sm">{createdApp.client_secret}</p>
                  <CopyButton text={createdApp.client_secret} variant="default" iconOnly />
                </div>
              </div>
            </div>
          </div>
        )}

        {isSuccessPublishedApps && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className={cn(
                      hasPublishedApps
                        ? 'w-[62px] min-w-[62px] max-w-[62px]'
                        : 'w-0 min-w-0 max-w-0 p-0',
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
    </PageSection>
  )
}
