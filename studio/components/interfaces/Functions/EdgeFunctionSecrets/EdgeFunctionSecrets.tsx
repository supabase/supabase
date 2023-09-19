import { useParams } from 'common'
import { useState } from 'react'
import { Button, Modal } from 'ui'

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
  const [showCreateSecret, setShowCreateSecret] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<ProjectSecret>()

  const {
    data: secrets,
    error,
    isLoading,
    isSuccess,
    isError,
  } = useSecretsQuery({
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

  return (
    <>
      <div>
        <h3 className="mb-2 text-xl text-scale-1200">Edge Function Secrets Management</h3>
        <div className="text-sm text-scale-900">
          Manage the secrets for your project's edge functions
        </div>
      </div>

      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve project secrets" />}

      {isSuccess && (
        <Table
          head={[
            <Table.th key="secret-name" className="w-[250px]">
              Name
            </Table.th>,
            <Table.th key="secret-value">Value</Table.th>,
            <Table.th key="add-secret" className="w-[100px]">
              <div className="flex items-center justify-end">
                <Button onClick={() => setShowCreateSecret(true)}>Add new secret</Button>
              </div>
            </Table.th>,
          ]}
          body={secrets?.map((secret) => (
            <EdgeFunctionSecret
              key={secret.name}
              secret={secret}
              onSelectDelete={() => setSelectedSecret(secret)}
            />
          ))}
        />
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
