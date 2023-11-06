import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { Button, cn, IconPlus, IconSearch, IconX, Input, Menu } from 'ui'

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

  const [personalSnippetsFilterString, setPersonalSnippetsFilterString] = useState('')
  const [projectSnippetsFilterString, setProjectSnippetsFilterString] = useState('')
  const [favoritesFilterString, setFavoritesFilterString] = useState('')
  const [isPersonalSnippetsFilterOpen, setIsPersonalSnippetsFilterOpen] = useState(false)
  const [isProjectSnippetsFilterOpen, setIsProjectSnippetsFilterOpen] = useState(false)
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

  const projectSnippets = useMemo(() => {
    return snippets.filter((snippet) => snippet.visibility === 'project')
  }, [snippets])

  const filteredProjectSnippets = useMemo(() => {
    if (projectSnippetsFilterString.length > 0) {
      return projectSnippets.filter((tab) =>
        tab.name.toLowerCase().includes(projectSnippetsFilterString.toLowerCase())
      )
    }
    return projectSnippets
  }, [projectSnippets, projectSnippetsFilterString])

  const personalSnippets = useMemo(() => {
    const ss = snippets.filter(
      (snippet) => snippet.visibility === 'user' && !snippet.content.favorite
    )

    if (personalSnippetsFilterString.length > 0) {
      return ss.filter((tab) =>
        tab.name.toLowerCase().includes(personalSnippetsFilterString.toLowerCase())
      )
    }
    return ss
  }, [personalSnippetsFilterString, snippets])

  const favoriteSnippets = useMemo(() => {
    return snippets.filter((snippet) => snippet.content.favorite)
  }, [snippets])

  const filteredFavoriteSnippets = useMemo(() => {
    if (favoritesFilterString.length > 0) {
      return favoriteSnippets.filter((tab) =>
        tab.name.toLowerCase().includes(favoritesFilterString.toLowerCase())
      )
    }
    return favoriteSnippets
  }, [favoriteSnippets, favoritesFilterString])

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
      // reset all search inputs when a new query is added
      setPersonalSnippetsFilterString('')
      setProjectSnippetsFilterString('')
      setFavoritesFilterString('')
      setIsPersonalSnippetsFilterOpen(false)
      setIsProjectSnippetsFilterOpen(false)
      setIsFavoritesFilterOpen(false)
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
              <Button
                type="default"
                className="mx-3 justify-start"
                onClick={() => {
                  handleNewQuery()
                }}
                icon={<IconPlus size="tiny" />}
              >
                New query
              </Button>
            </div>
            <div className="space-y-6 px-3">
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
              {favoriteSnippets.length >= 1 && (
                <div className="editor-product-menu">
                  <div className="flex flex-row justify-between">
                    <Menu.Group title="Favorites" />
                    <button
                      className="flex items-center w-4 h-4 cursor-pointer mr-3"
                      onClick={() => {
                        setIsFavoritesFilterOpen(!isFavoritesFilterOpen)
                      }}
                    >
                      <IconSearch
                        className={cn(
                          'w-4',
                          'h-4',
                          'cursor-pointer',
                          isFavoritesFilterOpen ? 'text-foreground' : 'text-foreground-lighter'
                        )}
                        onClick={() => {
                          setFavoritesFilterString('')
                          setIsFavoritesFilterOpen((state) => !state)
                        }}
                      />
                    </button>
                  </div>
                  {isFavoritesFilterOpen && (
                    <div className="pl-3 mb-2 mr-3">
                      <Input
                        autoFocus
                        size="tiny"
                        icon={<IconSearch size="tiny" />}
                        placeholder="Filter"
                        disabled={isLoading}
                        onChange={(e) => setFavoritesFilterString(e.target.value)}
                        value={favoritesFilterString}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsFavoritesFilterOpen(false)
                            setFavoritesFilterString('')
                          }
                        }}
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
                  {filteredFavoriteSnippets.length > 0 ? (
                    <div className="space-y-1">
                      {filteredFavoriteSnippets.map((tabInfo) => {
                        const { id } = tabInfo || {}
                        return <QueryItem key={id} tabInfo={tabInfo} />
                      })}
                    </div>
                  ) : (
                    <div className="text-foreground text-sm h-32 border border-dashed flex flex-col gap-3 items-center justify-center px-3 mx-3 rounded">
                      <span className="text-foreground-lighter">No queries found</span>
                    </div>
                  )}
                </div>
              )}

              {projectSnippets.length >= 1 && (
                <div className="editor-product-menu">
                  <div className="flex flex-row justify-between">
                    <Menu.Group title="Project queries" />
                    <button
                      className="flex items-center w-4 h-4 cursor-pointer mr-3"
                      onClick={() => {
                        setIsProjectSnippetsFilterOpen(!isProjectSnippetsFilterOpen)
                      }}
                    >
                      <IconSearch
                        className={cn(
                          'w-4',
                          'h-4',
                          'cursor-pointer',
                          isProjectSnippetsFilterOpen
                            ? 'text-foreground'
                            : 'text-foreground-lighter'
                        )}
                        onClick={() => {
                          setProjectSnippetsFilterString('')
                          setIsProjectSnippetsFilterOpen((state) => !state)
                        }}
                      />
                    </button>
                  </div>
                  {isProjectSnippetsFilterOpen && (
                    <div className="pl-3 mb-2 mr-3">
                      <Input
                        autoFocus
                        size="tiny"
                        icon={<IconSearch size="tiny" />}
                        placeholder="Filter"
                        disabled={isLoading}
                        onChange={(e) => setProjectSnippetsFilterString(e.target.value)}
                        value={projectSnippetsFilterString}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsProjectSnippetsFilterOpen(false)
                            setProjectSnippetsFilterString('')
                          }
                        }}
                        actions={
                          projectSnippetsFilterString && (
                            <IconX
                              size={'tiny'}
                              className="mr-2 cursor-pointer"
                              onClick={() => setProjectSnippetsFilterString('')}
                            />
                          )
                        }
                      />
                    </div>
                  )}
                  {filteredProjectSnippets.length > 0 ? (
                    <div className="space-y-1">
                      {filteredProjectSnippets.map((tabInfo) => {
                        const { id } = tabInfo || {}
                        return <QueryItem key={id} tabInfo={tabInfo} />
                      })}
                    </div>
                  ) : (
                    <div className="text-foreground text-sm h-32 border border-dashed flex flex-col gap-3 items-center justify-center px-3 mx-3 rounded">
                      <span className="text-foreground-lighter">No queries found</span>
                    </div>
                  )}
                </div>
              )}

              <div className="editor-product-menu">
                <div className="flex flex-row justify-between">
                  <Menu.Group title="Your queries" />
                  <button
                    className="flex items-center w-4 h-4 cursor-pointer mr-3"
                    onClick={() => {
                      setIsPersonalSnippetsFilterOpen(!isPersonalSnippetsFilterOpen)
                    }}
                  >
                    <IconSearch
                      className={cn(
                        'w-4',
                        'h-4',
                        'cursor-pointer',
                        isPersonalSnippetsFilterOpen ? 'text-foreground' : 'text-foreground-lighter'
                      )}
                      onClick={() => {
                        setPersonalSnippetsFilterString('')
                        setIsPersonalSnippetsFilterOpen((state) => !state)
                      }}
                    />
                  </button>
                </div>
                {isPersonalSnippetsFilterOpen && (
                  <div className="pl-3 mb-2 mr-3">
                    <Input
                      autoFocus
                      size="tiny"
                      icon={<IconSearch size="tiny" />}
                      placeholder="Filter"
                      disabled={isLoading}
                      onChange={(e) => setPersonalSnippetsFilterString(e.target.value)}
                      value={personalSnippetsFilterString}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsPersonalSnippetsFilterOpen(false)
                          setPersonalSnippetsFilterString('')
                        }
                      }}
                      actions={
                        personalSnippetsFilterString && (
                          <IconX
                            size={'tiny'}
                            className="mr-2 cursor-pointer"
                            onClick={() => setPersonalSnippetsFilterString('')}
                          />
                        )
                      }
                    />
                  </div>
                )}
                {personalSnippets.length > 0 ? (
                  <div className="space-y-1 pb-8">
                    {personalSnippets.map((tabInfo) => {
                      const { id } = tabInfo || {}
                      return <QueryItem key={id} tabInfo={tabInfo} />
                    })}
                  </div>
                ) : (
                  <div className="text-foreground text-sm h-32 border border-dashed flex flex-col gap-3 items-center justify-center px-3 mx-3 rounded">
                    {filteredFavoriteSnippets.length === 0 && (
                      <span className="text-foreground-lighter">No queries found</span>
                    )}
                    <Button type="default" onClick={() => handleNewQuery()}>
                      New Query
                    </Button>
                  </div>
                )}
              </div>
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
