import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeleton } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { SqlSnippet, useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useCheckPermissions, useSelectedProject } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSnippets, useSqlEditorStateSnapshot } from 'state/sql-editor'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Modal,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { WarningIcon } from 'ui-patterns/Icons/StatusIcons'
import {
  InnerSideBarEmptyPanel,
  InnerSideBarFilterSearchInput,
  InnerSideBarFilters,
  InnerSideBarShimmeringLoaders,
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuItem,
  InnerSideMenuSeparator,
} from 'ui-patterns/InnerSideMenu'
import QueryItem from './QueryItem'
import { selectItemsInRange } from './SQLEditorLayout.utils'

const SideBarContent = () => {
  const { ref, id: activeId } = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()

  const [searchText, setSearchText] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedQueries, setSelectedQueries] = useState<string[]>([])

  const snap = useSqlEditorStateSnapshot()
  const { isLoading, isSuccess } = useSqlSnippetsQuery(ref, {
    refetchOnWindowFocus: false,
    staleTime: 300, // 5 minutes
    onSuccess(data) {
      if (ref) snap.setRemoteSnippets(data.snippets, ref)
    },
  })

  const { mutate: deleteContent, isLoading: isDeleting } = useContentDeleteMutation({
    onSuccess: (data) => postDeleteCleanup(data),
    onError: (error, data) => {
      if (error.code === 404 && error.message.includes('Content not found')) {
        postDeleteCleanup(data.ids)
      } else {
        toast.error(`Failed to delete queries: ${error.message}`)
      }
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

  const handleNewQuery = async () => {
    if (!ref) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')
    if (!canCreateSQLSnippet) {
      return toast('Your queries will not be saved as you do not have sufficient permissions')
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
      toast.error(`Failed to create new query: ${error.message}`)
    }
  }

  const onConfirmDelete = async () => {
    if (!ref) return console.error('Project ref is required')
    deleteContent({ projectRef: ref, ids: selectedQueries })
  }

  return (
    <>
      <div className="mt-6">
        {isLoading ? (
          <InnerSideBarShimmeringLoaders />
        ) : isSuccess ? (
          <div>
            <div className="flex flex-col gap-4">
              <Button
                type="default"
                className="justify-start mx-4"
                onClick={() => handleNewQuery()}
                icon={<Plus className="text-foreground-muted" strokeWidth={1} size={14} />}
              >
                New query
              </Button>

              <div className="px-2">
                <InnerSideMenuItem
                  title="Templates"
                  isActive={router.asPath === `/project/${ref}/sql/templates`}
                  href={`/project/${ref}/sql/templates`}
                >
                  Templates
                </InnerSideMenuItem>
                <InnerSideMenuItem
                  title="Quickstarts"
                  isActive={router.asPath === `/project/${ref}/sql/quickstarts`}
                  href={`/project/${ref}/sql/quickstarts`}
                >
                  Quickstarts
                </InnerSideMenuItem>
              </div>

              {snippets.length > 0 && (
                <InnerSideBarFilters className="mx-2">
                  <InnerSideBarFilterSearchInput
                    name="search-queries"
                    placeholder="Search queries..."
                    onChange={(e) => setSearchText(e.target.value.trim())}
                    value={searchText}
                    aria-labelledby="Search queries"
                  />
                </InnerSideBarFilters>
              )}

              {searchText.length > 0 &&
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
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmationModal
        title="Confirm to delete query"
        confirmLabel={`Delete ${selectedQueries.length.toLocaleString()} quer${selectedQueries.length > 1 ? 'ies' : 'y'}`}
        confirmLabelLoading="Deleting query"
        size="medium"
        loading={isDeleting}
        visible={showDeleteModal}
        onConfirm={onConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        variant={'destructive'}
        alert={{
          title: 'This action cannot be undone',
          description: 'The selected SQL snippets cannot be recovered once deleted',
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete the selected {selectedQueries.length} quer
          {selectedQueries.length > 1 ? 'ies' : 'y'}?
        </p>
      </ConfirmationModal>
    </>
  )
}

export default SideBarContent
