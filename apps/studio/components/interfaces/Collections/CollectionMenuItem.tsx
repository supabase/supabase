import { useDeleteCollection } from 'data/collections/collections-delete-mutation'
import { useUpdateCollection } from 'data/collections/collections-update-mutation'
import { useSelectedProject } from 'hooks'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import toast from 'react-hot-toast'
import {
  Button,
  Checkbox_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconChevronDown,
  IconEdit2,
  IconTrash,
  Input,
  Label_Shadcn_,
  Modal,
  cn,
} from 'ui'

type Props = {
  item: {
    id: string
    name: string
    description: string
  }
}

const CollectionMenuItem = ({ item }: Props) => {
  const router = useRouter()
  const project = useSelectedProject()
  const projectRef = project?.ref || 'default'

  const [showUpdateDialog, setShowUpdateDialog] = React.useState(false)
  const [showDeleteDialog, setDeleteDialog] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const updateCollection = useUpdateCollection({ projectRef })
  const deleteCollection = useDeleteCollection({ projectRef })

  const isLoading = updateCollection.isLoading || deleteCollection.isLoading

  return (
    <>
      <Link
        className={cn(
          'pr-1 h-7 pl-3 mt-1 text-foreground-light group-hover:text-foreground/80 text-sm',
          'flex items-center justify-between rounded-md group relative',
          item.id === router.query.collectionId
            ? 'bg-surface-300 text-foreground'
            : 'hover:bg-surface-200'
        )}
        key={item.id + '-collection-item'}
        href={`/project/${projectRef}/logs/collections/${item.id}`}
      >
        <div>{item.name}</div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              loading={isLoading}
              type="text"
              className="px-1 opacity-50 hover:opacity-100 bg-transparent"
              icon={<IconChevronDown size="tiny" strokeWidth={2} />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 *:space-x-2">
            <DropdownMenuItem
              onClick={() => {
                setShowUpdateDialog(true)
              }}
            >
              <IconEdit2 size="tiny" />
              <div>Rename</div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                setDeleteDialog(true)
              }}
            >
              <IconTrash size="tiny" />
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
        <form
          id="update-collection-form"
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              console.log('update')
              const formData = new FormData(e.target as HTMLFormElement)

              const name = formData.get('name') as string
              const description = formData.get('description') as string

              await updateCollection.mutateAsync({
                name,
                description,
              })

              toast.success('Collection updated successfully')
              setShowUpdateDialog(false)
            } catch (error) {
              toast.error('Failed to update collection.')
              console.error(error)
            }
          }}
        >
          <Modal.Content className="space-y-6 py-6">
            <Input
              required
              layout="horizontal"
              label={`Collection name`}
              id="name"
              defaultValue={item.name}
            />
            <div className="text-area-text-sm">
              <Input.TextArea
                layout="horizontal"
                labelOptional="Optional"
                label="Description"
                id="description"
                rows={2}
                defaultValue={item.description}
              />
            </div>
          </Modal.Content>
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
      </Modal>
      <Modal
        visible={showDeleteDialog}
        onCancel={() => setDeleteDialog(false)}
        hideFooter
        header={`Remove collection "${item.name}"`}
        size="small"
      >
        <form
          id="delete-collection-form"
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              await deleteCollection.mutateAsync({ id: item.id })
              setDeleteDialog(false)
              toast.success('Collection deleted successfully')
            } catch (error) {
              toast.error('Failed to delete collection.')
              console.error(error)
            }
          }}
        >
          <div className="p-3 space-y-4">
            <p className="text-sm text-foreground-light">
              Are you sure you want to delete the selected collection?
              <br /> This action cannot be undone.
            </p>
            <div className="flex items-center my-2">
              <Checkbox_Shadcn_
                required
                checked={confirmDelete}
                onCheckedChange={() => setConfirmDelete(!confirmDelete)}
                id="confirm"
              />
              <Label_Shadcn_
                onClick={() => setConfirmDelete(!confirmDelete)}
                className="p-2"
                htmlFor="confirm"
              >
                Yes, I want to delete <span className="font-medium">{item.name}</span>.
              </Label_Shadcn_>
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
      </Modal>
    </>
  )
}

export default CollectionMenuItem
