import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { Button, IconPlus, IconSearch, IconX, Input, Menu, cn } from 'ui'

import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeleton } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { SqlSnippet, useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useCheckPermissions, useSelectedProject, useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSnippets, useSqlEditorStateSnapshot } from 'state/sql-editor'
import QueryItem from './QueryItem'

const SideBarContent = observer(() => {
  const { ui } = useStore()
  const { ref } = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const [searchText, setSearchText] = useState('')

  const snap = useSqlEditorStateSnapshot()
  const { isLoading, isSuccess } = useSqlSnippetsQuery(ref, {
    refetchOnWindowFocus: false,
    staleTime: 300, // 5 minutes
    onSuccess(data) {
      if (ref) snap.setRemoteSnippets(data.snippets, ref)
    },
  })

  const snippets = useSnippets(ref)

  const projectSnippets = useMemo(() => {
    return snippets.filter((snippet) => snippet.visibility === 'project')
  }, [snippets])

  const filteredProjectSnippets = useMemo(() => {
    if (searchText.length > 0) {
      return projectSnippets.filter((tab) =>
        tab.name.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    return projectSnippets
  }, [projectSnippets, searchText])

  const personalSnippets = useMemo(() => {
    const ss = snippets.filter(
      (snippet) => snippet.visibility === 'user' && !snippet.content.favorite
    )

    if (searchText.length > 0) {
      return ss.filter((tab) => tab.name.toLowerCase().includes(searchText.toLowerCase()))
    }
    return ss
  }, [searchText, snippets])

  const favoriteSnippets = useMemo(() => {
    return snippets.filter((snippet) => snippet.content.favorite)
  }, [snippets])

  const filteredFavoriteSnippets = useMemo(() => {
    if (searchText.length > 0) {
      return favoriteSnippets.filter((tab) =>
        tab.name.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    return favoriteSnippets
  }, [favoriteSnippets, searchText])

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const handleNewQuery = async () => {
    if (!ref) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')
    if (!canCreateSQLSnippet) {
      return ui.setNotification({
        category: 'info',
        message: 'Your queries will not be saved as you do not have sufficient permissions',
      })
    }

    try {
      const snippet = createSqlSnippetSkeleton({
        id: uuidv4(),
        name: untitledSnippetTitle,
        owner_id: profile?.id,
        project_id: project?.id,
      })

      snap.addSnippet(snippet as SqlSnippet, ref)

      router.push(`/project/${ref}/sql/${snippet.id}`)
      setSearchText('')
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
            <div className="px-4 flex flex-col gap-2">
              <Button
                type="default"
                className="justify-start"
                onClick={() => handleNewQuery()}
                icon={<IconPlus size="tiny" />}
              >
                New query
              </Button>
              <Input
                className="table-editor-search border-none"
                icon={
                  <IconSearch className="text-foreground-lighter" size={12} strokeWidth={1.5} />
                }
                placeholder="Search queries"
                onChange={(e) => setSearchText(e.target.value.trim())}
                value={searchText}
                size="tiny"
                actions={
                  searchText && (
                    <Button type="text" className="px-1" onClick={() => setSearchText('')}>
                      <IconX size={12} strokeWidth={2} />
                    </Button>
                  )
                }
              />
            </div>
            <div className="space-y-6 px-4">
              {searchText.length === 0 && (
                <div>
                  <ProductMenuItem
                    name="Templates"
                    isActive={router.asPath === `/project/${ref}/sql/templates`}
                    url={`/project/${ref}/sql/templates`}
                  />
                  <ProductMenuItem
                    name="Quickstarts"
                    isActive={router.asPath === `/project/${ref}/sql/quickstarts`}
                    url={`/project/${ref}/sql/quickstarts`}
                  />
                </div>
              )}

              {searchText.length > 0 &&
                filteredFavoriteSnippets.length === 0 &&
                filteredProjectSnippets.length === 0 &&
                personalSnippets.length === 0 && (
                  <div className="h-32 border border-dashed flex flex-col gap-y-3 items-center justify-center rounded px-3">
                    <div className="flex flex-col gap-y-1 items-center justify-center">
                      <p className="text-xs text-foreground">No queries found</p>
                      <p className="text-xs text-foreground-light text-center">
                        Your search for "{searchText}" did not return any results
                      </p>
                    </div>
                    <Button type="default" onClick={() => handleNewQuery()}>
                      New query
                    </Button>
                  </div>
                )}

              {filteredProjectSnippets.length > 0 ? (
                <div className="editor-product-menu">
                  <Menu.Group title="Project queries" />

                  <div className="space-y-1">
                    {filteredProjectSnippets.map((tabInfo) => {
                      const { id } = tabInfo || {}
                      return <QueryItem key={id} tabInfo={tabInfo} />
                    })}
                  </div>
                </div>
              ) : null}

              {filteredFavoriteSnippets.length > 0 ? (
                <div className="editor-product-menu">
                  <Menu.Group title="Favorites" />
                  <div className="space-y-1">
                    {filteredFavoriteSnippets.map((tabInfo) => {
                      const { id } = tabInfo || {}
                      return <QueryItem key={id} tabInfo={tabInfo} />
                    })}
                  </div>
                </div>
              ) : null}

              {personalSnippets.length > 0 ? (
                <div className="editor-product-menu">
                  <Menu.Group title="Your queries" />
                  <div className="space-y-1 pb-8">
                    {personalSnippets.map((tabInfo) => {
                      const { id } = tabInfo || {}
                      return <QueryItem key={id} tabInfo={tabInfo} />
                    })}
                  </div>
                </div>
              ) : null}
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
