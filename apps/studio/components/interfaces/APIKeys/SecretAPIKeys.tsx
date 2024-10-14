import { useParams } from 'common'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useMemo } from 'react'
import { Card, CardContent, Skeleton, WarningIcon, cn } from 'ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui/src/components/shadcn/ui/table'
import APIKeyRow from './APIKeyRowv2'
import CreateSecretAPIKeyModal from './CreateSecretAPIKeyModal'

const SecretAPIKeys = () => {
  const { ref: projectRef } = useParams()
  const { data: apiKeysData, isLoading, error } = useAPIKeysQuery({ projectRef })

  const secretApiKeys = useMemo(
    () => apiKeysData?.filter(({ type }) => type === 'secret') ?? [],
    [apiKeysData]
  )

  const empty = secretApiKeys?.length === 0 && !isLoading

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

  if (isLoading) {
    return (
      <TableContainer>
        <RowLoading />
        <RowLoading />
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

export default SecretAPIKeys
