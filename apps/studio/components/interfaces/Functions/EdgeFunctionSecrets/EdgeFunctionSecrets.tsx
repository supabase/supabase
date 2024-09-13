import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ExternalLink, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useSecretsDeleteMutation } from 'data/secrets/secrets-delete-mutation'
import { ProjectSecret, useSecretsQuery } from 'data/secrets/secrets-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Button, Input } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import AddNewSecretModal from './AddNewSecretModal'
import EdgeFunctionSecret from './EdgeFunctionSecret'

const EdgeFunctionSecrets = () => {
  const { ref: projectRef } = useParams()
  const [searchString, setSearchString] = useState('')
  const [showCreateSecret, setShowCreateSecret] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<ProjectSecret>()

  const canReadSecrets = useCheckPermissions(PermissionAction.FUNCTIONS_READ, '*')
  const canUpdateSecrets = useCheckPermissions(PermissionAction.FUNCTIONS_WRITE, '*')

  const { data, error, isLoading, isSuccess, isError } = useSecretsQuery({
    projectRef: projectRef,
  })

  const { mutate: deleteSecret, isLoading: isDeleting } = useSecretsDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted ${selectedSecret?.name}`)
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
      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve project secrets" />}

      {isSuccess && (
        <div className="space-y-4">
          {!canReadSecrets ? (
            <NoPermission resourceText="view this project's edge function secrets" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Input
                  size="small"
                  className="w-80"
                  placeholder="Search for a secret"
                  value={searchString}
                  onChange={(e: any) => setSearchString(e.target.value)}
                  icon={<Search size={14} />}
                />
                <div className="flex items-center space-x-2">
                  <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://supabase.com/docs/guides/functions/secrets"
                    >
                      Documentation
                    </a>
                  </Button>
                  <ButtonTooltip
                    disabled={!canUpdateSecrets}
                    onClick={() => setShowCreateSecret(true)}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: 'You need additional permissions to update edge function secrets',
                      },
                    }}
                  >
                    Add new secret
                  </ButtonTooltip>
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
            </>
          )}
        </div>
      )}

      <AddNewSecretModal visible={showCreateSecret} onClose={() => setShowCreateSecret(false)} />

      <ConfirmationModal
        variant="warning"
        loading={isDeleting}
        visible={selectedSecret !== undefined}
        confirmLabel="Delete secret"
        confirmLabelLoading="Deleting secret"
        title={`Confirm to delete secret "${selectedSecret?.name}"`}
        onCancel={() => setSelectedSecret(undefined)}
        onConfirm={() => {
          if (selectedSecret !== undefined) {
            deleteSecret({ projectRef, secrets: [selectedSecret.name] })
          }
        }}
      >
        <p className="text-sm">
          Before removing this secret, do ensure that none of your edge functions are currently
          actively using this secret. This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}

export default EdgeFunctionSecrets
