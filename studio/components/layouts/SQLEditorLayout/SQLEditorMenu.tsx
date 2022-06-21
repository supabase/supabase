import {
  Button,
  Dropdown,
  IconChevronDown,
  IconEdit2,
  IconLoader,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
  Input,
  Menu,
  Modal,
} from '@supabase/ui'
import RenameQuery from 'components/to-be-cleaned/SqlEditor/RenameQuery'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'
import { useSqlSnippetsQuery } from 'data/sql/useSqlSnippetsQuery'
import { useOptimisticSqlSnippetCreate, useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { useParams } from 'lib/params'
import QueryTab from 'localStores/sqlEditor/QueryTab'
import { TAB_TYPES, useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useState } from 'react'
import { partition } from 'lodash'

const DropdownMenu = observer(({ tabInfo }: { tabInfo: QueryTab }) => {
  const {
    ui: { profile: user },
    content: contentStore,
  } = useStore()

  const sqlEditorStore: any = useSqlStore()

  const [tabId, setTabId] = useState('')
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const { id, name } = tabInfo || {}

  function onCloseRenameModal() {
    setRenameModalOpen(false)
  }

  function renameQuery(e: any) {
    setTabId(id)
    setRenameModalOpen(true)
  }

  function renderMenu() {
    return (
      <>
        <Dropdown.Item onClick={renameQuery} icon={<IconEdit2 size="tiny" />}>
          Rename query
        </Dropdown.Item>
        <Dropdown.Seperator />
        <Dropdown.Item onClick={() => setDeleteModalOpen(true)} icon={<IconTrash size="tiny" />}>
          Remove query
        </Dropdown.Item>
      </>
    )
  }

  return (
    <div>
      {IS_PLATFORM ? (
        <Dropdown side="bottom" align="end" overlay={renderMenu()}>
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

      <RenameQuery
        // @ts-ignore -- @mildtomato not sure what is wrong here
        visible={renameModalOpen}
        onCancel={onCloseRenameModal}
        tabId={tabId}
        onComplete={onCloseRenameModal}
      />

      <ConfirmationModal
        header="Confirm to remove"
        buttonLabel="Confirm"
        visible={deleteModalOpen}
        onSelectConfirm={async () => {
          sqlEditorStore.closeTab(id)

          await contentStore.del(id)

          sqlEditorStore.loadTabs(
            sqlEditorStore.tabsFromContentStore(contentStore, user?.id),
            false
          )
        }}
        onSelectCancel={() => setDeleteModalOpen(false)}
      >
        <Modal.Content>
          <p className="text-scale-1100 py-4 text-sm">{`Are you sure you want to remove '${name}' ?`}</p>
        </Modal.Content>
      </ConfirmationModal>
    </div>
  )
})

const SideBarContent = () => {
  const { ref: projectRef, id } = useParams()
  const { data, isLoading, isSuccess } = useSqlSnippetsQuery(projectRef)

  const [filterString, setFilterString] = useState('')
  // TODO: add filtering based on filterString
  const [favorites, queries] = useMemo(
    () => (data?.snippets ? partition(data.snippets, (snippet) => snippet.content.favorite) : []),
    [data?.snippets]
  )

  const handleNewQuery = useOptimisticSqlSnippetCreate()

  return (
    <div className="mt-6">
      <Menu type="pills">
        {IS_PLATFORM && (
          <div className="my-4 mx-3 space-y-1 px-3">
            <Button
              block
              icon={<IconPlus />}
              type="default"
              style={{ justifyContent: 'start' }}
              onClick={() => handleNewQuery()}
            >
              New query
            </Button>
            <Input
              icon={<IconSearch size="tiny" />}
              placeholder="Search"
              onChange={(e) => setFilterString(e.target.value)}
              value={filterString}
              size="tiny"
              actions={
                filterString && (
                  <IconX
                    size={'tiny'}
                    className="mr-2 cursor-pointer"
                    onClick={() => setFilterString('')}
                  />
                )
              }
            />
          </div>
        )}

        {isLoading && (
          <div className="my-4 flex items-center space-x-2 px-7">
            <IconLoader className="animate-spin" size={16} strokeWidth={2} />
            <p className="text-sm">Loading SQL snippets</p>
          </div>
        )}

        {isSuccess && (
          <div className="space-y-6">
            {IS_PLATFORM && (
              <div className="px-3">
                <Menu.Group title="Getting started" />

                <ProductMenuItem name="Welcome" isActive={!id} url={`/project/${projectRef}/sql`} />
              </div>
            )}

            <div className="space-y-6 px-3">
              {favorites!.length >= 1 && (
                <div className="editor-product-menu">
                  <Menu.Group title="Favorites" />
                  <div className="space-y-1">
                    {favorites!.map(({ id: _id, name }) => {
                      return (
                        <ProductMenuItem
                          key={_id}
                          isActive={id === _id}
                          name={name}
                          url={`/project/${projectRef}/sql/${_id}`}
                          // action={id === _id && <DropdownMenu tabInfo={tabInfo} />}
                          // onClick={() => sqlEditorStore.selectTab(id)}
                          textClassName="w-44"
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {queries!.length >= 1 && (
                <div className="editor-product-menu">
                  <Menu.Group title="SQL snippets" />
                  <div className="space-y-1">
                    {queries!.map(({ id: _id, name }) => {
                      return (
                        <ProductMenuItem
                          key={_id}
                          isActive={id === _id}
                          name={name}
                          url={`/project/${projectRef}/sql/${_id}`}
                          // action={active && <DropdownMenu tabInfo={tabInfo} />}
                          // onClick={() => sqlEditorStore.selectTab(id)}
                          textClassName="w-44"
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {filterString.length > 0 && favorites!.length === 0 && queries!.length === 0 && (
                <div className="px-4">
                  <p className="text-sm">No queries found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Menu>
    </div>
  )
}

export default SideBarContent
