import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { ReactNode, useMemo, useRef } from 'react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { APIKeysData, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Card, CardContent, EyeOffIcon, Skeleton, cn } from 'ui'
import {
  Table,
  TableBody,
  TableCell,
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

  const RowLoading = () => (
    <TableRow>
      <TableCell>
        <Skeleton className="max-w-12 h-4 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="max-w-60 h-4 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="max-w-60 h-4 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="w-2 h-4 rounded-full" />
      </TableCell>
    </TableRow>
  )

  const TableContainer = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className="pb-30">
      <FormHeader
        title="Secret keys"
        description="These API keys allow privileged access to your project's APIs. Use in servers, functions, workers or other backend components of your application."
        actions={<CreateSecretAPIKeyDialog />}
      />
      <Card className={cn('w-full overflow-hidden', !empty && 'bg-surface-100', className)}>
        <CardContent className="p-0">
          <Table className="p-5 table-auto">
            <TableHeader>
              <TableRow className={cn('bg-200', empty && 'hidden')}>
                <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                  Name
                </TableHead>
                <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 pr-0">
                  API Key
                </TableHead>

                <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 hidden lg:table-cell">
                  Last Seen
                </TableHead>
                <TableHead className="text-right font-mono uppercase text-xs text-foreground-lighter h-auto py-2" />
              </TableRow>
            </TableHeader>
            <TableBody className="">{children}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  if (isLoadingApiKeys || isLoadingPermissions) {
    return (
      <TableContainer>
        <RowLoading />
        <RowLoading />
      </TableContainer>
    )
  }

  if (!canReadAPIKeys) {
    return (
      <TableContainer>
        <div className="!rounded-b-md overflow-hidden py-12 flex flex-col gap-1 items-center justify-center">
          <EyeOffIcon />
          <p className="text-sm text-foreground">
            You do not have permission to read API Secret Keys
          </p>
          <p className="text-foreground-light">
            Contact your organization owner/admin to request access.
          </p>
        </div>
      </TableContainer>
    )
  }

  if (isErrorApiKeys) {
    return (
      <TableContainer className="border-0">
        <AlertError error={error} subject="Failed to load secret API keys" />
      </TableContainer>
    )
  }

  if (empty) {
    return (
      <TableContainer>
        <div className="!rounded-b-md overflow-hidden py-12 flex flex-col gap-1 items-center justify-center">
          <p className="text-sm text-foreground">No secret API keys found</p>
          <p className="text-sm text-foreground-light">
            Your project is not accessible via secret keys—there are no active secret keys created.
          </p>
        </div>
      </TableContainer>
    )
  }

  return (
    <TableContainer>
      {secretApiKeys.map((apiKey) => (
        <APIKeyRow key={apiKey.id} apiKey={apiKey} lastSeen={lastSeen[apiKey.hash]} />
      ))}
    </TableContainer>
  )
}
