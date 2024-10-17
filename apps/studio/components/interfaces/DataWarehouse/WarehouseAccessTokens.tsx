import { TooltipContent } from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { MoreVertical, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useIsProjectActive } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import CopyButton from 'components/ui/CopyButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { ProjectPausedAlert } from 'components/ui/ProjectPausedAlert'
import { useCreateWarehouseAccessToken } from 'data/analytics/warehouse-access-tokens-create-mutation'
import { useDeleteWarehouseAccessToken } from 'data/analytics/warehouse-access-tokens-delete-mutation'
import { useWarehouseAccessTokensQuery } from 'data/analytics/warehouse-access-tokens-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import CreateWarehouseAccessToken from './CreateWarehouseAccessToken'

const AccessTokenItem = ({
  token,
  id,
  description,
  onDeleteClick,
  inserted_at,
}: {
  token: string
  id: number
  description: string
  inserted_at: string
  onDeleteClick: (id: number) => void
}) => {
  const formattedInsertedAt = new Date(inserted_at).toLocaleString()
  const canDeleteAccessTokens = useCheckPermissions(PermissionAction.ANALYTICS_WRITE, 'logflare')

  return (
    <Table.tr className="group">
      <Table.td className="max-w-[240px]">{description}</Table.td>
      <Table.td>{formattedInsertedAt}</Table.td>
      <Table.td>
        <div className="flex gap-1 relative">
          <Input disabled defaultValue={token} type="password" size="tiny" className="flex-grow" />
          <div className="w-[88px]">
            <CopyButton
              type="outline"
              text={token}
              className="group-hover:opacity-100 opacity-0 transition-opacity absolute right-0"
            />
          </div>
        </div>
      </Table.td>
      <Table.td className="!p-1.5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 p-2 focus-visible:outline-none">
            <MoreVertical size="14" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-40" align="end">
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  disabled={!canDeleteAccessTokens}
                  className="flex gap-1.5 !pointer-events-auto"
                  onClick={(e) => {
                    if (canDeleteAccessTokens) {
                      e.preventDefault()
                      onDeleteClick(id)
                    }
                  }}
                >
                  <TrashIcon size="14" />
                  Revoke token
                </DropdownMenuItem>
              </TooltipTrigger_Shadcn_>
              {!canDeleteAccessTokens && (
                <TooltipContent side="left">
                  You need additional permissions to delete access tokens
                </TooltipContent>
              )}
            </Tooltip_Shadcn_>
          </DropdownMenuContent>
        </DropdownMenu>
      </Table.td>
    </Table.tr>
  )
}

export const WarehouseAccessTokens = () => {
  const isProjectActive = useIsProjectActive()
  const params = useParams()
  const projectRef = params.ref as string
  const [open, setOpen] = useState(false)

  const canReadAccessTokens = useCheckPermissions(PermissionAction.ANALYTICS_WRITE, 'logflare')
  const accessTokensQuery = useWarehouseAccessTokensQuery(
    { projectRef },
    { enabled: canReadAccessTokens }
  )
  const hasAccessTokens = accessTokensQuery.isSuccess && accessTokensQuery.data.data.length > 0

  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { mutate: deleteWarehouseAccessToken, isLoading: deleteLoading } =
    useDeleteWarehouseAccessToken({
      onSuccess: () => {
        toast.success('Access token revoked')
      },
      onError: () => {
        toast.error('Failed to revoke access token')
      },
    })

  const { mutate: createWarehouseAccessToken, isLoading: createLoading } =
    useCreateWarehouseAccessToken({
      onSuccess: () => {
        toast.success('Access token created')
        setOpen(false)
      },
    })

  const isLoading = deleteLoading || createLoading

  return (
    <section className="flex flex-col gap-y-10 py-6 pb-32">
      <FormHeader
        className="!mb-0"
        title="Access tokens"
        description="Manage your analytics access tokens for this project."
        actions={
          <CreateWarehouseAccessToken
            open={open}
            setOpen={setOpen}
            loading={createLoading}
            onSubmit={({ description }) => {
              createWarehouseAccessToken({
                ref: projectRef,
                description: description,
              })
            }}
          />
        }
      />

      {!canReadAccessTokens ? (
        <NoPermission resourceText="view analytics access tokens" />
      ) : (
        <div className={cn(['bg-surface-100', 'overflow-hidden', 'rounded-md shadow'])}>
          {!isProjectActive ? (
            <ProjectPausedAlert
              projectRef={projectRef}
              description="Restore your project to manage your analytics access tokens"
            />
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
                      <Table.th key="description">Description</Table.th>,
                      <Table.th key="created_at">Created at</Table.th>,
                      <Table.th key="token">Token</Table.th>,
                      <Table.th key="actions" />,
                    ]}
                    body={
                      hasAccessTokens ? (
                        accessTokensQuery.data.data.map((accessToken) => (
                          <AccessTokenItem
                            key={accessToken.id + '-wh-access-token'}
                            token={accessToken.token}
                            id={accessToken.id}
                            inserted_at={accessToken.inserted_at}
                            description={accessToken.description || 'No description'}
                            onDeleteClick={() => {
                              setShowDeleteDialog(true)
                              setTokenToDelete(accessToken.token)
                            }}
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
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke warehouse access token</DialogTitle>
            <DialogDescription>
              This action is irreversible and requests made with these access tokens will stop
              working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setTokenToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="danger"
              loading={isLoading}
              onClick={async () => {
                if (!tokenToDelete) return
                deleteWarehouseAccessToken({
                  projectRef,
                  token: tokenToDelete,
                })
                setShowDeleteDialog(false)
                setTokenToDelete(null)
              }}
            >
              Yes, revoke access token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default WarehouseAccessTokens
