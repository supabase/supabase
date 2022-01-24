import { useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import {
  Button,
  Dropdown,
  Divider,
  Menu,
  Input,
  Typography,
  IconSearch,
  IconPlus,
  IconX,
  IconLoader,
  IconTrash,
  IconChevronDown,
  Loading,
} from '@supabase/ui'

import { IS_PLATFORM } from 'lib/constants'
import { useStore } from 'hooks'
import { useProjectContentStore } from 'stores/projectContentStore'
import { useSqlStore, TAB_TYPES } from 'localStores/sqlEditor/SqlEditorStore'

import Modal from 'components/to-be-cleaned/ModalsDeprecated/Modal'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import RenameQuery from 'components/to-be-cleaned/SqlEditor/RenameQuery'
import { createSqlSnippet } from 'components/to-be-cleaned/SqlEditor/SqlEditor.utils'

const OpenQueryItem = observer(({ tabInfo }: { tabInfo: any }) => {
  const sqlEditorStore: any = useSqlStore()
  const { id, name } = tabInfo || {}
  const active = sqlEditorStore.activeTab.id === id

  return (
    <Menu.Item rounded key={id} active={active} onClick={() => sqlEditorStore.selectTab(id)}>
      <div className="flex">
        <Typography.Text className="flex-grow truncate flex items-center">{name}</Typography.Text>
        {active && <DropdownMenu tabInfo={tabInfo} />}
      </div>
    </Menu.Item>
  )
})

const DropdownMenu = observer(({ tabInfo }: { tabInfo: any }) => {
  const router = useRouter()
  const { ref } = router.query

  const sqlEditorStore: any = useSqlStore()
  const contentStore: any = useProjectContentStore(ref)

  const [tabId, setTabId] = useState('')
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const { id, name } = tabInfo || {}

  function onCloseRenameModal() {
    setRenameModalOpen(false)
  }

  function renameQuery(e: any) {
    setTabId(id)
    setRenameModalOpen(true)
  }

  async function removeQuery(e: any) {
    confirmAlert({
      title: 'Confirm to remove',
      message: `Are you sure you want to remove '${name}' ?`,
      onAsyncConfirm: async () => {
        await contentStore.del(id)
        await contentStore.load()
        sqlEditorStore.closeTab(id)
      },
    })
  }

  function renderMenu() {
    return (
      <>
        <Dropdown.Item onClick={renameQuery}>Rename query</Dropdown.Item>
        <Divider light />
        <Dropdown.Item onClick={removeQuery} icon={<IconTrash size="tiny" />}>
          Remove query
        </Dropdown.Item>
      </>
    )
  }

  return (
    <div>
      {IS_PLATFORM ? (
        <Dropdown side="bottom" align="end" overlay={renderMenu()}>
          <Button as="span" type="text" icon={<IconChevronDown />} style={{ padding: '3px' }} />
        </Dropdown>
      ) : (
        <Button as="span" type="text" style={{ padding: '3px' }} />
      )}

      {/* @ts-ignore */}
      <Modal open={renameModalOpen} handleCloseEvent={onCloseRenameModal}>
        {/* @ts-ignore */}
        <RenameQuery tabId={tabId} onComplete={onCloseRenameModal} />
      </Modal>
    </div>
  )
})

const SideBarContent = observer(() => {
  const router = useRouter()
  const { ref } = router.query

  const { ui } = useStore()
  const { profile: user } = ui

  const sqlEditorStore: any = useSqlStore()
  const contentStore: any = useProjectContentStore(ref)

  const [filterString, setFilterString] = useState('')
  const [loadingNewQuery, setLoadingNewQuery] = useState(false)

  async function handleNewQuery() {
    try {
      setLoadingNewQuery(true)
      // create new sql snippet, this also reloads the project_content store
      // @ts-ignore
      const snippet = await createSqlSnippet({ router })

      // reload the local sqlEditorStore
      await sqlEditorStore.loadRemotePersistentData(contentStore, user?.id)

      // select tab with new snippet
      if (snippet) sqlEditorStore.selectTab(snippet.id)
      setLoadingNewQuery(false)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create new query: ${error.message}`,
      })
      setLoadingNewQuery(false)
    }
  }

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
    <div className="mt-8">
      <Menu>
        {IS_PLATFORM && (
          <div className="my-4 px-3 space-y-1">
            <Menu.Misc>
              <Button
                block
                className="mx-1"
                icon={<IconPlus />}
                type="text"
                style={{ justifyContent: 'start' }}
                onClick={() => handleNewQuery()}
                loading={loadingNewQuery}
              >
                New query
              </Button>
            </Menu.Misc>
            <Menu.Misc>
              <Input
                icon={<IconSearch size="tiny" />}
                className="sbui-input-no-border mx-1"
                placeholder="Search"
                onChange={(e) => setFilterString(e.target.value)}
                value={filterString}
                size="tiny"
                actions={
                  filterString && (
                    <IconX
                      size={'tiny'}
                      className="cursor-pointer mr-2"
                      onClick={() => setFilterString('')}
                    />
                  )
                }
              />
            </Menu.Misc>
          </div>
        )}

        {(sqlEditorStore?.tabs ?? []).length === 0 ? (
          <div className="my-4 px-7 flex items-center space-x-2">
            <IconLoader className="animate-spin" size={16} strokeWidth={2} />
            <Typography.Text type="secondary">Loading SQL snippets</Typography.Text>
          </div>
        ) : (
          <div className="space-y-6">
            {IS_PLATFORM && (
              <div className="px-3 dash-product-menu">
                <Menu.Group title="Getting started" />
                {getStartedTabs.map((tab: any) => {
                  const { id, name } = tab || {}
                  return (
                    <Menu.Item
                      rounded
                      key={id}
                      active={sqlEditorStore.activeTab.id === id}
                      onClick={() => sqlEditorStore.selectTab(id)}
                    >
                      <Typography.Text className="truncate">{name}</Typography.Text>
                    </Menu.Item>
                  )
                })}
              </div>
            )}
            <Loading active={contentStore.isInitialized}>
              <div className="px-3 space-y-6">
                {favouriteTabs.length >= 1 && (
                  <div className="editor-product-menu">
                    <Menu.Group title="Favorites" />
                    <div className="space-y-1">
                      {favouriteTabs.map((tabInfo: any) => {
                        const { id } = tabInfo || {}
                        return <OpenQueryItem key={id} tabInfo={tabInfo} />
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
                        return <OpenQueryItem key={id} tabInfo={tabInfo} />
                      })}
                    </div>
                  </div>
                )}
                {filterString.length > 0 && favouriteTabs.length === 0 && queryTabs.length === 0 && (
                  <div className="px-4">
                    <Typography.Text type="secondary">No queries found</Typography.Text>
                  </div>
                )}
              </div>
            </Loading>
          </div>
        )}
      </Menu>
    </div>
  )
})

export default SideBarContent
