import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button, IconChevronRight, IconPlay, IconTrash, Modal } from 'ui'
import Table from 'components/to-be-cleaned/Table'
import SqlSnippetCode from './Logs.SqlSnippetCode'
import { timestampLocalFormatter } from './LogsFormatters'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import toast from 'react-hot-toast'

interface SavedQueriesItemProps {
  item: any
}

const SavedQueriesItem = ({ item }: SavedQueriesItemProps) => {
  const [expand, setExpand] = useState<boolean>(false)
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)

  const { mutateAsync: deleteContent } = useContentDeleteMutation(item.id)

  const router = useRouter()
  const { ref } = router.query

  const onConfirmDelete = async () => {
    if (!ref || typeof ref !== 'string') {
      console.error('Invalid project reference')
      return
    }
    await deleteContent({ projectRef: ref, id: item.id })
    toast.success('Query deleted')
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
          <div>
            <Button
              type="text"
              icon={<IconTrash />}
              title="Delete"
              className="space-x-0 h-7"
              onClick={() => {
                setShowConfirmModal(true)
              }}
            >
              <span className="sr-only">Delete</span>
            </Button>
            <ConfirmationModal
              danger
              visible={showConfirmModal}
              buttonLabel="Delete query"
              header="Confirm to delete saved query"
              onSelectCancel={() => {
                setShowConfirmModal(false)
              }}
              onSelectConfirm={() => {
                setShowConfirmModal(false)
                onConfirmDelete()
              }}
            >
              <Modal.Content>
                <p className="py-4 text-sm text-foreground-light">
                  Are you sure you want to delete {item.name}?
                </p>
              </Modal.Content>
            </ConfirmationModal>
          </div>
          <Button
            type="alternative"
            iconRight={<IconPlay size={10} />}
            onClick={() =>
              router.push(`/project/${ref}/logs/explorer?q=${encodeURIComponent(item.content.sql)}`)
            }
          >
            Run
          </Button>
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
