import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { AlertError } from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { NoPermission } from 'components/ui/NoPermission'
import { useAPIKeyDeleteMutation } from 'data/api-keys/api-key-delete-mutation'
import { APIKeysData, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'

import { APIKeyRow } from './APIKeyRow'
import { CreatePublishableAPIKeyDialog } from './CreatePublishableAPIKeyDialog'

export const PublishableAPIKeys = () => {
  const { ref: projectRef } = useParams()
  const { can: canReadAPIKeys, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.SECRETS_READ,
    '*'
  )

  const {
    data: apiKeysData = [],
    error,
    isSuccess: isSuccessApiKeys,
    isPending: isLoadingApiKeys,
    isError: isErrorApiKeys,
  } = useAPIKeysQuery({ projectRef, reveal: false }, { enabled: canReadAPIKeys })

  const newApiKeys = useMemo(
    () => apiKeysData.filter(({ type }) => type === 'publishable' || type === 'secret') ?? [],
    [apiKeysData]
  )
  const hasApiKeys = newApiKeys.length > 0

  const publishableApiKeys = useMemo(
    () =>
      apiKeysData?.filter(
        (key): key is Extract<APIKeysData[number], { type: 'publishable' }> =>
          key.type === 'publishable'
      ) ?? [],
    [apiKeysData]
  )

  const [deleteId, setDeleteId] = useQueryState('deletePublishableKey', parseAsString)
  const apiKeyToDelete = publishableApiKeys?.find((key) => key.id === deleteId)

  const {
    mutate: deleteAPIKey,
    isPending: isDeletingAPIKey,
    isSuccess: isDeleteSuccess,
  } = useAPIKeyDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted publishable key')
      setDeleteId(null)
    },
  })

  const onDeleteAPIKey = (apiKey: Extract<APIKeysData[number], { type: 'publishable' }>) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!apiKey.id) return console.error('API key ID is required')
    deleteAPIKey({ projectRef, id: apiKey.id })
  }

  useEffect(() => {
    if (isSuccessApiKeys && !!deleteId && !apiKeyToDelete && !isDeleteSuccess) {
      toast('Unable to find publishable key')
      setDeleteId(null)
    }
  }, [apiKeyToDelete, deleteId, isDeleteSuccess, isSuccessApiKeys, setDeleteId])

  return (
    <div>
      <FormHeader
        title="Publishable key"
        description="This key is safe to use in a browser if you have enabled Row Level Security (RLS) for your tables and configured policies."
        actions={<CreatePublishableAPIKeyDialog />}
      />

      {!canReadAPIKeys && !isLoadingPermissions ? (
        <NoPermission resourceText="view API keys" />
      ) : isLoadingApiKeys || isLoadingPermissions ? (
        <GenericSkeletonLoader />
      ) : isErrorApiKeys ? (
        <AlertError error={error} subject="Failed to load API keys" />
      ) : (
        <Card className="bg-surface-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-200">
                <TableHead>Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {hasApiKeys && publishableApiKeys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="p-0">
                    <Admonition showIcon={false} type="default" className="border-0 rounded-none">
                      <p className="text-foreground-light">No publishable keys created yet</p>
                    </Admonition>
                  </TableCell>
                </TableRow>
              )}
              {publishableApiKeys.map((apiKey) => (
                <APIKeyRow
                  showLastSeen={false}
                  key={apiKey.id}
                  apiKey={apiKey}
                  isDeleting={apiKeyToDelete?.id === apiKey.id && isDeletingAPIKey}
                  isDeleteModalOpen={apiKeyToDelete?.id === apiKey.id}
                  onDelete={() => onDeleteAPIKey(apiKey)}
                  setKeyToDelete={setDeleteId}
                />
              ))}
            </TableBody>

            <TableFooter className="border-t">
              <TableRow className="border-b-0">
                <TableCell colSpan={3} className="py-2">
                  <p className="text-xs text-foreground-lighter font-normal">
                    Publishable keys can be safely shared publicly
                  </p>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Card>
      )}
    </div>
  )
}
