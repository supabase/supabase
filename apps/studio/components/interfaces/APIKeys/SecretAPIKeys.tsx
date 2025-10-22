import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { useMemo, useRef } from 'react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { APIKeysData, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Card, EyeOffIcon } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui/src/components/shadcn/ui/table'
import { APIKeyRow } from './APIKeyRow'
import CreateSecretAPIKeyDialog from './CreateSecretAPIKeyDialog'

interface LastSeenData {
  [hash: string]: { timestamp: string }
}

function useLastSeen(projectRef: string): LastSeenData {
  const now = useRef(new Date()).current

  const query = useLogsQuery(projectRef, {
    iso_timestamp_start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    iso_timestamp_end: now.toISOString(),
    sql: "-- last-used-secret-api-keys\nSELECT unix_millis(max(timestamp)) as timestamp, apikey.`hash` FROM edge_logs cross join unnest(metadata) as m cross join unnest(m.request) as request cross join unnest(request.sb) as sb cross join unnest(sb.apikey) as sbapikey cross join unnest(sbapikey.apikey) as apikey WHERE apikey.error is null and apikey.`hash` is not null and apikey.prefix like 'sb_secret_%' GROUP BY apikey.`hash`",
  })

  return useMemo(() => {
    if (query.isLoading || !query.logData) {
      return {}
    }

    const now = dayjs()

    return (query.logData as unknown as { timestamp: number; hash: string }[]).reduce((a, i) => {
      a[i.hash] = {
        timestamp: `${dayjs.duration(now.diff(dayjs(i.timestamp))).humanize(false)} ago`,
      }
      return a
    }, {} as LastSeenData)
  }, [query])
}

export const SecretAPIKeys = () => {
  const { ref: projectRef } = useParams()
  const {
    data: apiKeysData,
    error,
    isLoading: isLoadingApiKeys,
    isError: isErrorApiKeys,
  } = useAPIKeysQuery({ projectRef, reveal: false })

  const { can: canReadAPIKeys, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    '*'
  )

  const lastSeen = useLastSeen(projectRef!)

  const secretApiKeys = useMemo(
    () =>
      apiKeysData?.filter(
        (key): key is Extract<APIKeysData[number], { type: 'secret' }> => key.type === 'secret'
      ) ?? [],
    [apiKeysData]
  )

  const empty = secretApiKeys?.length === 0 && !isLoadingApiKeys && !isLoadingPermissions

  return (
    <div className="pb-30">
      <FormHeader
        title="Secret keys"
        description="These API keys allow privileged access to your project's APIs. Use in servers, functions, workers or other backend components of your application."
        actions={<CreateSecretAPIKeyDialog />}
      />

      {isLoadingApiKeys || isLoadingPermissions ? (
        <GenericSkeletonLoader />
      ) : !canReadAPIKeys ? (
        <Card>
          <div className="!rounded-b-md overflow-hidden py-12 flex flex-col gap-1 items-center justify-center">
            <EyeOffIcon />
            <p className="text-sm text-foreground">
              You do not have permission to read API Secret Keys
            </p>
            <p className="text-foreground-light">
              Contact your organization owner/admin to request access.
            </p>
          </div>
        </Card>
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
                <TableHead className="hidden lg:table-cell">Last Seen</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {secretApiKeys.map((apiKey) => (
                <APIKeyRow key={apiKey.id} apiKey={apiKey} lastSeen={lastSeen[apiKey.hash]} />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
