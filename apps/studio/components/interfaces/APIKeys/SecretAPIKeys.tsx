import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { useMemo, useRef } from 'react'
import { toast } from 'sonner'

import { useFlag, useParams } from 'common'
import { AlertError } from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { NoPermission } from 'components/ui/NoPermission'
import { useAPIKeyDeleteMutation } from 'data/api-keys/api-key-delete-mutation'
import type { APIKeysData } from 'data/api-keys/api-keys-query'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useLogsQuery } from 'hooks/analytics/useLogsQuery'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { handleErrorOnDelete, useQueryStateWithSelect } from 'hooks/misc/useQueryStateWithSelect'
import { Card } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui/src/components/shadcn/ui/table'
import { APIKeyRow } from './APIKeyRow'
import { CreateSecretAPIKeyDialog } from './CreateSecretAPIKeyDialog'

interface LastSeenData {
  [hash: string]: { timestamp: number; relative: string }
}

function useLastSeen({ projectRef, enabled }: { projectRef: string; enabled?: boolean }): {
  data?: LastSeenData
  isLoading: boolean
} {
  const now = useRef(new Date()).current

  const query = useLogsQuery(
    projectRef,
    {
      iso_timestamp_start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      iso_timestamp_end: now.toISOString(),
      sql: "-- last-used-secret-api-keys\nSELECT unix_millis(max(timestamp)) as timestamp, apikey.`hash` FROM edge_logs cross join unnest(metadata) as m cross join unnest(m.request) as request cross join unnest(request.sb) as sb cross join unnest(sb.apikey) as sbapikey cross join unnest(sbapikey.apikey) as apikey WHERE apikey.error is null and apikey.`hash` is not null and apikey.prefix like 'sb_secret_%' GROUP BY apikey.`hash`",
    },
    enabled
  )

  return useMemo(() => {
    if (query.isLoading || !query.logData) {
      return { data: undefined, isLoading: query.isLoading }
    }

    const now = dayjs()

    const lastSeen = (query.logData as unknown as { timestamp: number; hash: string }[]).reduce(
      (a, i) => {
        a[i.hash] = {
          timestamp: i.timestamp,
          relative: `${dayjs.duration(now.diff(dayjs(i.timestamp))).humanize(false)} ago`,
        }
        return a
      },
      {} as LastSeenData
    )

    return { data: lastSeen, isLoading: query.isLoading }
  }, [query])
}

export const SecretAPIKeys = () => {
  const { ref: projectRef } = useParams()
  const { can: canReadAPIKeys, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.SECRETS_READ,
    '*'
  )

  const {
    data: apiKeysData,
    error,
    isPending: isLoadingApiKeys,
    isError: isErrorApiKeys,
  } = useAPIKeysQuery({ projectRef, reveal: false }, { enabled: canReadAPIKeys })

  const showApiKeysLastUsed = useFlag('showApiKeysLastUsed')
  const { data: lastSeen, isLoading: isLoadingLastSeen } = useLastSeen({
    projectRef: projectRef ?? '',
    enabled: showApiKeysLastUsed,
  })

  const secretApiKeys = useMemo(
    () =>
      apiKeysData?.filter(
        (key): key is Extract<APIKeysData[number], { type: 'secret' }> => key.type === 'secret'
      ) ?? [],
    [apiKeysData]
  )

  const empty = secretApiKeys?.length === 0 && !isLoadingApiKeys && !isLoadingPermissions

  // Track the ID being deleted to exclude it from error checking
  const deletingAPIKeyIdRef = useRef<string | null>(null)

  const { setValue: setAPIKeyToDelete, value: apiKeyToDelete } = useQueryStateWithSelect({
    urlKey: 'deleteSecretKey',
    select: (id: string) => (id ? secretApiKeys?.find((key) => key.id === id) : undefined),
    enabled: !!secretApiKeys?.length,
    onError: (_error, selectedId) =>
      handleErrorOnDelete(deletingAPIKeyIdRef, selectedId, `API Key not found`),
  })

  const { mutate: deleteAPIKey, isPending: isDeletingAPIKey } = useAPIKeyDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted secret key')
      setAPIKeyToDelete(null)
    },
    onError: () => {
      deletingAPIKeyIdRef.current = null
    },
  })

  const onDeleteAPIKey = (apiKey: Extract<APIKeysData[number], { type: 'secret' }>) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!apiKey.id) return console.error('API key ID is required')
    deletingAPIKeyIdRef.current = apiKey.id
    deleteAPIKey({ projectRef, id: apiKey.id })
  }

  return (
    <div className="pb-30">
      <FormHeader
        title="Secret keys"
        description="These API keys allow privileged access to your project's APIs. Use in servers, functions, workers or other backend components of your application."
        actions={<CreateSecretAPIKeyDialog />}
      />

      {!canReadAPIKeys && !isLoadingPermissions ? (
        <NoPermission resourceText="view API keys" />
      ) : isLoadingApiKeys || isLoadingPermissions ? (
        <GenericSkeletonLoader />
      ) : isErrorApiKeys ? (
        <AlertError error={error} subject="Failed to load secret API keys" />
      ) : empty ? (
        <Card>
          <div className="!rounded-b-md overflow-hidden py-12 flex flex-col gap-1 items-center justify-center">
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
                {showApiKeysLastUsed && (
                  <TableHead className="hidden lg:table-cell">Last Used</TableHead>
                )}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {secretApiKeys.map((apiKey) => (
                <APIKeyRow
                  key={apiKey.id}
                  apiKey={apiKey}
                  lastSeen={lastSeen?.[apiKey.hash]}
                  isLoadingLastSeen={isLoadingLastSeen}
                  isDeleting={apiKeyToDelete?.id === apiKey.id && isDeletingAPIKey}
                  onDelete={() => onDeleteAPIKey(apiKey)}
                  setKeyToDelete={setAPIKeyToDelete}
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
