import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useState } from 'react'
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
import { OAuthAppsMemberGrantsDialog } from './OAuthAppsMemberGrantsDialog'
import { OAuthAppsRevokeDialog } from './OAuthAppsRevokeDialog'
import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import { useOAuthAuthorizedAppsQuery } from '@/data/oauth-apps/oauth-apps-authorized-apps-query'
import type { OAuthAppOverviewItem } from '@/data/oauth-apps/types'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

export const OAuthAppsAuthorizedList = () => {
  const { slug } = useParams()
  const [selectedAppForGrants, setSelectedAppForGrants] = useState<OAuthAppOverviewItem>()
  const [selectedAppToRevoke, setSelectedAppToRevoke] = useState<OAuthAppOverviewItem>()

  const { can: canReadOAuthApps, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'approved_oauth_apps'
  )
  const { can: canRevokeOAuthApps } = useAsyncCheckPermissions(
    PermissionAction.DELETE,
    'approved_oauth_apps'
  )

  const { data: apps, isPending, isSuccess, isError, error } = useOAuthAuthorizedAppsQuery({ slug })

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
                  <TableHead>Status</TableHead>
                  <TableHead>Grants</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.data.length === 0 ? (
                  <TableRow className="[&>td]:hover:bg-inherit">
                    <TableCell colSpan={4}>
                      <p className="text-sm text-foreground-lighter">
                        No apps have been authorized in this organization yet.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  apps.data.map((app) => (
                    <OAuthAppsAuthorizedRow
                      key={app.id}
                      app={app}
                      canRevoke={canRevokeOAuthApps}
                      onSelectViewGrants={() => setSelectedAppForGrants(app)}
                      onSelectRevoke={() => setSelectedAppToRevoke(app)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </PageSectionContent>

      <OAuthAppsMemberGrantsDialog
        app={selectedAppForGrants}
        onClose={() => setSelectedAppForGrants(undefined)}
      />
      <OAuthAppsRevokeDialog
        app={selectedAppToRevoke}
        onClose={() => setSelectedAppToRevoke(undefined)}
      />
    </PageSection>
  )
}
