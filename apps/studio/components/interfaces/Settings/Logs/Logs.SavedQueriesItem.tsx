import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronRight,
  IconEdit,
  IconMoreVertical,
  IconPlay,
  IconTrash,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import SqlSnippetCode from './Logs.SqlSnippetCode'
import { UpdateSavedQueryModal } from './Logs.UpdateSavedQueryModal'
import { timestampLocalFormatter } from './LogsFormatters'

interface SavedQueriesItemProps {
  item: any
}

const SavedQueriesItem = ({ item }: SavedQueriesItemProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const [expand, setExpand] = useState<boolean>(false)
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

  const onConfirmUpdate = async ({
    name,
    description,
  }: {
    name: string
    description: string | null
  }) => {
    if (!ref || typeof ref !== 'string') return console.error('Invalid project reference')
    updateContent({ projectRef: ref, payload: { ...item, name, description } })
  }

  return (
    <>
      <Table.tr
        key={item.id}
        className="expandable-tr [&>*]:flex [&>*]:items-center [&>*]:truncate [&>*]:overflow-hidden"
      >
        <Table.td className="whitespace-nowrap">
          <div className="flex items-center gap-2">
            <button onClick={() => setExpand(!expand)} className="flex items-center gap-2">
              <div className={'transition ' + (expand ? 'rotate-90' : 'rotate-0')}>
                <IconChevronRight strokeWidth={2} size={14} />
              </div>
              <span className="text-sm text-foreground">{item.name}</span>
            </button>
          </div>
        </Table.td>
        <Table.td>
          <span className="text-foreground-light">{item.description}</span>
        </Table.td>
        <Table.td>
          <span className="text-foreground-light">{timestampLocalFormatter(item.inserted_at)}</span>
        </Table.td>
        <Table.td>
          <span className="text-foreground-light">{timestampLocalFormatter(item.updated_at)}</span>
        </Table.td>
        <Table.td className="flex items-center gap-2 justify-end">
          <Button
            type="alternative"
            iconRight={<IconPlay size={10} />}
            onClick={() =>
              router.push(`/project/${ref}/logs/explorer?q=${encodeURIComponent(item.content.sql)}`)
            }
          >
            Run
          </Button>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  type="text"
                  title="Actions"
                  className="space-x-0 h-7 px-1.5"
                  icon={<IconMoreVertical />}
                >
                  <div className="sr-only">Actions</div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-w-[144px]">
                <DropdownMenuItem onClick={() => setShowUpdateModal(true)}>
                  <IconEdit size={10} className="mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setShowConfirmModal(true)
                  }}
                >
                  <IconTrash size={10} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          </div>
        </Table.td>
      </Table.tr>
      <Table.td
        className={`${
          expand ? ' h-auto opacity-100' : 'h-0 opacity-0'
        } expanded-row-content border-l border-r bg-alternative !pt-0 !pb-0 transition-all`}
        colSpan={5}
      >
        {expand && <SqlSnippetCode>{item.content.sql}</SqlSnippetCode>}
      </Table.td>
    </>
  )
}

export default SavedQueriesItem
