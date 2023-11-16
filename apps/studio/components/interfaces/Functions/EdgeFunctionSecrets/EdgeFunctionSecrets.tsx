import { useParams } from 'common'
import Link from 'next/link'
import { useState } from 'react'
import { Button, IconExternalLink, IconSearch, Input, Modal } from 'ui'

import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useSecretsDeleteMutation } from 'data/secrets/secrets-delete-mutation'
import { ProjectSecret, useSecretsQuery } from 'data/secrets/secrets-query'
import { useStore } from 'hooks'
import AddNewSecretModal from './AddNewSecretModal'
import EdgeFunctionSecret from './EdgeFunctionSecret'

const EdgeFunctionSecrets = () => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const [searchString, setSearchString] = useState('')
  const [showCreateSecret, setShowCreateSecret] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<ProjectSecret>()

  const { data, error, isLoading, isSuccess, isError } = useSecretsQuery({
    projectRef: projectRef,
  })

  const { mutate: deleteSecret, isLoading: isDeleting } = useSecretsDeleteMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted ${selectedSecret?.name}`,
      })
      setSelectedSecret(undefined)
    },
  })

  const secrets =
    searchString.length > 0
      ? data?.filter((secret) => secret.name.toLowerCase().includes(searchString.toLowerCase())) ??
        []
      : data ?? []

  return (
    <>
      <div>
        <h3 className="mb-2 text-xl text-foreground">Edge Function Secrets Management</h3>
        <div className="text-sm text-foreground-lighter">
          Manage the secrets for your project's edge functions
        </div>
      </div>

      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve project secrets" />}

      {isSuccess && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Input
              size="small"
              className="w-80"
              placeholder="Search for a secret"
              value={searchString}
              onChange={(e: any) => setSearchString(e.target.value)}
              icon={<IconSearch size="tiny" />}
            />
            <div className="flex items-center space-x-2">
              <Button
                asChild
                type="default"
                icon={<IconExternalLink size={14} strokeWidth={1.5} />}
              >
                <Link
                  href="https://supabase.com/docs/guides/functions/secrets"
                  target="_blank"
                  rel="noreferrer"
                >
                  Documentation
                </Link>
              </Button>
              <Button onClick={() => setShowCreateSecret(true)}>Add new secret</Button>
            </div>
          </div>
          <Table
            head={[
              <Table.th key="secret-name">Name</Table.th>,
              <Table.th key="secret-value">Digest</Table.th>,
              <Table.th key="actions" />,
            ]}
            body={
              secrets.length > 0 ? (
                secrets.map((secret) => (
                  <EdgeFunctionSecret
                    key={secret.name}
                    secret={secret}
                    onSelectDelete={() => setSelectedSecret(secret)}
                  />
                ))
              ) : secrets.length === 0 && searchString.length > 0 ? (
                <Table.tr>
                  <Table.td colSpan={3}>
                    <p className="text-sm text-foreground">No results found</p>
                    <p className="text-sm text-foreground-light">
                      Your search for "{searchString}" did not return any results
                    </p>
                  </Table.td>
                </Table.tr>
              ) : (
                <Table.tr>
                  <Table.td colSpan={3}>
                    <p className="text-sm text-foreground">No secrets created</p>
                    <p className="text-sm text-foreground-light">
                      There are no secrets associated with your project yet
                    </p>
                  </Table.td>
                </Table.tr>
              )
            }
          />
        </div>
      )}

      <AddNewSecretModal visible={showCreateSecret} onClose={() => setShowCreateSecret(false)} />

      <ConfirmationModal
        loading={isDeleting}
        visible={selectedSecret !== undefined}
        buttonLabel="Delete secret"
        buttonLoadingLabel="Deleting secret"
        header={`Confirm to delete secret "${selectedSecret?.name}"`}
        onSelectCancel={() => setSelectedSecret(undefined)}
        onSelectConfirm={() => {
          if (selectedSecret !== undefined) {
            deleteSecret({ projectRef, secrets: [selectedSecret.name] })
          }
        }}
      >
        <Modal.Content className="py-4">
          <p className="text-sm">
            Before removing this secret, do ensure that none of your edge functions are currently
            actively using this secret. This action cannot be undone.
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}

export default EdgeFunctionSecrets
