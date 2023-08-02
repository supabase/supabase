import clsx from 'clsx'
import { useParams } from 'common'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { Button, Dropdown, IconChevronDown, IconEdit2, IconTrash, Modal } from 'ui'

export interface QueryItemProps {
  tabInfo: SqlSnippet
}

const QueryItem = ({ tabInfo }: QueryItemProps) => {
  const { ref, id: activeId } = useParams()
  const { id, name, description } = tabInfo || {}
  const isActive = id === activeId
  const activeItemRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // scroll to active item
    if (isActive && activeItemRef.current) {
      // race condition hack
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 0)
    }
  })

  return (
    <div
      key={id}
      className={clsx(
        'flex items-center justify-between rounded-md group',
        isActive && 'text-scale-1200 bg-scale-400 dark:bg-scale-600 -active'
      )}
      ref={isActive ? (activeItemRef as React.RefObject<HTMLDivElement>) : null}
    >
      <Link href={`/project/${ref}/sql/${id}`}>
        <a className="py-1 px-3 w-full">
          <p
            title={description || name}
            className="text-sm text-scale-1100 group-hover:text-scale-1200 transition"
          >
            {name}
          </p>
        </a>
      </Link>
      <div className="pr-3">{<QueryItemActions tabInfo={tabInfo} activeId={activeId} />}</div>
    </div>
  )
}

export default QueryItem

interface QueryItemActionsProps {
  tabInfo: SqlSnippet
  activeId: string | undefined
}

const QueryItemActions = observer(({ tabInfo, activeId }: QueryItemActionsProps) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const router = useRouter()
  const snap = useSqlEditorStateSnapshot()
  const { mutate: deleteContent } = useContentDeleteMutation({
    onSuccess(data) {
      if (data.id) snap.removeSnippet(data.id)

      const existingSnippetIds = (snap.orders[ref!] ?? []).filter((x) => x !== id)
      if (existingSnippetIds.length === 0) {
        router.push(`/project/${ref}/sql`)
      } else {
        router.push(`/project/${ref}/sql/${existingSnippetIds[0]}`)
      }
    },
    onError(error) {
      ui.setNotification({ category: 'error', message: `Failed to delete query: ${error.message}` })
    },
  })

  const { id, name, visibility } = tabInfo || {}
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const isActive = id === activeId

  const onCloseRenameModal = () => {
    setRenameModalOpen(false)
  }

  const onClickRename = (e: any) => {
    e.stopPropagation()
    setRenameModalOpen(true)
  }

  const onClickShare = (e: any) => {
    e.stopPropagation()
    setShareModalOpen(true)
  }

  const onClickDelete = (e: any) => {
    e.stopPropagation()
    setDeleteModalOpen(true)
  }

  const onConfirmShare = async () => {
    if (id) {
      try {
        snap.shareSnippet(id, 'project')
        return Promise.resolve()
      } catch (error: any) {
        ui.setNotification({
          error,
          category: 'error',
          message: `Failed to share query: ${error.message}`,
        })
      }
    }
  }

  const onConfirmDelete = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!id) return console.error('Snippet ID is required')
    deleteContent({ projectRef: ref, id })
  }

  return (
    <div className="group [div&>button[data-state='open']>span]:text-scale-900">
      {IS_PLATFORM ? (
        <Dropdown
          side="bottom"
          align="end"
          overlay={
            <>
              <Dropdown.Item onClick={onClickRename} icon={<IconEdit2 size="tiny" />}>
                Rename query
              </Dropdown.Item>
              {visibility === 'user' && (
                <Dropdown.Item onClick={onClickShare} icon={<IconEdit2 size="tiny" />}>
                  Share query with project
                </Dropdown.Item>
              )}
              <>
                <Dropdown.Separator />
                <Dropdown.Item onClick={onClickDelete} icon={<IconTrash size="tiny" />}>
                  Delete query
                </Dropdown.Item>
              </>
            </>
          }
        >
          <span
            className={clsx(
              'p-0.5 rounded-md',
              isActive
                ? 'text-scale-1100 hover:bg-scale-800'
                : 'text-scale-300 dark:text-scale-200 hover:bg-scale-500 group-hover:text-scale-1100'
            )}
          >
            <IconChevronDown size="tiny" strokeWidth={2} />
          </span>
        </Dropdown>
      ) : (
        <Button asChild disabled type="text" style={{ padding: '3px' }}>
          <span></span>
        </Button>
      )}
      <RenameQueryModal
        snippet={tabInfo}
        visible={renameModalOpen}
        onCancel={onCloseRenameModal}
        onComplete={onCloseRenameModal}
      />
      <ConfirmationModal
        header="Confirm to delete"
        buttonLabel="Delete query"
        buttonLoadingLabel="Deleting query"
        visible={deleteModalOpen}
        onSelectConfirm={onConfirmDelete}
        onSelectCancel={() => setDeleteModalOpen(false)}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-scale-1100">{`Are you sure you want to delete '${name}' ?`}</p>
        </Modal.Content>
      </ConfirmationModal>
      <ConfirmationModal
        header="Confirm to share"
        buttonLabel="Share query"
        buttonLoadingLabel="Sharing query"
        visible={shareModalOpen}
        onSelectConfirm={onConfirmShare}
        onSelectCancel={() => setShareModalOpen(false)}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-scale-1100">{`Are you sure you want to share '${name}' with the project ?`}</p>
        </Modal.Content>
      </ConfirmationModal>
    </div>
  )
})
