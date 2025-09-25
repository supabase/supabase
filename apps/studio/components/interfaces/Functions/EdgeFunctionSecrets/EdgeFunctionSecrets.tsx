import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useSecretsDeleteMutation } from 'data/secrets/secrets-delete-mutation'
import { ProjectSecret, useSecretsQuery } from 'data/secrets/secrets-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import AddNewSecretForm from './AddNewSecretForm'
import EdgeFunctionSecret from './EdgeFunctionSecret'

const EdgeFunctionSecrets = () => {
  const { ref: projectRef } = useParams()
  const [searchString, setSearchString] = useState('')
  const [selectedSecret, setSelectedSecret] = useState<ProjectSecret>()

  const { can: canReadSecrets, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.SECRETS_READ,
    '*'
  )
  const { can: canUpdateSecrets } = useAsyncCheckPermissions(PermissionAction.SECRETS_WRITE, '*')

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

  const headers = [
    <TableHead key="secret-name">Name</TableHead>,
    <TableHead key="secret-value" className="flex items-center gap-x-2">
      Digest{' '}
      <Badge color="scale" className="font-mono">
        SHA256
      </Badge>
    </TableHead>,
    <TableHead key="secret-updated-at">Updated at</TableHead>,
    <TableHead key="actions" />,
  ]

  return (
    <>
      {isLoading || isLoadingPermissions ? (
        <GenericSkeletonLoader />
      ) : (
        <>
          {isError && <AlertError error={error} subject="Failed to retrieve project secrets" />}

          {isSuccess && (
            <>
              <div className="mb-6">
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
                      onChange={(e: any) => setSearchString(e.target.value)}
                      icon={<Search size={14} />}
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
                              onSelectDelete={() => setSelectedSecret(secret)}
                            />
                          ))
                        ) : secrets.length === 0 && searchString.length > 0 ? (
                          <TableRow>
                            <TableCell colSpan={headers.length}>
                              <p className="text-sm text-foreground">No results found</p>
                              <p className="text-sm text-foreground-light">
                                Your search for "{searchString}" did not return any results
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow>
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

      <ConfirmationModal
        variant="destructive"
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
          Before removing this secret, ensure none of your Edge Functions are actively using it.
          This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}

export default EdgeFunctionSecrets
