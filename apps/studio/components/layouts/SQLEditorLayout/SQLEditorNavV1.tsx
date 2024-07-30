import { partition } from 'lodash'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useFlag } from 'hooks/ui/useFlag'
import { useSnippets, useSqlEditorStateSnapshot } from 'state/sql-editor'
import { ResponseError } from 'types'
import { Button, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_ } from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideBarFilterSearchInput,
  InnerSideBarFilters,
  InnerSideBarShimmeringLoaders,
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuSeparator,
} from 'ui-patterns'
import QueryItem from './QueryItem'
import { selectItemsInRange } from './SQLEditorLayout.utils'

interface SQLEditorNavV1Props {
  searchText: string
  selectedQueries: string[]
  handleNewQuery: () => void
  setSearchText: (value: string) => void
  setSelectedQueries: (queries: string[]) => void
  setShowDeleteModal: (value: boolean) => void
}

export const SQLEditorNavV1 = ({
  searchText: _searchText,
  selectedQueries,
  handleNewQuery,
  setSearchText,
  setSelectedQueries,
  setShowDeleteModal,
}: SQLEditorNavV1Props) => {
  const searchText = _searchText.trim()
  const router = useRouter()
  const { ref, id: activeId } = useParams()
  const enableFolders = useFlag('sqlFolderOrganization')

  const snippets = useSnippets(ref)
  const snap = useSqlEditorStateSnapshot()

  const { isLoading, isSuccess, isError, error } = useSqlSnippetsQuery(ref, {
    enabled: !enableFolders,
    refetchOnWindowFocus: false,
    staleTime: 300, // 5 minutes
    onSuccess(data) {
      if (ref) snap.setRemoteSnippets(data.snippets, ref)
    },
  })

  const postDeleteCleanup = (ids: string[]) => {
    setShowDeleteModal(false)
    setSelectedQueries([])
    if (ids.length > 0) ids.forEach((id) => snap.removeSnippet(id))
    const existingSnippetIds = (snap.orders[ref!] ?? []).filter((x) => !ids.includes(x))
    if (existingSnippetIds.length === 0) {
      router.push(`/project/${ref}/sql/new`)
    } else if (ids.includes(activeId as string)) {
      router.push(`/project/${ref}/sql/${existingSnippetIds[0]}`)
    }
  }

  const onSelectQuery = (id?: string, isShiftHeld: boolean = false) => {
    if (id === undefined) return

    if (isShiftHeld) {
      const [selectedFavSnippets, selectedOtherSnippets] = partition(
        selectedQueries,
        (id) => snippets.find((x) => x.id === id)?.content.favorite
      )
      const selectedSnippet = snippets.find((x) => x.id === id)
      const isFavourite = selectedSnippet?.content.favorite

      if (isFavourite) {
        if (selectedFavSnippets.length > 0) {
          const updatedSelectedFavSnippets = selectItemsInRange(
            id,
            filteredFavoriteSnippets,
            selectedFavSnippets
          )
          setSelectedQueries(updatedSelectedFavSnippets.concat(selectedOtherSnippets))
        } else {
          selectQuery(id)
        }
      } else {
        if (selectedOtherSnippets.length > 0) {
          const updatedSelectedOtherSnippets = selectItemsInRange(
            id,
            personalSnippets,
            selectedOtherSnippets
          )
          setSelectedQueries(updatedSelectedOtherSnippets.concat(selectedFavSnippets))
        } else {
          selectQuery(id)
        }
      }
    } else {
      selectQuery(id)
    }
  }

  const selectQuery = (id: string) => {
    if (selectedQueries.includes(id)) {
      setSelectedQueries(selectedQueries.filter((x) => x !== id))
    } else {
      setSelectedQueries(selectedQueries.concat([id]))
    }
  }

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

  return (
    <>
      {isLoading && <InnerSideBarShimmeringLoaders />}

      {isError && (
        <div className="px-4">
          <AlertError error={error as ResponseError} subject="Failed to load SQL snippets" />
        </div>
      )}

      {isSuccess && (
        <>
          {snippets.length > 0 && (
            <InnerSideBarFilters className="mx-2">
              <InnerSideBarFilterSearchInput
                name="search-queries"
                placeholder="Search queries..."
                onChange={(e) => setSearchText(e.target.value)}
                value={_searchText}
                aria-labelledby="Search queries"
              />
            </InnerSideBarFilters>
          )}

          {searchText.length > 0 &&
            personalSnippets.length === 0 &&
            filteredProjectSnippets.length === 0 &&
            filteredFavoriteSnippets.length === 0 &&
            filteredProjectSnippets.length === 0 && (
              <InnerSideBarEmptyPanel
                className="mx-4"
                title="No project queries found"
                description="Click the New query button to create a new query"
                actions={
                  <Button type="default" onClick={() => handleNewQuery()}>
                    New query
                  </Button>
                }
              />
            )}

          {filteredProjectSnippets.length > 0 && (
            <InnerSideMenuCollapsible className="editor-product-menu" defaultOpen>
              <InnerSideMenuCollapsibleTrigger title="Project queries" />
              <InnerSideMenuCollapsibleContent>
                <>
                  {filteredProjectSnippets.map((tabInfo) => (
                    <QueryItem
                      key={tabInfo.id}
                      tabInfo={tabInfo}
                      onDeleteQuery={postDeleteCleanup}
                      hasQueriesSelected={selectedQueries.length > 0}
                    />
                  ))}
                </>
              </InnerSideMenuCollapsibleContent>
            </InnerSideMenuCollapsible>
          )}

          {selectedQueries.length > 0 && (
            <>
              <InnerSideMenuSeparator />
              <div className="px-4 flex items-center gap-x-2 py-2">
                <Button block type="danger" onClick={() => setShowDeleteModal(true)}>
                  Delete {selectedQueries.length.toLocaleString()} quer
                  {selectedQueries.length > 1 ? 'ies' : 'y'}
                </Button>
                <Tooltip_Shadcn_ delayDuration={100}>
                  <TooltipTrigger_Shadcn_ asChild>
                    <Button type="default" onClick={() => setSelectedQueries([])}>
                      Cancel
                    </Button>
                  </TooltipTrigger_Shadcn_>
                  <TooltipContent_Shadcn_ side="bottom">Clear selection</TooltipContent_Shadcn_>
                </Tooltip_Shadcn_>
              </div>
            </>
          )}

          {filteredFavoriteSnippets.length > 0 && (
            <InnerSideMenuCollapsible className="editor-product-menu" defaultOpen>
              <InnerSideMenuCollapsibleTrigger title="Favorites" />
              <InnerSideMenuCollapsibleContent>
                <>
                  {filteredFavoriteSnippets.map((tabInfo) => (
                    <QueryItem
                      key={tabInfo.id}
                      tabInfo={tabInfo}
                      isSelected={selectedQueries.includes(tabInfo.id as string)}
                      hasQueriesSelected={selectedQueries.length > 0}
                      onSelectQuery={(isShiftHeld) => onSelectQuery(tabInfo.id, isShiftHeld)}
                      onDeleteQuery={postDeleteCleanup}
                    />
                  ))}
                </>
              </InnerSideMenuCollapsibleContent>
            </InnerSideMenuCollapsible>
          )}

          {personalSnippets.length > 0 && (
            <InnerSideMenuCollapsible className="editor-product-menu" defaultOpen>
              <InnerSideMenuCollapsibleTrigger title="Your queries" />
              <InnerSideMenuCollapsibleContent className="editor-product-menu">
                <>
                  <div className="space-y-0.5">
                    {personalSnippets.map((tabInfo) => (
                      <QueryItem
                        key={tabInfo.id}
                        tabInfo={tabInfo}
                        isSelected={selectedQueries.includes(tabInfo.id as string)}
                        hasQueriesSelected={selectedQueries.length > 0}
                        onSelectQuery={(isShiftHeld) => onSelectQuery(tabInfo.id, isShiftHeld)}
                        onDeleteQuery={postDeleteCleanup}
                      />
                    ))}
                  </div>
                </>
              </InnerSideMenuCollapsibleContent>
            </InnerSideMenuCollapsible>
          )}
        </>
      )}
    </>
  )
}
