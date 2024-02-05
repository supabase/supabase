import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'

import Table from 'components/to-be-cleaned/Table'
import ConfirmationModal from 'components/ui/ConfirmationModal'
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
  Modal,
} from 'ui'
import SqlSnippetCode from './Logs.SqlSnippetCode'
import { UpdateSavedQueryModal } from './Logs.UpdateSavedQueryModal'
import { timestampLocalFormatter } from './LogsFormatters'

interface SavedQueriesItemProps {
  item: any
}

const SavedQueriesItem = ({ item }: SavedQueriesItemProps) => {
  const [expand, setExpand] = useState<boolean>(false)
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false)

  const { mutateAsync: deleteContent } = useContentDeleteMutation()
  const { mutateAsync: updateContent } = useContentUpsertMutation()

  const router = useRouter()
  const { ref } = router.query

  const onConfirmDelete = async () => {
    try {
      if (!ref || typeof ref !== 'string') {
        console.error('Invalid project reference')
        return
      }
      await deleteContent({ projectRef: ref, id: item.id })
      setShowConfirmModal(false)
      toast.success('Query deleted')
    } catch (error) {
      toast.error(`Failed to delete saved query. Check the console for more details.`)
      console.error('Failed to delete saved query', error)
    }
  }

  const onConfirmUpdate = async ({
    name,
    description,
  }: {
    name: string
    description: string | null
  }) => {
    if (!ref || typeof ref !== 'string') {
      console.error('Invalid project reference')
      return
    }
    await updateContent({ projectRef: ref, payload: { ...item, name, description } })
    setShowUpdateModal(false)
    toast.success('Query updated')
  }

  return (
    <>
      <Table.tr
        key={item.id}
        className="expandable-tr [&>*]:flex [&>*]:items-center [&>*]:text-ellipsis [&>*]:overflow-hidden"
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
              danger
              visible={showConfirmModal}
              buttonLabel="Delete query"
              header="Confirm to delete saved query"
              onSelectCancel={() => {
                setShowConfirmModal(false)
              }}
              onSelectConfirm={onConfirmDelete}
            >
              <Modal.Content>
                <p className="py-4 text-sm text-foreground-light">
                  Are you sure you want to delete {item.name}?
                </p>
              </Modal.Content>
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
