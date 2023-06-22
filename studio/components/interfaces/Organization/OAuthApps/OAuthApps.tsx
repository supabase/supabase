import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import { OAuthApp, useOAuthAppsQuery } from 'data/oauth/oauth-apps-query'
import { useState } from 'react'
import { Button, IconEdit, IconTrash } from 'ui'
import PublishAppModal from './PublishAppModal'
import DeleteAppModal from './DeleteAppModal'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import AlertError from 'components/ui/AlertError'

// [Joshen] Just FYI need to relook at the copy writing at the end

const OAuthApps = () => {
  const { slug } = useParams()
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [selectedAppToUpdate, setSelectedAppToUpdate] = useState<OAuthApp>()
  const [selectedAppToDelete, setSelectedAppToDelete] = useState<OAuthApp>()

  const {
    data: publishedApps,
    isLoading,
    isSuccess,
    isError,
  } = useOAuthAppsQuery({
    slug,
    type: 'published',
  })

  const sortedPublishedApps = publishedApps?.sort((a, b) => {
    return Number(new Date(a.created_at)) - Number(new Date(b.created_at))
  })

  return (
    <>
      <div className="container my-4 max-w-4xl space-y-8">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p>Published Apps</p>
              <p className="text-scale-1000 text-sm">
                Build on top of the Supabase platform by having access to your organization's
                settings and projects
              </p>
            </div>
            <Button type="primary" onClick={() => setShowPublishModal(true)}>
              Add application
            </Button>
          </div>

          <div className="mt-4">
            {isLoading && (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            )}

            {isError && <AlertError subject="Unable to retrieve published OAuth apps" />}

            {isSuccess && (
              <>
                {(publishedApps?.length ?? 0) === 0 ? (
                  <div className="bg-scale-100 dark:bg-scale-300 border rounded p-4 flex items-center justify-between">
                    <p className="prose text-sm">You do not have any published applications yet</p>
                  </div>
                ) : (
                  <Table
                    className="mt-4"
                    head={[
                      <Table.th key="name">Name</Table.th>,
                      <Table.th key="client-id">Client ID</Table.th>,
                      <Table.th key="client-secret">Client Secret</Table.th>,
                      <Table.th key="delete-action"></Table.th>,
                    ]}
                    body={
                      sortedPublishedApps?.map((app) => (
                        <Table.tr key={app.id}>
                          <Table.td>{app.name}</Table.td>
                          <Table.td>{app.client_id}</Table.td>
                          <Table.td>{app.client_secret_alias}</Table.td>
                          <Table.td align="right">
                            <div className="space-x-2">
                              <Button
                                type="default"
                                title="Delete app"
                                icon={<IconEdit />}
                                className="px-1"
                                onClick={() => {
                                  setShowPublishModal(true)
                                  setSelectedAppToUpdate(app)
                                }}
                              />
                              <Button
                                type="default"
                                title="Delete app"
                                icon={<IconTrash />}
                                className="px-1"
                                onClick={() => setSelectedAppToDelete(app)}
                              />
                            </div>
                          </Table.td>
                        </Table.tr>
                      )) ?? []
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* <div>
          <p>Authorized Apps</p>
          <p className="text-scale-1000 text-sm">
            Applications that have access to your organization's settings and projects
          </p>

          <div className="mt-4">
            {(authorizedApps?.length ?? 0) === 0 ? (
              <div className="bg-scale-100 dark:bg-scale-300 border rounded p-4 flex items-center justify-between">
                <p className="prose text-sm">You do not have any authorized applications yet</p>
              </div>
            ) : (
              <Table
                className="mt-4"
                head={[
                  <Table.th key="name">Name</Table.th>,
                  <Table.th key="clientId">Client ID</Table.th>,
                  <Table.th key="clientSecret">Client Secret</Table.th>,
                ]}
                body={
                  publishedApps?.map((app) => (
                    <Table.tr key={app.id}>
                      <Table.td>{app.name}</Table.td>
                      <Table.td>{app.name}</Table.td>
                      <Table.td>{app.name}</Table.td>
                    </Table.tr>
                  )) ?? []
                }
              />
            )}
          </div>
        </div> */}
      </div>

      <PublishAppModal
        visible={showPublishModal}
        selectedApp={selectedAppToUpdate}
        onClose={() => {
          setSelectedAppToUpdate(undefined)
          setShowPublishModal(false)
        }}
      />
      <DeleteAppModal
        selectedApp={selectedAppToDelete}
        onClose={() => setSelectedAppToDelete(undefined)}
      />
    </>
  )
}

export default OAuthApps
