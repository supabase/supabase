import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import { useSecretsDeleteMutation } from 'data/secrets/secrets-delete-mutation'
import { useSecretsQuery } from 'data/secrets/secrets-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Search } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import AddNewSecretForm from './AddNewSecretForm'
import EdgeFunctionSecret from './EdgeFunctionSecret'
import { EditSecretSheet } from './EditSecretSheet'

export const EdgeFunctionSecrets = () => {
  const { ref: projectRef } = useParams()
  const [searchString, setSearchString] = useState('')

  const { can: canReadSecrets, isLoading: isLoadingSecretsPermissions } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_SECRET_READ,
    '*'
  )
  const { can: canUpdateSecrets } = useAsyncCheckPermissions(PermissionAction.SECRETS_WRITE, '*')

  const {
    data = [],
    error,
    isPending: isLoading,
    isSuccess,
    isError,
  } = useSecretsQuery({ projectRef: projectRef }, { enabled: canReadSecrets })

  const [selectedIdToEdit, setSelectedIdToEdit] = useQueryState(
    'edit',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )
  const selectedSecretToEdit = data.find((secret) => secret.name === selectedIdToEdit)

  const [selectedIdToDelete, setSelectedIdToDelete] = useQueryState(
    'delete',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )
  const selectedSecretToDelete = data.find((secret) => secret.name === selectedIdToDelete)

  const {
    mutate: deleteSecret,
    isPending: isDeleting,
    isSuccess: isSuccessDelete,
  } = useSecretsDeleteMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully deleted secret “${variables.secrets[0]}”`)
      setSelectedIdToDelete(null)
    },
  })

  const secrets =
    searchString.length > 0
      ? data?.filter((secret) => secret.name.toLowerCase().includes(searchString.toLowerCase())) ??
        []
      : data ?? []

  const headers = [
    <TableHead key="secret-name">Name</TableHead>,
    <TableHead key="secret-value" className="flex items-center gap-x-2">
      Digest <Badge variant="default">SHA256</Badge>
    </TableHead>,
    <TableHead key="secret-updated-at">Updated</TableHead>,
    <TableHead key="actions" />,
  ]

  const showLoadingState = isLoadingSecretsPermissions || (canReadSecrets && isLoading)

  useEffect(() => {
    if (!!selectedIdToEdit && isSuccess && !selectedSecretToEdit) {
      toast(`Secret ${selectedIdToEdit} cannot be found`)
      setSelectedIdToEdit(null)
    }
  }, [isSuccess, selectedIdToEdit, selectedSecretToEdit, setSelectedIdToEdit])

  useEffect(() => {
    if (!!selectedIdToDelete && isSuccess && !selectedSecretToDelete && !isSuccessDelete) {
      toast(`Secret ${selectedIdToDelete} cannot be found`)
      setSelectedIdToDelete(null)
    }
  }, [
    isSuccess,
    isSuccessDelete,
    selectedIdToDelete,
    selectedSecretToDelete,
    setSelectedIdToDelete,
  ])

  return (
    <>
      {showLoadingState ? (
        <GenericSkeletonLoader />
      ) : !canReadSecrets ? (
        <NoPermission resourceText="view this project's edge function secrets" />
      ) : (
        <>
          {isError && <AlertError error={error} subject="Failed to retrieve project secrets" />}

          {isSuccess && (
            <>
              <div className="mb-10">
                {!canUpdateSecrets ? (
                  <NoPermission resourceText="manage this project's edge function secrets" />
                ) : (
                  <AddNewSecretForm />
                )}
              </div>
              {canUpdateSecrets && !canReadSecrets ? (
                <NoPermission resourceText="view this project's edge function secrets" />
              ) : canReadSecrets ? (
                <div className="space-y-4 mt-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <Input
                      size="small"
                      className="w-full md:w-80"
                      placeholder="Search for a secret"
                      value={searchString}
                      onChange={(e) => setSearchString(e.target.value)}
                      icon={<Search />}
                    />
                  </div>

                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>{headers}</TableRow>
                      </TableHeader>
                      <TableBody>
                        {secrets.length > 0 ? (
                          secrets.map((secret) => (
                            <EdgeFunctionSecret
                              key={secret.name}
                              secret={secret}
                              onSelectEdit={() => setSelectedIdToEdit(secret.name)}
                              onSelectDelete={() => setSelectedIdToDelete(secret.name)}
                            />
                          ))
                        ) : secrets.length === 0 && searchString.length > 0 ? (
                          <TableRow className="[&>td]:hover:bg-inherit">
                            <TableCell colSpan={headers.length}>
                              <p className="text-sm text-foreground">No results found</p>
                              <p className="text-sm text-foreground-light">
                                Your search for "{searchString}" did not return any results
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow className="[&>td]:hover:bg-inherit">
                            <TableCell colSpan={headers.length}>
                              <p className="text-sm text-foreground">No secrets created</p>
                              <p className="text-sm text-foreground-light">
                                There are no secrets associated with your project yet
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              ) : null}
            </>
          )}
        </>
      )}

      <EditSecretSheet
        secret={selectedSecretToEdit}
        visible={!!selectedSecretToEdit}
        onClose={() => setSelectedIdToEdit(null)}
      />

      <ConfirmationModal
        variant="destructive"
        loading={isDeleting}
        visible={!!selectedSecretToDelete}
        confirmLabel="Delete secret"
        confirmLabelLoading="Deleting secret"
        title={`Delete secret “${selectedSecretToDelete?.name}”`}
        onCancel={() => setSelectedIdToDelete(null)}
        onConfirm={() => {
          if (selectedSecretToDelete) {
            deleteSecret({ projectRef, secrets: [selectedSecretToDelete.name] })
          }
        }}
      >
        <p className="text-sm">
          Ensure none of your edge functions are actively using this secret before deleting it. This
          action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}
