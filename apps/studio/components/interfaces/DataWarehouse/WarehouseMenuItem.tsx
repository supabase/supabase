import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { EditIcon, MoreHorizontal, TrashIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'

import { FormMessage } from '@ui/components/shadcn/ui/form'
import { useParams } from 'common'
import { useDeleteCollectionMutation } from 'data/analytics/warehouse-collections-delete-mutation'
import { useUpdateCollection } from 'data/analytics/warehouse-collections-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  Checkbox_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormLabel_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Modal,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

type Props = {
  item: {
    id: number
    token: string
    name: string
  }
}

export const WarehouseMenuItem = ({ item }: Props) => {
  const router = useRouter()
  const { ref, collectionToken } = useParams()
  const projectRef = ref || 'default'

  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showDeleteDialog, setDeleteDialog] = useState(false)

  const canUpdateCollection = useCheckPermissions(PermissionAction.ANALYTICS_WRITE, 'logflare')

  const updateCollection = useUpdateCollection({
    onSuccess: () => {
      toast.success('Collection updated successfully')
      setShowUpdateDialog(false)
    },
  })
  const deleteCollection = useDeleteCollectionMutation({
    onSuccess: () => {
      // If the current collection is deleted, redirect to default logs view
      if (item.token === collectionToken) {
        router.push(`/project/${projectRef}/logs/explorer`)
      }
      setDeleteDialog(false)
      toast.success('Collection deleted successfully')
    },
  })

  const isLoading = updateCollection.isLoading || deleteCollection.isLoading

  const UpdateFormSchema = z.object({
    name: z.string().min(1, {
      message: 'Collection name is required',
    }),
  })

  const updateForm = useForm<z.infer<typeof UpdateFormSchema>>({
    resolver: zodResolver(UpdateFormSchema),
  })

  const deleteForm = useForm()

  return (
    <>
      <Link
        className={cn(
          'pr-1 h-7 pl-3 mt-1 text-foreground-light group-hover:text-foreground/80 text-sm',
          'flex items-center justify-between rounded-md group relative',
          item.token === router.query.collectionToken
            ? 'bg-surface-300 text-foreground'
            : 'hover:bg-surface-200'
        )}
        key={item.token + '-collection-item'}
        href={`/project/${projectRef}/logs/collections/${item.token}`}
      >
        <div>{item.name}</div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              loading={isLoading}
              type="text"
              className="px-1 opacity-50 hover:opacity-100 !bg-transparent"
              icon={<MoreHorizontal />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            onClick={(e) => {
              e.stopPropagation()
            }}
            align="start"
            className="w-44 *:space-x-2"
          >
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  disabled={!canUpdateCollection}
                  className="!pointer-events-auto"
                  onClick={() => {
                    if (canUpdateCollection) setShowUpdateDialog(true)
                  }}
                >
                  <EditIcon size={14} />
                  <div>Rename collection</div>
                </DropdownMenuItem>
              </TooltipTrigger_Shadcn_>
              {!canUpdateCollection && (
                <TooltipContent_Shadcn_ side="right">
                  You need additional permissions to rename collections
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
            <DropdownMenuSeparator />
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  disabled={!canUpdateCollection}
                  className="!pointer-events-auto"
                  onClick={async () => {
                    if (canUpdateCollection) setDeleteDialog(true)
                  }}
                >
                  <TrashIcon size={14} />
                  <div>Delete collection</div>
                </DropdownMenuItem>
              </TooltipTrigger_Shadcn_>
              {!canUpdateCollection && (
                <TooltipContent_Shadcn_ side="right">
                  You need additional permissions to delete collections
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
          </DropdownMenuContent>
        </DropdownMenu>
      </Link>

      <Modal
        size="medium"
        visible={showUpdateDialog}
        onCancel={() => setShowUpdateDialog(false)}
        hideFooter
        header={`Update collection "${item.name}"`}
      >
        <Form_Shadcn_ {...updateForm}>
          <form
            id="update-collection-form"
            onSubmit={updateForm.handleSubmit((data) =>
              updateCollection.mutate({
                projectRef,
                collectionToken: item.token,
                name: data.name,
              })
            )}
          >
            <Modal.Content className="space-y-6 py-6">
              <FormField_Shadcn_
                control={updateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout label="Collection name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ defaultValue={item.name} type="text" {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </Modal.Content>
            <FormMessage />
            <div className="flex gap-2 justify-end p-3 border-t">
              <Button
                disabled={isLoading}
                type="outline"
                onClick={() => {
                  setShowUpdateDialog(false)
                }}
                htmlType="reset"
              >
                Cancel
              </Button>
              <Button htmlType="submit" loading={isLoading}>
                Update collection
              </Button>
            </div>
          </form>
        </Form_Shadcn_>
      </Modal>
      <Modal
        visible={showDeleteDialog}
        onCancel={() => setDeleteDialog(false)}
        hideFooter
        header={`Remove collection "${item.name}"`}
        size="small"
      >
        <Form_Shadcn_ {...deleteForm}>
          <form
            id="delete-collection-form"
            onSubmit={deleteForm.handleSubmit(() => {
              deleteCollection.mutate({ projectRef, collectionToken: item.token })
            })}
          >
            <div className="p-3 px-6 space-y-4">
              <p className="text-sm text-foreground-light">
                Are you sure you want to delete the selected collection?
                <br /> This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 justify-end p-3 border-t">
              <Button
                disabled={isLoading}
                type="outline"
                onClick={() => {
                  setDeleteDialog(false)
                }}
                htmlType="reset"
              >
                Cancel
              </Button>
              <Button type="danger" htmlType="submit" loading={isLoading}>
                Yes, delete
              </Button>
            </div>
          </form>
        </Form_Shadcn_>
      </Modal>
    </>
  )
}
