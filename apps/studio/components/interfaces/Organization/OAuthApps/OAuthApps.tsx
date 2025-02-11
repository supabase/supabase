import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { useParams } from 'common'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { AuthorizedApp, useAuthorizedAppsQuery } from 'data/oauth/authorized-apps-query'
import { OAuthAppCreateResponse } from 'data/oauth/oauth-app-create-mutation'
import { OAuthApp, useOAuthAppsQuery } from 'data/oauth/oauth-apps-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Alert, Button, Input } from 'ui'
import AuthorizedAppRow from './AuthorizedAppRow'
import DeleteAppModal from './DeleteAppModal'
import OAuthAppRow from './OAuthAppRow'
import PublishAppModal from './PublishAppSidePanel'
import RevokeAppModal from './RevokeAppModal'
import { X } from 'lucide-react'

// [Joshen] Note on nav UX
// Kang Ming mentioned that it might be better to split Published Apps and Authorized Apps into 2 separate tabs
// to prevent any confusion (case study: Github). Authorized apps could be in the "integrations" tab, but let's
// check in again after we wrap up Vercel integration

const OAuthApps = () => {
  const { slug } = useParams()
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [createdApp, setCreatedApp] = useState<OAuthAppCreateResponse>()
  const [selectedAppToUpdate, setSelectedAppToUpdate] = useState<OAuthApp>()
  const [selectedAppToDelete, setSelectedAppToDelete] = useState<OAuthApp>()
  const [selectedAppToRevoke, setSelectedAppToRevoke] = useState<AuthorizedApp>()

  const canReadOAuthApps = useCheckPermissions(PermissionAction.READ, 'approved_oauth_apps')
  const canCreateOAuthApps = useCheckPermissions(PermissionAction.CREATE, 'approved_oauth_apps')

  const {
    data: publishedApps,
    error: publishedAppsError,
    isLoading: isLoadingPublishedApps,
    isSuccess: isSuccessPublishedApps,
    isError: isErrorPublishedApps,
  } = useOAuthAppsQuery({ slug }, { enabled: canReadOAuthApps })

  const sortedPublishedApps = publishedApps?.sort((a, b) => {
    return Number(new Date(a.created_at)) - Number(new Date(b.created_at))
  })

  const {
    data: authorizedApps,
    isLoading: isLoadingAuthorizedApps,
    isSuccess: isSuccessAuthorizedApps,
    isError: isErrorAuthorizedApps,
  } = useAuthorizedAppsQuery({ slug })

  const sortedAuthorizedApps = authorizedApps?.sort((a, b) => {
    return Number(new Date(a.authorized_at)) - Number(new Date(b.authorized_at))
  })

  if (!canReadOAuthApps) {
    return (
      <ScaffoldContainerLegacy>
        <NoPermission resourceText="view OAuth apps" />
      </ScaffoldContainerLegacy>
    )
  }

  return (
    <>
      <ScaffoldContainerLegacy>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p>Published Apps</p>
              <p className="text-foreground-light text-sm">
                Build integrations that extend Supabase's functionality
              </p>
            </div>
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
              Add application
            </ButtonTooltip>
          </div>

          {isLoadingPublishedApps && (
            <div className="space-y-2">
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          )}

          {isErrorPublishedApps && (
            <AlertError
              error={publishedAppsError}
              subject="Failed to retrieve published OAuth apps"
            />
          )}

          {createdApp !== undefined && (
            <Alert withIcon variant="success" title="Successfully published a new application!">
              <div className="absolute top-4 right-4">
                <Button
                  type="text"
                  icon={<X size={18} />}
                  className="px-1"
                  onClick={() => setCreatedApp(undefined)}
                />
              </div>
              <div className="w-full space-y-4">
                <p className="text-sm">
                  Ensure that you store the client secret securely - you will not be able to see it
                  again.
                </p>
                <div className="space-y-4">
                  <Input
                    copy
                    readOnly
                    size="small"
                    label="Client ID"
                    className="max-w-xl input-mono"
                    value={createdApp.client_id}
                    onChange={() => {}}
                  />
                  <Input
                    copy
                    readOnly
                    size="small"
                    label="Client secret"
                    className="max-w-xl input-mono"
                    value={createdApp.client_secret}
                    onChange={() => {}}
                  />
                </div>
              </div>
            </Alert>
          )}

          {isSuccessPublishedApps && (
            <>
              {(publishedApps?.length ?? 0) === 0 ? (
                <div className="bg-surface-100 border rounded p-4 flex items-center justify-between mt-4">
                  <p className="prose text-sm">You do not have any published applications yet</p>
                </div>
              ) : (
                <Table
                  head={[
                    <Table.th key="icon" className="w-[30px]"></Table.th>,
                    <Table.th key="name">Name</Table.th>,
                    <Table.th key="client-id">Client ID</Table.th>,
                    <Table.th key="client-secret">Client Secret</Table.th>,
                    <Table.th key="created-at">Created at</Table.th>,
                    <Table.th key="delete-action"></Table.th>,
                  ]}
                  body={
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
                    )) ?? []
                  }
                />
              )}
            </>
          )}
        </div>

        <div>
          <p>Authorized Apps</p>
          <p className="text-foreground-light text-sm">
            Applications that have access to your organization's settings and projects
          </p>

          <div className="mt-4">
            {isLoadingAuthorizedApps && (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            )}

            {isErrorAuthorizedApps && <AlertError subject="Failed to retrieve authorized apps" />}

            {isSuccessAuthorizedApps && (
              <>
                {(authorizedApps.length ?? 0) === 0 ? (
                  <div className="bg-surface-100 border rounded p-4 flex items-center justify-between">
                    <p className="prose text-sm">You do not have any authorized applications yet</p>
                  </div>
                ) : (
                  <Table
                    className="mt-4"
                    head={[
                      <Table.th key="icon" className="w-[30px]"></Table.th>,
                      <Table.th key="name">Name</Table.th>,
                      <Table.th key="authorized-at">Authorized at</Table.th>,
                      <Table.th key="delete-action"></Table.th>,
                    ]}
                    body={
                      sortedAuthorizedApps?.map((app) => (
                        <AuthorizedAppRow
                          key={app.id}
                          app={app}
                          onSelectRevoke={() => setSelectedAppToRevoke(app)}
                        />
                      )) ?? []
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>
      </ScaffoldContainerLegacy>

      <PublishAppModal
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

export default OAuthApps
