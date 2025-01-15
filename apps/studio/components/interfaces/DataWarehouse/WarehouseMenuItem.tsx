import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Database, EditIcon, TrashIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useDeleteCollectionMutation } from 'data/analytics/warehouse-collections-delete-mutation'
import { useUpdateCollection } from 'data/analytics/warehouse-collections-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  Modal,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

import { LogsSidebarItem } from '../Settings/Logs/SidebarV2/SidebarItem'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { CollectionForm } from './CollectionForm'

type Props = {
  item: {
    id: number
    token: string
    name: string
    retention_days: number
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

  return (
    <>
      <LogsSidebarItem
        isActive={item.token === collectionToken}
        label={item.name}
        icon={<Database size="14" className="text-foreground-light" />}
        href={`/project/${projectRef}/logs/collections/${item.token}`}
        dropdownItems={
          <>
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  disabled={!canUpdateCollection}
                  onClick={(e) => {
                    e.preventDefault()
                    setShowUpdateDialog(true)
                  }}
                >
                  <EditIcon className="mr-2" size={14} />
                  <div>Update collection</div>
                </DropdownMenuItem>
              </TooltipTrigger_Shadcn_>
              {!canUpdateCollection && (
                <TooltipContent_Shadcn_ side="right">
                  You need additional permissions to update collections
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
            <DropdownMenuSeparator />
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  disabled={!canUpdateCollection}
                  onClick={(e) => {
                    e.preventDefault()
                    setDeleteDialog(true)
                  }}
                >
                  <TrashIcon className="mr-2" size={14} />
                  <div>Delete collection</div>
                </DropdownMenuItem>
              </TooltipTrigger_Shadcn_>
              {!canUpdateCollection && (
                <TooltipContent_Shadcn_ side="right">
                  You need additional permissions to delete collections
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
          </>
        }
      ></LogsSidebarItem>

      <Modal
        size="medium"
        visible={showUpdateDialog}
        onCancel={() => setShowUpdateDialog(false)}
        hideFooter
        header={`Update collection "${item.name}"`}
      >
        <CollectionForm
          onCancelClick={() => setShowUpdateDialog(false)}
          isLoading={isLoading}
          initialValues={{ name: item.name, retention_days: item.retention_days }}
          onSubmit={({ name, retention_days }) => {
            updateCollection.mutate({
              projectRef,
              collectionToken: item.token,
              name,
              retention_days,
            })
          }}
        />
      </Modal>
      <ConfirmationModal
        variant="destructive"
        visible={showDeleteDialog}
        onCancel={() => setDeleteDialog(false)}
        confirmLabel="Delete collection"
        title={`Delete collection "${item.name}"`}
        size="small"
        onConfirm={() => {
          deleteCollection.mutate({ projectRef, collectionToken: item.token })
        }}
      >
        <p className="text-sm text-foreground-light">
          All data in this collection will be deleted.
          <br />
          <div className="mt-2">This action cannot be undone.</div>
        </p>
      </ConfirmationModal>
    </>
  )
}
