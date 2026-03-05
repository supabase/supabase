import { keepPreviousData } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useParams } from 'common'
import DownloadSnippetModal from 'components/interfaces/SQLEditor/DownloadSnippetModal'
import { MoveQueryModal } from 'components/interfaces/SQLEditor/MoveQueryModal'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import { generateSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { EmptyPrivateQueriesPanel } from 'components/layouts/SQLEditorLayout/PrivateSqlSnippetEmpty'
import EditorMenuListSkeleton from 'components/layouts/TableEditorLayout/EditorMenuListSkeleton'
import { useSqlEditorTabsCleanup } from 'components/layouts/Tabs/Tabs.utils'
import { useContentCountQuery } from 'data/content/content-count-query'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { useSQLSnippetFoldersDeleteMutation } from 'data/content/sql-folders-delete-mutation'
import { Snippet, SnippetFolder, useSQLSnippetFoldersQuery } from 'data/content/sql-folders-query'
import { useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import { useSnippetFolders, useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import { TreeView } from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuSeparator,
} from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { CommunitySnippetsSection } from './CommunitySnippetsSection'
import { DeleteSnippetsModal } from './DeleteSnippetsModal'
import SQLEditorLoadingSnippets from './SQLEditorLoadingSnippets'
import { DEFAULT_SECTION_STATE, type SectionState } from './SQLEditorNav.constants'
import { formatFolderResponseForTreeView, getLastItemIds, ROOT_NODE } from './SQLEditorNav.utils'
import { SQLEditorTreeViewItem } from './SQLEditorTreeViewItem'
import { ShareSnippetModal } from './ShareSnippetModal'
import { UnshareSnippetModal } from './UnshareSnippetModal'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface SQLEditorNavProps {
  sort?: 'inserted_at' | 'name'
}

export const SQLEditorNav = ({ sort = 'inserted_at' }: SQLEditorNavProps) => {
  const router = useRouter()
  const { ref: projectRef, id } = useParams()

  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const tabs = useTabsStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [sectionVisibility, setSectionVisibility] = useLocalStorage<SectionState>(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_SECTION_STATE(projectRef ?? ''),
    DEFAULT_SECTION_STATE
  )
  const {
    shared: showSharedSnippets,
    favorite: showFavoriteSnippets,
    private: showPrivateSnippets,
  } = sectionVisibility

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  )

  // Mutation for updating snippet folder
  const { mutate: updateSnippet } = useContentUpsertMutation({
    onSuccess: () => {
      toast.success('Query moved successfully')
    },
    onError: (error) => {
      toast.error(`Failed to move query: ${error.message}`)
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !projectRef) return

    const draggedItem = active.data.current
    const dropTarget = over.data.current

    // Only handle snippet dragging (not folders)
    if (draggedItem?.type !== 'snippet') return

    const snippet = draggedItem.element?.metadata as Snippet
    if (!snippet) return

    // Determine the new folder_id based on drop target
    let newFolderId: string | null = null

    if (dropTarget?.type === 'folder') {
      // Dropped on a folder
      newFolderId = dropTarget.element.id
    } else if (dropTarget?.type === 'snippet') {
      // Dropped on another snippet - use that snippet's folder
      newFolderId = dropTarget.element?.metadata?.folder_id ?? null
    } else {
      // Dropped on root/section - remove from folder
      newFolderId = null
    }

    // Only update if folder changed
    if (newFolderId === snippet.folder_id) return

    // Update snippet with new folder_id
    updateSnippet({
      projectRef,
      payload: {
        id: snippet.id,
        name: snippet.name,
        description: snippet.description,
        type: 'sql',
        visibility: snippet.visibility,
        folder_id: newFolderId,
        content: {}, // Content doesn't need to be changed
      },
    })

    // Update local state immediately for responsiveness
    snapV2.addSnippet({
      projectRef,
      snippet: {
        ...snippet,
        folder_id: newFolderId,
      },
    })
  }

  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)

  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([])
  const [selectedSnippets, setSelectedSnippets] = useState<Snippet[]>([])
  const [selectedSnippetToShare, setSelectedSnippetToShare] = useState<Snippet>()
  const [selectedSnippetToUnshare, setSelectedSnippetToUnshare] = useState<Snippet>()
  const [selectedSnippetToRename, setSelectedSnippetToRename] = useState<Snippet>()
  const [selectedSnippetToDownload, setSelectedSnippetToDownload] = useState<Snippet>()
  const [selectedFolderToDelete, setSelectedFolderToDelete] = useState<SnippetFolder>()

  const snippet = snapV2.snippets[id as string]?.snippet

  // ==========================
  // Private snippets & folders
  // ==========================
  const {
    data: privateSnippetsPages,
    isSuccess,
    isLoading,
    isPlaceholderData,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    error: snippetsFoldersError,
  } = useSQLSnippetFoldersQuery({ projectRef, sort }, { placeholderData: keepPreviousData })

  const [subResults, setSubResults] = useState<{
    [id: string]: { snippets?: Snippet[]; isLoading: boolean }
  }>({})

  const filteredSnippets = useMemo(() => {
    const rootSnippets = privateSnippetsPages?.pages.flatMap((page) => page.contents ?? []) ?? []

    let snippetInfo = Object.values(subResults).reduce(
      (
        acc: {
          snippets: Snippet[]
          isLoading: boolean
          snippetIds: Set<string>
        },
        curr
      ) => {
        // filter out snippets that already exist
        const newSnippets = (curr.snippets ?? []).filter(
          (snippet) => !acc.snippetIds.has(snippet.id)
        )
        const newSnippetIds = new Set(newSnippets.map((snippet) => snippet.id))

        return {
          snippets: [...acc.snippets, ...newSnippets],
          isLoading: acc.isLoading || curr.isLoading,
          snippetIds: new Set<string>([...acc.snippetIds, ...newSnippetIds]),
        }
      },
      {
        snippets: rootSnippets,
        isLoading: isLoading || (isPlaceholderData && isFetching),
        snippetIds: new Set<string>(rootSnippets.map((snippet) => snippet.id)),
      }
    )

    if (snippet && snippet.visibility === 'user' && !snippetInfo.snippetIds.has(snippet.id)) {
      snippetInfo.snippetIds.add(snippet.id)
      snippetInfo.snippets = [...snippetInfo.snippets, snippet]
    }

    return snippetInfo
  }, [privateSnippetsPages?.pages, subResults, isLoading, isPlaceholderData, isFetching, snippet])

  const privateSnippets = useMemo(
    () =>
      filteredSnippets.snippets
        ?.filter((snippet) => snippet.visibility === 'user')
        .sort((a, b) => {
          if (sort === 'name') return a.name.localeCompare(b.name)
          else return new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
        }) ?? [],
    [filteredSnippets.snippets, sort]
  )
  const folders = useSnippetFolders(projectRef!)

  const { data: snippetCountData, error: snippetCountError } = useContentCountQuery({
    projectRef,
    type: 'sql',
  })

  useEffect(() => {
    if (snippetCountError || snippetsFoldersError) {
      toast.error(
        snippetCountError?.message || snippetsFoldersError?.message || 'Failed to load snippets'
      )
    }
  }, [snippetCountError, snippetsFoldersError])

  const numPrivateSnippets = snippetCountData?.private ?? 0

  const privateSnippetsTreeState = useMemo(
    () =>
      folders.length === 0 && privateSnippets.length === 0
        ? [ROOT_NODE]
        : formatFolderResponseForTreeView({ folders, contents: privateSnippets }),
    [folders, privateSnippets]
  )

  const privateSnippetsLastItemIds = useMemo(
    () => getLastItemIds(privateSnippetsTreeState),
    [privateSnippetsTreeState]
  )

  // =================
  // Favorite snippets
  // =================
  const {
    data: favoriteSqlSnippetsData,
    isPending: isLoadingFavoriteSqlSnippets,
    hasNextPage: hasMoreFavoriteSqlSnippets,
    fetchNextPage: fetchNextFavoriteSqlSnippets,
    isFetchingNextPage: isFetchingMoreFavoriteSqlSnippets,
    isSuccess: isFavoriteSnippetsSuccess,
  } = useSqlSnippetsQuery(
    {
      projectRef,
      favorite: true,
      sort,
    },
    { enabled: showFavoriteSnippets, placeholderData: keepPreviousData }
  )

  const favoriteSnippets = useMemo(() => {
    let snippets = favoriteSqlSnippetsData?.pages.flatMap((page) => page.contents ?? []) ?? []

    if (snippet && snippet.favorite && !snippets.find((x) => x.id === snippet.id)) {
      snippets.push(snippet as any)
    }

    return (
      snippets
        .map((snippet) => ({ ...snippet, folder_id: undefined }))
        .sort((a, b) => {
          if (sort === 'name') return a.name.localeCompare(b.name)
          else return new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
        }) ?? []
    )
  }, [favoriteSqlSnippetsData?.pages, snippet, sort])

  const numFavoriteSnippets = snippetCountData?.favorites ?? 0

  const favoritesTreeState = useMemo(
    () =>
      favoriteSnippets.length === 0
        ? [ROOT_NODE]
        : formatFolderResponseForTreeView({ contents: favoriteSnippets, folders: [] }),
    [favoriteSnippets]
  )

  const favoriteSnippetsLastItemIds = useMemo(
    () => getLastItemIds(favoritesTreeState),
    [favoritesTreeState]
  )

  // =================
  // Shared snippets
  // =================
  const {
    data: sharedSqlSnippetsData,
    isLoading: isLoadingSharedSqlSnippets,
    hasNextPage: hasMoreSharedSqlSnippets,
    fetchNextPage: fetchNextSharedSqlSnippets,
    isFetchingNextPage: isFetchingMoreSharedSqlSnippets,
    isSuccess: isSharedSqlSnippetsSuccess,
  } = useSqlSnippetsQuery(
    {
      projectRef,
      visibility: 'project',
      sort,
    },
    { enabled: showSharedSnippets, placeholderData: keepPreviousData }
  )

  const sharedSnippets = useMemo(() => {
    let snippets = sharedSqlSnippetsData?.pages.flatMap((page) => page.contents ?? []) ?? []

    if (snippet && snippet.visibility === 'project' && !snippets.find((x) => x.id === snippet.id)) {
      snippets.push(snippet as any)
    }

    return (
      snippets.sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        else return new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
      }) ?? []
    )
  }, [sharedSqlSnippetsData?.pages, snippet, sort])

  const numProjectSnippets = snippetCountData?.shared ?? 0

  const projectSnippetsTreeState = useMemo(
    () =>
      sharedSnippets.length === 0
        ? [ROOT_NODE]
        : formatFolderResponseForTreeView({ contents: sharedSnippets, folders: [] }),
    [sharedSnippets]
  )

  const projectSnippetsLastItemIds = useMemo(
    () => getLastItemIds(projectSnippetsTreeState),
    [projectSnippetsTreeState]
  )

  const allSnippetsInView = useMemo(
    () => [
      ...(privateSnippetsPages?.pages.flatMap((x) => x.contents) ?? []),
      ...(sharedSqlSnippetsData?.pages.flatMap((x) => x.contents) ?? []),
    ],
    [privateSnippetsPages, sharedSqlSnippetsData]
  )

  // ==========================
  // Snippet mutations from  RQ
  // ==========================

  const { mutate: deleteContent } = useContentDeleteMutation({
    onSuccess: (data) => {
      // Update Tabs state - currently unknown how to differentiate between sql and non-sql content
      // so we're just deleting all tabs for with matching IDs
      const tabIds = data.map((id) => createTabId('sql', { id }))
      tabs.removeTabs(tabIds)
    },
    onError: (error, data) => {
      if (error.message.includes('Contents not found')) {
        postDeleteCleanup(data.ids)
      } else {
        toast.error(`Failed to delete query: ${error.message}`)
      }
    },
  })

  const { mutate: deleteFolder, isPending: isDeletingFolder } = useSQLSnippetFoldersDeleteMutation({
    onSuccess: (_, vars) => {
      toast.success('Successfully deleted folder')
      const { ids } = vars
      snapV2.removeFolder(ids[0])
      setSelectedFolderToDelete(undefined)
    },
  })

  // ===============
  // UI functions
  // ===============

  const postDeleteCleanup = (ids: string[]) => {
    // [Refactor] To investigate - deleting a snippet while it's open, will have it in the side nav
    // for a bit, before it gets removed (assumingly invalidated)
    setShowDeleteModal(false)
    setSelectedSnippets([])
    const existingSnippetIds = Object.keys(snapV2.snippets).filter((x) => !ids.includes(x))

    if (existingSnippetIds.length === 0) {
      router.push(`/project/${projectRef}/sql/new`)
    } else if (ids.includes(id as string)) {
      router.push(`/project/${projectRef}/sql/${existingSnippetIds[0]}`)
    }

    if (ids.length > 0) ids.forEach((id) => snapV2.removeSnippet(id))
  }

  const onConfirmDeleteFolder = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (selectedFolderToDelete === undefined) return console.error('No folder is selected')

    const folderSnippets = privateSnippets.filter(
      (content) => content.folder_id === selectedFolderToDelete.id
    )
    if (folderSnippets.length > 0) {
      const ids = folderSnippets.map((x) => x.id)
      deleteContent(
        { projectRef, ids },
        {
          onSuccess: () => {
            ids.forEach((id) => snapV2.removeSnippet(id))
            postDeleteCleanup(ids)
            deleteFolder({ projectRef, ids: [selectedFolderToDelete?.id] })
          },
        }
      )
    } else {
      deleteFolder({ projectRef, ids: [selectedFolderToDelete?.id] })
    }
  }

  // [Joshen] Just FYI doing a controlled state instead of letting the TreeView component doing it because
  // 1. There seems to be no way of accessing the internal state of the TreeView to retrieve the selected nodes
  // 2. The component itself doesn't handle UUID for node IDs well - trying to multi select doesn't select the expected nodes
  // We're only supporting shift clicks (not cmd/control click) - this is even with the react tree view component itself
  const onMultiSelect = (selectedId: string) => {
    // The base is always the current query thats selected
    const contentIds = privateSnippets.map((x) => x.id)
    const baseIndex = contentIds.indexOf(id as string)
    const targetIndex = contentIds.indexOf(selectedId)

    const floor = Math.min(baseIndex, targetIndex)
    const ceiling = Math.max(baseIndex, targetIndex)

    const _selectedSnippets = []
    const sameFolder = privateSnippets[floor].folder_id === privateSnippets[ceiling].folder_id

    for (let i = floor; i <= ceiling; i++) {
      if (sameFolder) {
        if (privateSnippets[i].folder_id === privateSnippets[floor].folder_id)
          _selectedSnippets.push(privateSnippets[i])
      } else {
        // [Joshen] Temp don't allow selecting across folders for now
        // _selectedSnippets.push(contents[i])
      }
    }

    setSelectedSnippets(_selectedSnippets)
  }

  // ===============
  // useEffects
  // ===============

  useEffect(() => {
    if (snippet !== undefined && isSuccess) {
      if (snippet.visibility === 'project') {
        setSectionVisibility({ ...sectionVisibility, shared: true })
      } else if (snippet.visibility === 'user') {
        setSectionVisibility({ ...sectionVisibility, private: true })
      }
      if (snippet.folder_id && !expandedFolderIds.includes(snippet.folder_id)) {
        setExpandedFolderIds([...expandedFolderIds, snippet.folder_id])
      }
    }
  }, [snippet, sort, isSuccess])

  useEffect(() => {
    // Unselect all snippets whenever opening another snippet
    setSelectedSnippets([])
  }, [id])

  useEffect(() => {
    if (projectRef && privateSnippetsPages?.pages) {
      privateSnippetsPages.pages.forEach((page) => {
        page.contents?.forEach((snippet: Snippet) => {
          snapV2.addSnippet({ projectRef, snippet })
        })
        page.folders?.forEach((folder) => snapV2.addFolder({ projectRef, folder }))
      })
    }
  }, [projectRef, privateSnippetsPages?.pages])

  useEffect(() => {
    if (projectRef === undefined || !isFavoriteSnippetsSuccess) return

    favoriteSqlSnippetsData.pages.forEach((page) => {
      page.contents?.forEach((snippet) => {
        snapV2.addSnippet({ projectRef, snippet })
      })
    })
  }, [projectRef, favoriteSqlSnippetsData?.pages])

  useEffect(() => {
    if (projectRef === undefined || !isSharedSqlSnippetsSuccess) return

    sharedSqlSnippetsData.pages.forEach((page) => {
      page.contents?.forEach((snippet) => {
        snapV2.addSnippet({ projectRef, snippet })
      })
    })
  }, [projectRef, sharedSqlSnippetsData?.pages])

  const sqlEditorTabsCleanup = useSqlEditorTabsCleanup()
  useEffect(() => {
    if (isSuccess) {
      sqlEditorTabsCleanup({ snippets: allSnippetsInView as any })
    }
  }, [allSnippetsInView, isSuccess, sqlEditorTabsCleanup])

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <InnerSideMenuSeparator />
      {IS_PLATFORM && (
        <>
          <InnerSideMenuCollapsible
            className="px-0"
            open={showSharedSnippets}
            onOpenChange={(value) => {
              setSectionVisibility({
                ...(sectionVisibility ?? DEFAULT_SECTION_STATE),
                shared: value,
              })
            }}
          >
            <InnerSideMenuCollapsibleTrigger
              title={`Shared ${numProjectSnippets > 0 ? ` (${numProjectSnippets})` : ''}`}
            />
            <InnerSideMenuCollapsibleContent className="group-data-[state=open]:pt-2">
              {isLoadingSharedSqlSnippets ? (
                <SQLEditorLoadingSnippets />
              ) : sharedSnippets.length === 0 ? (
                <InnerSideBarEmptyPanel
                  className="mx-2"
                  title="No shared queries"
                  description="Share queries with your team by right-clicking on the query."
                />
              ) : (
                <TreeView
                  data={projectSnippetsTreeState}
                  aria-label="project-level-snippets"
                  nodeRenderer={({ element, ...props }) => {
                    const isOpened = Object.values(tabs.tabsMap).some(
                      (tab) => tab.metadata?.sqlId === element.metadata?.id
                    )
                    const tabId = createTabId('sql', {
                      id: element?.metadata?.id as unknown as Snippet['id'],
                    })
                    const isPreview = tabs.previewTabId === tabId
                    const isActive = !isPreview && element.metadata?.id === id
                    const isSelected = selectedSnippets.some((x) => x.id === element.metadata?.id)

                    return (
                      <SQLEditorTreeViewItem
                        {...props}
                        isOpened={isOpened && !isPreview}
                        isSelected={isActive || isSelected}
                        isPreview={isPreview}
                        onDoubleClick={(e) => {
                          e.preventDefault()
                          tabs.makeTabPermanent(tabId)
                        }}
                        element={element}
                        onSelectDelete={() => {
                          setShowDeleteModal(true)
                          setSelectedSnippets([element.metadata as unknown as Snippet])
                        }}
                        onSelectRename={() => {
                          setShowRenameModal(true)
                          setSelectedSnippetToRename(element.metadata as Snippet)
                        }}
                        onSelectDownload={() => {
                          setSelectedSnippetToDownload(element.metadata as Snippet)
                        }}
                        onSelectUnshare={() => {
                          setSelectedSnippetToUnshare(element.metadata as Snippet)
                        }}
                        isLastItem={projectSnippetsLastItemIds.has(element.id as string)}
                        hasNextPage={hasMoreSharedSqlSnippets}
                        fetchNextPage={fetchNextSharedSqlSnippets}
                        isFetchingNextPage={isFetchingMoreSharedSqlSnippets}
                      />
                    )
                  }}
                />
              )}
            </InnerSideMenuCollapsibleContent>
          </InnerSideMenuCollapsible>

          <InnerSideMenuSeparator />

          <InnerSideMenuCollapsible
            className="px-0"
            open={showFavoriteSnippets}
            onOpenChange={(value) => {
              setSectionVisibility({
                ...(sectionVisibility ?? DEFAULT_SECTION_STATE),
                favorite: value,
              })
            }}
          >
            <InnerSideMenuCollapsibleTrigger
              title={`Favorites ${numFavoriteSnippets > 0 ? ` (${numFavoriteSnippets})` : ''}`}
            />
            <InnerSideMenuCollapsibleContent className="group-data-[state=open]:pt-2">
              {isLoadingFavoriteSqlSnippets ? (
                <SQLEditorLoadingSnippets />
              ) : favoriteSnippets.length === 0 ? (
                <InnerSideBarEmptyPanel
                  title="No favorite queries"
                  className="mx-2 px-3"
                  description={
                    <>
                      Save a query to favorites for easy accessibility by clicking the{' '}
                      <Heart size={12} className="inline-block relative align-center -top-[1px]" />{' '}
                      icon.
                    </>
                  }
                />
              ) : (
                <TreeView
                  data={favoritesTreeState}
                  aria-label="favorite-snippets"
                  nodeRenderer={({ element, ...props }) => {
                    const isOpened = Object.values(tabs.tabsMap).some(
                      (tab) => tab.metadata?.sqlId === element.metadata?.id
                    )
                    const tabId = createTabId('sql', {
                      id: element?.metadata?.id as unknown as Snippet['id'],
                    })
                    const isPreview = tabs.previewTabId === tabId
                    const isActive = !isPreview && element.metadata?.id === id
                    const isSelected = selectedSnippets.some((x) => x.id === element.metadata?.id)

                    return (
                      <SQLEditorTreeViewItem
                        {...props}
                        isSelected={isActive || isSelected}
                        isOpened={isOpened && !isPreview}
                        isPreview={isPreview}
                        onDoubleClick={(e) => {
                          e.preventDefault()
                          tabs.makeTabPermanent(tabId)
                        }}
                        element={element}
                        onSelectDelete={() => {
                          setShowDeleteModal(true)
                          setSelectedSnippets([element.metadata as unknown as Snippet])
                        }}
                        onSelectRename={() => {
                          setShowRenameModal(true)
                          setSelectedSnippetToRename(element.metadata as Snippet)
                        }}
                        onSelectDownload={() => {
                          setSelectedSnippetToDownload(element.metadata as Snippet)
                        }}
                        onSelectShare={() => setSelectedSnippetToShare(element.metadata as Snippet)}
                        onSelectUnshare={() => {
                          setSelectedSnippetToUnshare(element.metadata as Snippet)
                        }}
                        isLastItem={favoriteSnippetsLastItemIds.has(element.id as string)}
                        hasNextPage={hasMoreFavoriteSqlSnippets}
                        fetchNextPage={fetchNextFavoriteSqlSnippets}
                        isFetchingNextPage={isFetchingMoreFavoriteSqlSnippets}
                      />
                    )
                  }}
                />
              )}
            </InnerSideMenuCollapsibleContent>
          </InnerSideMenuCollapsible>

          <InnerSideMenuSeparator />
        </>
      )}
      <InnerSideMenuCollapsible
        open={showPrivateSnippets}
        onOpenChange={(value) => {
          setSectionVisibility({ ...(sectionVisibility ?? DEFAULT_SECTION_STATE), private: value })
        }}
        className="px-0"
      >
        <InnerSideMenuCollapsibleTrigger
          title={`PRIVATE
            ${numPrivateSnippets > 0 ? ` (${numPrivateSnippets})` : ''}`}
        />
        <InnerSideMenuCollapsibleContent className="group-data-[state=open]:pt-2">
          {isLoading ? (
            <EditorMenuListSkeleton />
          ) : folders.length === 0 && privateSnippets.length === 0 ? (
            <EmptyPrivateQueriesPanel />
          ) : (
            <TreeView
              multiSelect
              togglableSelect
              clickAction="EXCLUSIVE_SELECT"
              data={privateSnippetsTreeState}
              selectedIds={selectedSnippets.map((x) => x.id)}
              aria-label="private-snippets"
              onExpand={(props) => {
                const folderId = props.element.id.toString()
                if (props.isExpanded && !expandedFolderIds.includes(folderId)) {
                  setExpandedFolderIds([...expandedFolderIds, folderId])
                }
                if (!props.isExpanded && expandedFolderIds.includes(folderId)) {
                  setExpandedFolderIds(expandedFolderIds.filter((x) => x !== folderId))
                }
              }}
              expandedIds={expandedFolderIds}
              nodeRenderer={({ element, ...props }) => {
                const isOpened = Object.values(tabs.tabsMap).some(
                  (tab) => tab.metadata?.sqlId === element.metadata?.id
                )
                const tabId = createTabId('sql', {
                  id: element?.metadata?.id as unknown as Snippet['id'],
                })
                const isPreview = tabs.previewTabId === tabId
                const isActive = !isPreview && element.metadata?.id === id
                const isSelected = selectedSnippets.some((x) => x.id === element.metadata?.id)

                return (
                  <SQLEditorTreeViewItem
                    {...props}
                    element={element}
                    isOpened={isOpened && !isPreview}
                    isSelected={isActive || isSelected}
                    isPreview={isPreview}
                    isMultiSelected={selectedSnippets.length > 1}
                    isLastItem={privateSnippetsLastItemIds.has(element.id as string)}
                    status={props.isBranch ? snapV2.folders[element.id].status : 'idle'}
                    onMultiSelect={onMultiSelect}
                    onSelectCreate={() => {
                      if (profile && project) {
                        const snippet = createSqlSnippetSkeletonV2({
                          name: generateSnippetTitle(),
                          owner_id: profile?.id,
                          project_id: project?.id,
                          folder_id: element.id as string,
                          sql: '',
                        })
                        snapV2.addSnippet({ projectRef: project.ref, snippet })
                        router.push(`/project/${projectRef}/sql/${snippet.id}`)
                      }
                    }}
                    onSelectDelete={() => {
                      if (props.isBranch) {
                        setSelectedFolderToDelete(element.metadata as SnippetFolder)
                      } else {
                        setShowDeleteModal(true)
                        if (selectedSnippets.length === 0) {
                          setSelectedSnippets([element.metadata as unknown as Snippet])
                        }
                      }
                    }}
                    onSelectRename={() => {
                      if (props.isBranch) {
                        snapV2.editFolder(element.id as string)
                      } else {
                        setShowRenameModal(true)
                        setSelectedSnippetToRename(element.metadata as Snippet)
                      }
                    }}
                    onSelectMove={() => {
                      setShowMoveModal(true)
                      if (selectedSnippets.length === 0) {
                        setSelectedSnippets([element.metadata as Snippet])
                      }
                    }}
                    onSelectDownload={() =>
                      setSelectedSnippetToDownload(element.metadata as Snippet)
                    }
                    onSelectShare={() => setSelectedSnippetToShare(element.metadata as Snippet)}
                    onEditSave={(name: string) => {
                      // [Joshen] Inline editing only for folders for now
                      if (name.length === 0 && element.id === 'new-folder') {
                        snapV2.removeFolder(element.id as string)
                      } else if (name.length > 0) {
                        snapV2.saveFolder({ id: element.id as string, name })
                      }
                    }}
                    hasNextPage={hasNextPage}
                    fetchNextPage={fetchNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    sort={sort}
                    onFolderContentsChange={({ isLoading, snippets }) => {
                      setSubResults((prev) => ({
                        ...prev,
                        [element.id as string]: { snippets, isLoading },
                      }))
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault()
                      tabs.makeTabPermanent(tabId)
                    }}
                  />
                )
              }}
            />
          )}
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>

      <InnerSideMenuSeparator />

      <CommunitySnippetsSection />

      <InnerSideMenuSeparator />

      <RenameQueryModal
        snippet={selectedSnippetToRename}
        visible={showRenameModal}
        onCancel={() => setShowRenameModal(false)}
        onComplete={() => setShowRenameModal(false)}
      />

      <MoveQueryModal
        snippets={selectedSnippets}
        visible={showMoveModal}
        onClose={() => {
          setShowMoveModal(false)
          setSelectedSnippets([])
        }}
      />

      <DownloadSnippetModal
        id={selectedSnippetToDownload?.id ?? ''}
        visible={selectedSnippetToDownload !== undefined}
        onCancel={() => setSelectedSnippetToDownload(undefined)}
      />

      <ShareSnippetModal
        snippet={selectedSnippetToShare}
        onClose={() => setSelectedSnippetToShare(undefined)}
        onSuccess={() => setSectionVisibility({ ...sectionVisibility, shared: true })}
      />

      <UnshareSnippetModal
        snippet={selectedSnippetToUnshare}
        onClose={() => setSelectedSnippetToUnshare(undefined)}
        onSuccess={() => setSectionVisibility({ ...sectionVisibility, private: true })}
      />

      <DeleteSnippetsModal
        visible={showDeleteModal}
        snippets={selectedSnippets}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedSnippets([])
        }}
      />

      <ConfirmationModal
        size="small"
        title="Confirm to delete folder"
        confirmLabel="Delete folder"
        confirmLabelLoading="Deleting folder"
        loading={isDeletingFolder}
        visible={selectedFolderToDelete !== undefined}
        variant="destructive"
        onCancel={() => setSelectedFolderToDelete(undefined)}
        onConfirm={onConfirmDeleteFolder}
        alert={{
          title: 'This action cannot be undone',
          description:
            'All SQL snippets within the folder will be permanently removed, and cannot be recovered.',
        }}
      >
        <p className="text-sm">
          Are you sure you want to delete the folder '{selectedFolderToDelete?.name}'?
        </p>
      </ConfirmationModal>
    </DndContext>
  )
}
