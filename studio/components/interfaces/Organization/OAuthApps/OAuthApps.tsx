import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import { useOAuthAppsQuery } from 'data/oauth/oauth-apps-query'
import { useState } from 'react'
import { Button, Form, IconEdit, IconTrash, IconTrash2, Input, Modal } from 'ui'
import PublishAppModal from './PublishAppModal'

// [Joshen] Just FYI need to relook at the copy writing at the end
// - Loading state
// - Error state

const OAuthApps = () => {
  const { slug } = useParams()
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [selectedAppToUpdate, setSelectedAppToUpdate] = useState()
  const [selectedAppToDelete, setSelectedAppToDelete] = useState()

  const { data: publishedApps, isLoading: isLoadingPublishedApps } = useOAuthAppsQuery({
    slug,
    type: 'published',
  })

  console.log({ publishedApps })

  return (
    <>
      <div className="container my-4 max-w-4xl space-y-8">
        <div>
          <p>Published Apps</p>
          <p className="text-scale-1000 text-sm">
            Build on top of the Supabase platform by using OAuth to gain access to your
            organization's settings and projects
          </p>

          <div className="mt-4">
            {(publishedApps?.length ?? 0) === 0 ? (
              <div className="bg-scale-100 dark:bg-scale-300 border rounded p-4 flex items-center justify-between">
                <p className="prose text-sm">You do not have any published applications yet</p>
                <Button type="primary" onClick={() => setShowPublishModal(true)}>
                  Publish a new application
                </Button>
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
                  publishedApps?.map((app) => (
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
                          />
                          <Button
                            type="default"
                            title="Delete app"
                            icon={<IconTrash />}
                            className="px-1"
                          />
                        </div>
                      </Table.td>
                    </Table.tr>
                  )) ?? []
                }
              />
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

      <PublishAppModal visible={showPublishModal} onClose={() => setShowPublishModal(false)} />
    </>
  )
}

export default OAuthApps
