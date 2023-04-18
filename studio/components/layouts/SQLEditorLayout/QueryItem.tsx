import { useState } from 'react'
import { useParams } from 'common'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { Dropdown, IconEdit2, IconTrash, Button, IconChevronDown, Modal } from 'ui'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import clsx from 'clsx'
import Link from 'next/link'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { useRouter } from 'next/router'
import { SqlSnippet } from 'data/content/sql-snippets-query'

export interface QueryItemProps {
  tabInfo: SqlSnippet
}

const QueryItem = ({ tabInfo }: QueryItemProps) => {
  const { ref, id: activeId } = useParams()
  const { id, name } = tabInfo || {}
  const isActive = id === activeId

  return (
    <div
      key={id}
      className={clsx(
        'flex items-center justify-between rounded-md group',
        isActive && 'text-scale-1200 bg-scale-300'
      )}
    >
      <Link href={`/project/${ref}/sql/${id}`}>
        <a className="py-1 px-3 w-full">
          <p
            title={name}
            className="text-sm text-scale-1100 group-hover:text-scale-1200 transition"
          >
            {name}
          </p>
        </a>
      </Link>
      <div className="pr-3">{isActive && <QueryItemActions tabInfo={tabInfo} />}</div>
    </div>
  )
}

export default QueryItem

const QueryItemActions = observer(({ tabInfo }: { tabInfo: SqlSnippet }) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const router = useRouter()
  const snap = useSqlEditorStateSnapshot()
  const { mutateAsync: deleteContent } = useContentDeleteMutation({
    onSuccess(data) {
      if (data.id) {
        snap.removeSnippet(data.id)
      }
    },
  })

  const { id, name } = tabInfo || {}
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const onCloseRenameModal = () => {
    setRenameModalOpen(false)
  }

  const onClickRename = (e: any) => {
    e.stopPropagation()
    setRenameModalOpen(true)
  }

  const onClickDelete = (e: any) => {
    e.stopPropagation()
    setDeleteModalOpen(true)
  }

  const onConfirmDelete = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!id) return console.error('Snippet ID is required')

    try {
      await deleteContent({ projectRef: ref, id })

      const existingSnippetIds = (snap.orders[ref] ?? []).filter((x) => x !== id)
      if (existingSnippetIds.length === 0) {
        router.push(`/project/${ref}/sql`)
      } else {
        router.push(`/project/${ref}/sql/${existingSnippetIds[0]}`)
      }
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create new query: ${error.message}`,
      })
    }
  }

  return (
    <div>
      {IS_PLATFORM ? (
        <Dropdown
          side="bottom"
          align="end"
          overlay={
            <>
              <Dropdown.Item onClick={onClickRename} icon={<IconEdit2 size="tiny" />}>
                Rename query
              </Dropdown.Item>
              <Dropdown.Separator />
              <Dropdown.Item onClick={onClickDelete} icon={<IconTrash size="tiny" />}>
                Delete query
              </Dropdown.Item>
            </>
          }
        >
          <Button
            as="span"
            type="text"
            icon={<IconChevronDown size="tiny" strokeWidth={2} className="text-scale-1100" />}
            style={{ padding: '3px' }}
          />
        </Dropdown>
      ) : (
        <Button as="span" type="text" style={{ padding: '3px' }} />
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
    </div>
  )
})
