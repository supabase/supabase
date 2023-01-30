import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Button,
  Dropdown,
  Menu,
  Input,
  IconSearch,
  IconPlus,
  IconX,
  IconLoader,
  IconTrash,
  IconChevronDown,
  Modal,
  IconEdit2,
} from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useOptimisticSqlSnippetCreate, useStore, checkPermissions } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import QueryTab from 'localStores/sqlEditor/QueryTab'
import { useSqlStore, TAB_TYPES } from 'localStores/sqlEditor/SqlEditorStore'

import RenameQuery from 'components/to-be-cleaned/SqlEditor/RenameQuery'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'

const OpenQueryItem = observer(
  ({ tabInfo, canCreateSQLSnippet }: { tabInfo: QueryTab; canCreateSQLSnippet: boolean }) => {
    const sqlEditorStore: any = useSqlStore()
    const { id, name } = tabInfo || {}
    const active = sqlEditorStore.activeTab.id === id

    return (
      <ProductMenuItem
        key={id}
        isActive={active}
        name={name}
        action={active && canCreateSQLSnippet && <DropdownMenu tabInfo={tabInfo} />}
        onClick={() => sqlEditorStore.selectTab(id)}
        textClassName="w-44"
      />
    )
  }
)

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
        <Dropdown.Separator />
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
          <p className="py-4 text-sm text-scale-1100">{`Are you sure you want to remove '${name}' ?`}</p>
        </Modal.Content>
      </ConfirmationModal>
    </div>
  )
})

const SideBarContent = observer(() => {
  const { ui } = useStore()
  const sqlEditorStore: any = useSqlStore()
  const [filterString, setFilterString] = useState('')

  const canCreateSQLSnippet = checkPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: ui.profile?.id },
    subject: { id: ui.profile?.id },
  })

  const handleNewQuery = useOptimisticSqlSnippetCreate(canCreateSQLSnippet)

  const getStartedTabs = (sqlEditorStore?.tabs ?? []).filter((tab: any) => {
    return tab.type === TAB_TYPES.WELCOME
  })

  const favorites = (sqlEditorStore?.tabs ?? []).filter((tab: any) => {
    return tab.type !== TAB_TYPES.WELCOME && tab.favorite
  })

  const queries = (sqlEditorStore?.tabs ?? []).filter((tab: any) => {
    return tab.type !== TAB_TYPES.WELCOME && !tab.favorite
  })

  const favouriteTabs =
    filterString.length === 0
      ? favorites
      : favorites.filter((tab: any) => tab.name.includes(filterString))

  const queryTabs =
    filterString.length === 0
      ? queries
      : queries.filter((tab: any) => tab.name.includes(filterString))

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

        {(sqlEditorStore?.tabs ?? []).length === 0 ? (
          <div className="my-4 flex items-center space-x-2 px-7">
            <IconLoader className="animate-spin" size={16} strokeWidth={2} />
            <p className="text-sm">Loading SQL snippets</p>
          </div>
        ) : (
          <div className="space-y-6">
            {IS_PLATFORM && (
              <div className="px-3">
                <Menu.Group title="Getting started" />
                {getStartedTabs.map((tab: any) => {
                  const { id, name } = tab || {}
                  return (
                    <ProductMenuItem
                      key={id}
                      name={name}
                      isActive={sqlEditorStore.activeTab.id === id}
                      onClick={() => sqlEditorStore.selectTab(id)}
                    />
                  )
                })}
              </div>
            )}
            <div className="space-y-6 px-3">
              {favouriteTabs.length >= 1 && (
                <div className="editor-product-menu">
                  <Menu.Group title="Favorites" />
                  <div className="space-y-1">
                    {favouriteTabs.map((tabInfo: any) => {
                      const { id } = tabInfo || {}
                      return (
                        <OpenQueryItem
                          key={id}
                          tabInfo={tabInfo}
                          canCreateSQLSnippet={canCreateSQLSnippet}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
              {queryTabs.length >= 1 && (
                <div className="editor-product-menu">
                  <Menu.Group title="SQL snippets" />
                  <div className="space-y-1">
                    {queryTabs.map((tabInfo: any) => {
                      const { id } = tabInfo || {}
                      return (
                        <OpenQueryItem
                          key={id}
                          tabInfo={tabInfo}
                          canCreateSQLSnippet={canCreateSQLSnippet}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
              {filterString.length > 0 && favouriteTabs.length === 0 && queryTabs.length === 0 && (
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
})

export default SideBarContent
