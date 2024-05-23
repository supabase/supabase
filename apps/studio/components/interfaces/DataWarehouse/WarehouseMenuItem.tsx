import { EllipsisHorizontalIcon } from '@heroicons/react/16/solid'
import { useParams } from 'common'
import { useDeleteCollectionMutation, useUpdateCollection } from 'data/analytics'
import { EditIcon, TrashIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'
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
  cn,
} from 'ui'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormMessage } from '@ui/components/shadcn/ui/form'
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

  const DeleteFormSchema = z.object({
    confirm: z.boolean(),
  })

  const deleteForm = useForm<z.infer<typeof DeleteFormSchema>>({
    resolver: zodResolver(DeleteFormSchema),
  })

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
              icon={<EllipsisHorizontalIcon />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            onClick={(e) => {
              e.stopPropagation()
            }}
            align="start"
            className="w-52 *:space-x-2"
          >
            <DropdownMenuItem
              onClick={() => {
                setShowUpdateDialog(true)
              }}
            >
              <EditIcon size="14" />
              <div>Rename</div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                setDeleteDialog(true)
              }}
            >
              <TrashIcon size="14" />
              <div>Delete</div>
            </DropdownMenuItem>
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
                      <Input_Shadcn_ type="text" {...field} />
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
            <div className="p-3 space-y-4">
              <p className="text-sm text-foreground-light">
                Are you sure you want to delete the selected collection?
                <br /> This action cannot be undone.
              </p>
              <div className="flex items-center my-2">
                <FormField_Shadcn_
                  control={deleteForm.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItemLayout>
                      <FormControl_Shadcn_>
                        <Checkbox_Shadcn_ checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl_Shadcn_>
                      <FormLabel_Shadcn_ className="p-2">
                        Yes, I want to delete <span className="font-medium">{item.name}</span>.
                      </FormLabel_Shadcn_>
                      <FormMessage />
                    </FormItemLayout>
                  )}
                />
              </div>
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
              <Button type="primary" htmlType="submit" loading={isLoading}>
                Delete
              </Button>
            </div>
          </form>
        </Form_Shadcn_>
      </Modal>
    </>
  )
}
