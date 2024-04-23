import React from 'react'
import CreateWarehouseAccessToken from './CreateWarehouseAccessToken'
import { FormHeader } from 'components/ui/Forms'
import { useIsProjectActive } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  AlertDescription_Shadcn_,
  Alert_Shadcn_,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from 'ui'
import { AlertCircle, Link, MoreVertical, TrashIcon } from 'lucide-react'
import { AlertTitle } from '@ui/components/shadcn/ui/alert'
import { useParams } from 'common'
import { useWarehouseAccessTokensQuery } from 'data/analytics/warehouse-access-tokens-query'
import { GenericSkeletonLoader } from 'ui-patterns'
import Table from 'components/to-be-cleaned/Table'
import { useCreateWarehouseAccessToken } from 'data/analytics/warehouse-access-tokens-create-mutation'
import toast from 'react-hot-toast'
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid'

const AccessTokenItem = ({
  token,
  id,
  name,
  onDeleteClick,
}: {
  token: string
  id: string
  name: string
  onDeleteClick: (id: string) => void
}) => {
  return (
    <Table.tr>
      <Table.td>{name}</Table.td>
      <Table.td>{token}</Table.td>
      <Table.td className="!p-1.5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 p-2 focus-visible:outline-none">
            <MoreVertical size="14" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-40">
            <DropdownMenuItem
              className="flex gap-1.5 "
              onClick={(e) => {
                e.preventDefault()
                onDeleteClick(id)
              }}
            >
              <TrashIcon size="14" />
              Revoke token
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Table.td>
    </Table.tr>
  )
}
const ProjectPausedAlert = ({
  title = 'Project is paused',
  description = 'Restore this project to continue',
}: {
  title?: string
  description?: string
}) => {
  const params = useParams()
  const projectRef = params.ref as string

  return (
    <Alert_Shadcn_ variant="warning">
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription_Shadcn_>{description}</AlertDescription_Shadcn_>
      {projectRef && (
        <div className="mt-3 flex items-center space-x-2">
          <Button asChild type="default">
            <Link href={`/project/${projectRef}`}>Restore project</Link>
          </Button>
        </div>
      )}
    </Alert_Shadcn_>
  )
}

const WarehouseAccessTokens = () => {
  const isProjectActive = useIsProjectActive()
  const params = useParams()
  const projectRef = params.ref as string

  const accessTokensQuery = useWarehouseAccessTokensQuery({ projectRef })
  const hasAccessTokens = accessTokensQuery.isSuccess && accessTokensQuery.data.data.length > 0

  const createWarehouseAccessToken = useCreateWarehouseAccessToken({
    projectRef,
    onSuccess: () => {
      toast.success('Access token created')
    },
  })

  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-y-10 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32 pb-32">
      <section>
        <FormHeader
          title="Warehouse access tokens"
          description="Manage your warehouse access tokens for this project."
          actions={
            <CreateWarehouseAccessToken
              onSubmit={async ({ description }) => {
                await createWarehouseAccessToken.mutateAsync({ name: description })
              }}
            />
          }
        />
        <div
          className={cn([
            'bg-surface-100',
            'overflow-hidden border-muted',
            'rounded-md border shadow',
          ])}
        >
          {!isProjectActive ? (
            <ProjectPausedAlert title={''} />
          ) : (
            <>
              {accessTokensQuery.isLoading ? (
                <div className="p-4">
                  <GenericSkeletonLoader />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table
                    head={[
                      <Table.th key="desc">Description</Table.th>,
                      <Table.th key="token">Token</Table.th>,
                      <Table.th key="actions" />,
                    ]}
                    body={
                      hasAccessTokens ? (
                        accessTokensQuery.data.data.map((accessToken) => (
                          <AccessTokenItem
                            key={accessToken.id}
                            token={accessToken.token}
                            id={accessToken.id}
                            name={accessToken.description || 'No description'}
                            onDeleteClick={() => {}}
                          />
                        ))
                      ) : (
                        <Table.tr>
                          <Table.td colSpan={4}>
                            <p className="text-sm text-foreground">No access tokens created</p>
                            <p className="text-sm text-foreground-light">
                              There are no access tokens associated with your project yet
                            </p>
                          </Table.td>
                        </Table.tr>
                      )
                    }
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default WarehouseAccessTokens
