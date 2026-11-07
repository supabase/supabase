import { useQuery } from '@tanstack/react-query'
import { IS_PLATFORM, useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Card, Table, TableBody, TableHead, TableHeader, TableRow } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { APIKeyRow } from './APIKeyRow'
import { CreateSecretAPIKeyDialog } from './CreateSecretAPIKeyDialog'
import { AlertError } from '@/components/ui/AlertError'
import { FormHeader } from '@/components/ui/Forms/FormHeader'
import { NoPermission } from '@/components/ui/NoPermission'
import { useAPIKeyDeleteMutation } from '@/data/api-keys/api-key-delete-mutation'
import { apiKeysQueryOptions, type APIKeysData } from '@/data/api-keys/api-keys-query'
import { useGrant } from '@/lib/grants'

export const SecretAPIKeys = () => {
  const { ref: projectRef } = useParams()
  // Lists keys without their secret values (revealing happens per key), so a plain grant is enough
  const apiKeysGrant = useGrant('GET /v1/projects/{ref}/api-keys', { projectRef })

  const {
    data: apiKeysData,
    error,
    isSuccess: isSuccessApiKeys,
    isPending: isLoadingApiKeys,
    isError: isErrorApiKeys,
  } = useQuery(apiKeysQueryOptions({ projectRef, grant: apiKeysGrant.grant }))
  const isLoadingGrant = apiKeysGrant.status === 'loading'

  const secretApiKeys = useMemo(
    () =>
      apiKeysData?.filter(
        (key): key is Extract<APIKeysData[number], { type: 'secret' }> => key.type === 'secret'
      ) ?? [],
    [apiKeysData]
  )

  const empty = secretApiKeys?.length === 0 && !isLoadingApiKeys

  const [deleteId, setDeleteId] = useQueryState('deleteSecretKey', parseAsString)
  const apiKeyToDelete = secretApiKeys?.find((key) => key.id === deleteId)

  const {
    mutate: deleteAPIKey,
    isPending: isDeletingAPIKey,
    isSuccess: isDeleteSuccess,
  } = useAPIKeyDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted secret key')
      setDeleteId(null)
    },
  })

  const onDeleteAPIKey = (apiKey: Extract<APIKeysData[number], { type: 'secret' }>) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!apiKey.id) return console.error('API key ID is required')
    deleteAPIKey({ projectRef, id: apiKey.id })
  }

  useEffect(() => {
    if (isSuccessApiKeys && !!deleteId && !apiKeyToDelete && !isDeleteSuccess) {
      toast('Unable to find secret key')
      setDeleteId(null)
    }
  }, [apiKeyToDelete, deleteId, isDeleteSuccess, isSuccessApiKeys, setDeleteId])

  return (
    <div className="pb-30">
      <FormHeader
        title="Secret keys"
        description="These API keys allow privileged access to your project's APIs. Use in servers, functions, workers or other backend components of your application."
        actions={IS_PLATFORM ? <CreateSecretAPIKeyDialog /> : null}
      />

      {apiKeysGrant.status === 'denied' ? (
        <NoPermission resourceText="view API keys" />
      ) : apiKeysGrant.status === 'error' ? (
        <AlertError error={apiKeysGrant.error} subject="Failed to check API key permissions" />
      ) : isLoadingGrant || isLoadingApiKeys ? (
        <GenericSkeletonLoader />
      ) : isErrorApiKeys ? (
        <AlertError error={error} subject="Failed to load secret API keys" />
      ) : empty ? (
        <Card>
          <div className="rounded-b-md! overflow-hidden py-12 flex flex-col gap-1 items-center justify-center">
            <p className="text-sm text-foreground">No secret API keys found</p>
            <p className="text-sm text-foreground-light">
              Your project is not accessible via secret keys—there are no active secret keys
              created.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="bg-surface-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-200">
                <TableHead>Name</TableHead>
                <TableHead>API Key</TableHead>
                {IS_PLATFORM && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {secretApiKeys.map((apiKey) => (
                <APIKeyRow
                  key={apiKey.id}
                  apiKey={apiKey}
                  isDeleting={apiKeyToDelete?.id === apiKey.id && isDeletingAPIKey}
                  onDelete={() => onDeleteAPIKey(apiKey)}
                  setKeyToDelete={setDeleteId}
                  isDeleteModalOpen={apiKeyToDelete?.id === apiKey.id}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
