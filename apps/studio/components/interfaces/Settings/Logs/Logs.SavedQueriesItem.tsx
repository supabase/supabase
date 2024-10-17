import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { DropdownMenuItem, DropdownMenuSeparator } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { UpdateSavedQueryModal } from './Logs.UpdateSavedQueryModal'
import { Edit, Trash } from 'lucide-react'
import { SqlEditor } from 'icons'
import { LogsSidebarItem } from './SidebarV2/SidebarItem'

interface SavedQueriesItemProps {
  item: {
    id: string
    name: string
    description?: string
    content: {
      sql: string
    }
  }
}

const SavedQueriesItem = ({ item }: SavedQueriesItemProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false)

  const { mutate: deleteContent } = useContentDeleteMutation({
    onSuccess: () => {
      setShowConfirmModal(false)
      toast.success('Successfully deleted query')
    },
    onError: (error) => {
      toast.error(`Failed to delete saved query: ${error.message}`)
    },
  })
  const { mutate: updateContent } = useContentUpsertMutation({
    onSuccess: () => {
      setShowUpdateModal(false)
      toast.success('Successfully updated query')
    },
    onError: (error) => {
      toast.error(`Failed to update query: ${error.message}`)
    },
  })

  const onConfirmDelete = async () => {
    if (!ref || typeof ref !== 'string') return console.error('Invalid project reference')
    deleteContent({ projectRef: ref, ids: [item.id] })
  }

  const onConfirmUpdate = async ({ name, description }: { name: string; description?: string }) => {
    if (!ref || typeof ref !== 'string') return console.error('Invalid project reference')
    updateContent({
      projectRef: ref,
      payload: {
        ...item,
        name,
        description: description || undefined,
        type: 'log_sql',
        visibility: 'user',
      },
    })
  }

  const isActive = router.query.queryId === item.id

  return (
    <>
      <LogsSidebarItem
        label={item.name}
        icon={<SqlEditor size="15" />}
        href={`/project/${ref}/logs/explorer?queryId=${encodeURIComponent(item.id)}&q=${encodeURIComponent(item.content.sql)}`}
        isActive={isActive}
        dropdownItems={
          <>
            <DropdownMenuItem onClick={() => setShowUpdateModal(true)}>
              <Edit size={14} className="mr-2" />
              Edit query
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setShowConfirmModal(true)
              }}
            >
              <Trash size={14} className="mr-2" />
              Delete query
            </DropdownMenuItem>
          </>
        }
      ></LogsSidebarItem>
      <ConfirmationModal
        variant="destructive"
        visible={showConfirmModal}
        confirmLabel="Delete query"
        title="Confirm to delete saved query"
        onCancel={() => {
          setShowConfirmModal(false)
        }}
        onConfirm={onConfirmDelete}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete {item.name}?
        </p>
      </ConfirmationModal>
      <UpdateSavedQueryModal
        visible={showUpdateModal}
        initialValues={{ name: item.name, description: item.description }}
        onCancel={() => {
          setShowUpdateModal(false)
        }}
        onSubmit={(newValues) => {
          onConfirmUpdate(newValues)
        }}
      />
    </>
  )
}

export default SavedQueriesItem
