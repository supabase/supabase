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
import { useCheckPermissions, useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSnippets, useSqlEditorStateSnapshot } from 'state/sql-editor'
import { IconSearch, IconX, Input, Menu, cn } from 'ui'
import QueryItem from './QueryItem'

const SideBarContent = observer(() => {
  const { ui } = useStore()
  const { ref, id } = useParams()
  const router = useRouter()
  const { profile } = useProfile()

  const [snippetsFilterString, setSnippetsFilterString] = useState('')
  const [favoritesFilterString, setFavoritesFilterString] = useState('')
  const [isSnippetsFilterOpen, setIsSnippetsFilterOpen] = useState(false)
  const [isFavoritesFilterOpen, setIsFavoritesFilterOpen] = useState(false)

  const snap = useSqlEditorStateSnapshot()
  const { isLoading, isSuccess } = useSqlSnippetsQuery(ref, {
    refetchOnWindowFocus: false,
    staleTime: 300, // 5 minutes
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
    favoritesFilterString.length === 0
      ? favorites
      : favorites.filter((tab) =>
          tab.name.toLowerCase().includes(favoritesFilterString.toLowerCase())
        )

  const snippetsTabs =
    snippetsFilterString.length === 0
      ? queries
      : queries.filter((tab) => tab.name.toLowerCase().includes(snippetsFilterString.toLowerCase()))

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
        {isLoading ? (
          <div className="px-5 my-4 space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : isSuccess ? (
          <div className="space-y-6">
            <div className="px-3 flex flex-col gap-2">
              <ProductMenuItem
                name="Build a query"
                isActive={id === undefined}
                url={`/project/${ref}/sql`}
              />
              <ProductMenuItem
                name="New empty query"
                isActive={false}
                onClick={() => {
                  handleNewQuery()
                }}
              />
            </div>
            <div className="space-y-6 px-3">
              {favorites.length >= 1 && (
                <div className="editor-product-menu">
                  <div className="flex flex-row justify-between">
                    <Menu.Group title="Favorites" />
                    <IconSearch
                      className={cn(
                        'w-4',
                        'h-4',
                        'cursor-pointer',
                        isFavoritesFilterOpen ? 'text-scale-1200' : 'text-scale-900'
                      )}
                      onClick={() => {
                        setIsFavoritesFilterOpen((state) => !state)
                      }}
                    />
                  </div>
                  {isFavoritesFilterOpen && (
                    <div className="pl-3 mb-2">
                      <Input
                        autoFocus
                        size="tiny"
                        icon={<IconSearch size="tiny" />}
                        placeholder="Filter"
                        disabled={isLoading}
                        onChange={(e) => setFavoritesFilterString(e.target.value)}
                        value={favoritesFilterString}
                        actions={
                          favoritesFilterString && (
                            <IconX
                              size={'tiny'}
                              className="mr-2 cursor-pointer"
                              onClick={() => setFavoritesFilterString('')}
                            />
                          )
                        }
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    {favouriteTabs.map((tabInfo) => {
                      const { id } = tabInfo || {}
                      return <QueryItem key={id} tabInfo={tabInfo} />
                    })}
                  </div>
                </div>
              )}
              {queries.length >= 1 && (
                <div className="editor-product-menu">
                  <div className="flex flex-row justify-between">
                    <Menu.Group title="SQL snippets" />
                    <IconSearch
                      className={cn(
                        'w-4',
                        'h-4',
                        'cursor-pointer',
                        isSnippetsFilterOpen ? 'text-scale-1200' : 'text-scale-900'
                      )}
                      onClick={() => {
                        setIsSnippetsFilterOpen((state) => !state)
                      }}
                    />
                  </div>
                  {isSnippetsFilterOpen && (
                    <div className="pl-3 mb-2">
                      <Input
                        autoFocus
                        size="tiny"
                        icon={<IconSearch size="tiny" />}
                        placeholder="Filter"
                        disabled={isLoading}
                        onChange={(e) => setSnippetsFilterString(e.target.value)}
                        value={snippetsFilterString}
                        actions={
                          snippetsFilterString && (
                            <IconX
                              size={'tiny'}
                              className="mr-2 cursor-pointer"
                              onClick={() => setSnippetsFilterString('')}
                            />
                          )
                        }
                      />
                    </div>
                  )}
                  <div className="space-y-1 pb-8">
                    {snippetsTabs.map((tabInfo) => {
                      const { id } = tabInfo || {}
                      return <QueryItem key={id} tabInfo={tabInfo} />
                    })}
                  </div>
                </div>
              )}
              {snippetsFilterString.length > 0 &&
                favouriteTabs.length === 0 &&
                snippetsTabs.length === 0 && (
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
