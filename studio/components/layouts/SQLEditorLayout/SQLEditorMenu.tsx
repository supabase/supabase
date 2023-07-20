import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeleton } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { SqlSnippet, useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useCheckPermissions, useFlag, useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSnippets, useSqlEditorStateSnapshot } from 'state/sql-editor'
import { Button, Dropdown, IconPlus, IconSearch, IconX, Input, Menu, useCommandMenu } from 'ui'
import QueryItem from './QueryItem'

const SideBarContent = observer(() => {
  const { ui } = useStore()
  const { ref, id } = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const [filterString, setFilterString] = useState('')
  const { setPages, setIsOpen } = useCommandMenu()
  const showCmdkHelper = useFlag('dashboardCmdk')

  const snap = useSqlEditorStateSnapshot()
  const { isLoading, isSuccess } = useSqlSnippetsQuery(ref, {
    onSuccess(data) {
      if (ref) snap.setRemoteSnippets(data.snippets, ref)
    },
  })

  const snippets = useSnippets(ref)

  const [favorites, queries] = useMemo(
    () => (snippets ? partition(snippets, (snippet) => snippet.content.favorite) : [[], []]),
    [snippets]
  )

  const favouriteTabs =
    filterString.length === 0
      ? favorites
      : favorites.filter((tab) => tab.name.toLowerCase().includes(filterString.toLowerCase()))

  const queryTabs =
    filterString.length === 0
      ? queries
      : queries.filter((tab) => tab.name.toLowerCase().includes(filterString.toLowerCase()))
  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const handleNewQuery = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!canCreateSQLSnippet) {
      return ui.setNotification({
        category: 'info',
        message: 'Your queries will not be saved as you do not have sufficient permissions',
      })
    }

    try {
      const snippet = createSqlSnippetSkeleton({
        name: untitledSnippetTitle,
        owner_id: profile?.id,
      })
      const data = { ...snippet, id: uuidv4() }

      snap.addSnippet(data as SqlSnippet, ref, true)

      router.push(`/project/${ref}/sql/${data.id}`)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create new query: ${error.message}`,
      })
    }
  }

  return (
    <div className="mt-6">
      <Menu type="pills">
        {IS_PLATFORM && (
          <div className="my-4 mx-3 space-y-2 px-3">
            <div className="flex items-center mb-3 w-full justify-center min-w-[210px] ">
              <Dropdown
                align="start"
                side="bottom"
                sideOffset={3}
                className="max-w-[210px]"
                overlay={[
                  <Dropdown.Item key="new-blank-query" onClick={() => handleNewQuery()}>
                    <div className="space-y-1">
                      <p className="block text-scale-1200 text-xs">New blank query</p>
                    </div>
                  </Dropdown.Item>,
                  <div key={'divider'} className="my-1 border-t border-scale-400" />,
                  showCmdkHelper ? (
                    <Dropdown.Item
                      key="new-ai-query"
                      onClick={() => {
                        router.push(`/project/${ref}/sql`)
                      }}
                    >
                      <div className="space-y-1">
                        <p className="block text-scale-1200 text-xs">New AI query</p>
                      </div>
                    </Dropdown.Item>
                  ) : null,
                ]}
              >
                <Button
                  block
                  icon={<IconPlus />}
                  className="min-w-[208px]"
                  type="outline"
                  disabled={isLoading}
                  style={{ justifyContent: 'start' }}
                >
                  New query
                </Button>
              </Dropdown>
            </div>
            <Input
              size="tiny"
              icon={<IconSearch size="tiny" />}
              placeholder="Search"
              disabled={isLoading}
              onChange={(e) => setFilterString(e.target.value)}
              value={filterString}
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
        {isLoading ? (
          <div className="px-5 my-4 space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : isSuccess ? (
          <div className="space-y-6">
            {IS_PLATFORM && (
              <div className="px-3">
                <Menu.Group title="Getting started" />
                <ProductMenuItem
                  name="Build a Query"
                  isActive={id === undefined}
                  url={`/project/${ref}/sql`}
                />
              </div>
            )}
            <div className="space-y-6 px-3">
              {favouriteTabs.length >= 1 && (
                <div className="editor-product-menu">
                  <Menu.Group title="Favorites" />
                  <div className="space-y-1">
                    {favouriteTabs.map((tabInfo) => {
                      const { id } = tabInfo || {}
                      return <QueryItem key={id} tabInfo={tabInfo} />
                    })}
                  </div>
                </div>
              )}
              {queryTabs.length >= 1 && (
                <div className="editor-product-menu">
                  <Menu.Group title="SQL snippets" />
                  <div className="space-y-1 pb-8">
                    {queryTabs.map((tabInfo) => {
                      const { id } = tabInfo || {}
                      return <QueryItem key={id} tabInfo={tabInfo} />
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
        ) : (
          <div></div>
        )}
      </Menu>
    </div>
  )
})

export default SideBarContent
