import { useState } from 'react'
import { useParams } from 'common'
import QueryTab from 'localStores/sqlEditor/QueryTab'
import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { Dropdown, IconEdit2, IconTrash, Button, IconChevronDown, Modal } from 'ui'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'

export interface QueryItemProps {
  tabInfo: QueryTab
  canCreateSQLSnippet: boolean
}

const QueryItem = ({ tabInfo, canCreateSQLSnippet }: QueryItemProps) => {
  const { ref, id: activeId } = useParams()
  const { id, name } = tabInfo || {}
  const active = id === activeId

  return (
    <ProductMenuItem
      key={id}
      isActive={active}
      name={name}
      action={active && canCreateSQLSnippet && <QueryItemActions tabInfo={tabInfo} />}
      textClassName="w-44"
      url={`/project/${ref}/sql/${id}`}
    />
  )
}

export default QueryItem

const QueryItemActions = observer(({ tabInfo }: { tabInfo: QueryTab }) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const { mutateAsync: deleteContent } = useContentDeleteMutation()

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

    try {
      await deleteContent({ projectRef: ref, id })
      // [Joshen TODO] Needs to load another tab through router push
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
                Remove query
              </Dropdown.Item>
            </>
          }
        >
          <Button
            as="span"
            type="text"
            icon={<IconChevronDown size={12} />}
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
        header="Confirm to remove"
        buttonLabel="Confirm"
        visible={deleteModalOpen}
        onSelectConfirm={onConfirmDelete}
        onSelectCancel={() => setDeleteModalOpen(false)}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-scale-1100">{`Are you sure you want to remove '${name}' ?`}</p>
        </Modal.Content>
      </ConfirmationModal>
    </div>
  )
})
