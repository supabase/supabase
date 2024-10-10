import { useMemo, useState } from 'react'

import { useParams } from 'common'
import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  AlertDescription_Shadcn_,
  Alert_Shadcn_,
  Button,
  Card,
  CardContent,
  Skeleton,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

// import Table from 'components/to-be-cleaned/Table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui/src/components/shadcn/ui/table'

import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import Panel from 'components/ui/Panel'

import CreateSecretAPIKeyModal from './CreateSecretAPIKeyModal'
import APIKeyRow from './APIKeyRowv2'

import { useAPIKeysQuery, APIKeysData } from 'data/api-keys/api-keys-query'

const SecretAPIKeys = () => {
  const { ref: projectRef } = useParams()
  // const isProjectActive = useIsProjectActive()
  // const { project, isLoading: projectIsLoading } = useProjectContext()

  // const { data: projectAPI } = useProjectApiQuery({ projectRef: projectRef })

  const { data: apiKeysData, isLoading } = useAPIKeysQuery({ projectRef })

  const secretApiKeys = useMemo(
    () => apiKeysData?.filter(({ type }) => type === 'secret') ?? [],
    [apiKeysData]
  )

  const emptyState = secretApiKeys?.length === 0 && !isLoading

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

  return (
    <div>
      <FormHeader
        title="Secret keys"
        description="These API keys allow privileged access to your project's APIs. Use in servers, functions, workers or other backend components of your application. Keep secret and never publish."
        actions={<CreateSecretAPIKeyModal projectRef={projectRef} />}
      />
      <Card className={cn('w-full overflow-hidden', !emptyState && 'bg-surface-100')}>
        <CardContent className="p-0">
          <Table className="p-5">
            <TableHeader>
              <TableRow className={cn('bg-200', emptyState && 'hidden')}>
                <TableHead
                  key=""
                  className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 overflow-hidden"
                >
                  Name
                </TableHead>
                <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 pr-0">
                  API Key
                </TableHead>
                {/* <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 pl-0">
            Postgres Role for RLS
          </TableHead> */}
                <TableHead
                  className="text-right font-mono uppercase text-xs text-foreground-lighter h-auto py-2"
                  key="actions"
                />
              </TableRow>
            </TableHeader>
            <TableBody className="">
              {emptyState ? (
                <div className="!rounded-b-md overflow-hidden py-12 flex flex-col gap-1 items-center justify-center">
                  <p className="text-sm text-foreground">No secret API keys exist</p>
                  <p className="text-sm text-foreground-light">
                    Your project can't be accessed using secret API keys.
                  </p>
                </div>
              ) : isLoading ? (
                <>
                  <RowLoading />
                  <RowLoading />
                </>
              ) : (
                secretApiKeys.map((apiKey) => <APIKeyRow key={apiKey.id} apiKey={apiKey} />)
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* <CreateSecretAPIKeyModal /> */}
      {/* {secretApiKeys.map((apiKey) => (
        <APIKeyRow key={apiKey.id} apiKey={apiKey} />
      ))} */}
    </div>
  )
}

export default SecretAPIKeys
