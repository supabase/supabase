import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useMemo } from 'react'

import { useParams } from 'common'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { APIKeysData, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { Card, CardContent, EyeOffIcon, Skeleton, WarningIcon, cn } from 'ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui/src/components/shadcn/ui/table'
import { APIKeyRow } from './APIKeyRow'
import CreateSecretAPIKeyModal from './CreateSecretAPIKeyModal'

export const SecretAPIKeys = () => {
  const { ref: projectRef } = useParams()
  const {
    data: apiKeysData,
    isLoading: isLoadingApiKeys,
    error,
  } = useAPIKeysQuery({ projectRef, reveal: false })

  const isLoadingPermissions = !usePermissionsLoaded()
  const canReadAPIKeys = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, '*')

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
        <Skeleton className="w-2 h-4 rounded-full" />
      </TableCell>
    </TableRow>
  )

  const TableContainer = ({ children }: { children: React.ReactNode }) => (
    <div>
      <FormHeader
        title="Secret keys"
        description="These API keys allow privileged access to your project's APIs. Use in servers, functions, workers or other backend components of your application. Keep secret and never publish."
        actions={<CreateSecretAPIKeyModal />}
      />
      <Card className={cn('w-full overflow-hidden', !empty && 'bg-surface-100')}>
        <CardContent className="p-0">
          <Table className="p-5">
            <TableHeader>
              <TableRow className={cn('bg-200', empty && 'hidden')}>
                <TableHead
                  key=""
                  className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 overflow-hidden"
                >
                  Name
                </TableHead>
                <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 pr-0">
                  API Key
                </TableHead>
                <TableHead
                  className="text-right font-mono uppercase text-xs text-foreground-lighter h-auto py-2"
                  key="actions"
                />
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

  if (error) {
    return (
      <TableContainer>
        <div className="!rounded-b-md overflow-hidden py-12 flex flex-col gap-1 items-center justify-center">
          <WarningIcon />
          <p className="text-sm text-warning-600">Error loading Secret API Keys</p>
          <p className="text-warning/75">{error.message}</p>
        </div>
      </TableContainer>
    )
  }

  if (empty) {
    return (
      <TableContainer>
        <div className="!rounded-b-md overflow-hidden py-12 flex flex-col gap-1 items-center justify-center">
          <p className="text-sm text-foreground">No secret API keys exist</p>
          <p className="text-sm text-foreground-light">
            Your project can't be accessed using secret API keys.
          </p>
        </div>
      </TableContainer>
    )
  }

  return (
    <TableContainer>
      {secretApiKeys.map((apiKey) => (
        <APIKeyRow key={apiKey.id} apiKey={apiKey} />
      ))}
    </TableContainer>
  )
}
