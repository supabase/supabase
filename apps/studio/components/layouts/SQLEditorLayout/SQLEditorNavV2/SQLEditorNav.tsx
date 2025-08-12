import { Eye, EyeOffIcon, Heart, Unlock } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import DownloadSnippetModal from 'components/interfaces/SQLEditor/DownloadSnippetModal'
import { MoveQueryModal } from 'components/interfaces/SQLEditor/MoveQueryModal'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { EmptyPrivateQueriesPanel } from 'components/layouts/SQLEditorLayout/PrivateSqlSnippetEmpty'
import EditorMenuListSkeleton from 'components/layouts/TableEditorLayout/EditorMenuListSkeleton'
import { useSqlEditorTabsCleanup } from 'components/layouts/Tabs/Tabs.utils'
import { useContentCountQuery } from 'data/content/content-count-query'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { getContentById } from 'data/content/content-id-query'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { useSQLSnippetFoldersDeleteMutation } from 'data/content/sql-folders-delete-mutation'
import { Snippet, SnippetFolder, useSQLSnippetFoldersQuery } from 'data/content/sql-folders-query'
import { useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import uuidv4 from 'lib/uuid'
import {
  SnippetWithContent,
  useSnippetFolders,
  useSqlEditorV2StateSnapshot,
} from 'state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import { SqlSnippets } from 'types'
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
import SQLEditorLoadingSnippets from './SQLEditorLoadingSnippets'
import { DEFAULT_SECTION_STATE, type SectionState } from './SQLEditorNav.constants'
import { formatFolderResponseForTreeView, getLastItemIds, ROOT_NODE } from './SQLEditorNav.utils'
import { SQLEditorTreeViewItem } from './SQLEditorTreeViewItem'

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
    isPreviousData,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useSQLSnippetFoldersQuery({ projectRef, sort }, { keepPreviousData: true })

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
        isLoading: isLoading || (isPreviousData && isFetching),
        snippetIds: new Set<string>(rootSnippets.map((snippet) => snippet.id)),
      }
    )

    if (snippet && snippet.visibility === 'user' && !snippetInfo.snippetIds.has(snippet.id)) {
      snippetInfo.snippetIds.add(snippet.id)
      snippetInfo.snippets = [...snippetInfo.snippets, snippet]
    }

    return snippetInfo
  }, [privateSnippetsPages?.pages, subResults, isLoading, isPreviousData, isFetching, snippet])

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
  const folders = useSnippetFolders(projectRef as string)

  const { data: snippetCountData } = useContentCountQuery({
    projectRef,
    type: 'sql',
  })
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
    isLoading: isLoadingFavoriteSqlSnippets,
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
    { enabled: showFavoriteSnippets, keepPreviousData: true }
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
    { enabled: showSharedSnippets, keepPreviousData: true }
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

  const { mutate: upsertContent, isLoading: isUpserting } = useContentUpsertMutation({
    onError: (error) => {
      toast.error(`Failed to update query: ${error.message}`)
    },
  })

  const { mutate: deleteContent, isLoading: isDeleting } = useContentDeleteMutation({
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

  const { mutate: deleteFolder, isLoading: isDeletingFolder } = useSQLSnippetFoldersDeleteMutation({
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

  const onConfirmDelete = () => {
    if (!projectRef) return console.error('Project ref is required')
    deleteContent(
      { projectRef, ids: selectedSnippets.map((x) => x.id) },
      {
        onSuccess: (data) => {
          toast.success(
            `Successfully deleted ${selectedSnippets.length.toLocaleString()} quer${selectedSnippets.length > 1 ? 'ies' : 'y'}`
          )
          postDeleteCleanup(data)
        },
      }
    )
  }

  const onUpdateVisibility = async (action: 'share' | 'unshare') => {
    const snippet = action === 'share' ? selectedSnippetToShare : selectedSnippetToUnshare
    if (!projectRef) return console.error('Project ref is required')
    if (!snippet) return console.error('Snippet ID is required')

    const storeSnippet = snapV2.snippets[snippet.id]
    let snippetContent = storeSnippet?.snippet?.content

    if (snippetContent === undefined) {
      const { content } = await getContentById({ projectRef, id: snippet.id })
      snippetContent = content as unknown as SqlSnippets.Content
    }

    // [Joshen] Just as a final check - to ensure that the content is minimally there (empty string is fine)
    if (snippetContent === undefined) {
      return toast.error('Unable to update snippet visibility: Content is missing')
    }

    const visibility = action === 'share' ? 'project' : 'user'

    upsertContent(
      {
        projectRef,
        payload: {
          ...snippet,
          visibility,
          folder_id: null,
          content: snippetContent,
        },
      },
      {
        onSuccess: () => {
          setSelectedSnippetToShare(undefined)
          setSelectedSnippetToUnshare(undefined)
          setSectionVisibility({ ...sectionVisibility, shared: true })
          snapV2.updateSnippet({
            id: snippet.id,
            snippet: { visibility, folder_id: null },
            skipSave: true,
          })
          toast.success(
            action === 'share'
              ? 'Snippet is now shared to the project'
              : 'Snippet is now unshared from the project'
          )
        },
      }
    )
  }

  const onSelectDuplicate = async (snippet: SnippetWithContent) => {
    if (!profile) return console.error('Profile is required')
    if (!project) return console.error('Project is required')
    if (!projectRef) return console.error('Project ref is required')
    if (!id) return console.error('Snippet ID is required')

    let sql: string = ''
    if (snippet.content && snippet.content.sql) {
      sql = snippet.content.sql
    } else {
      // Fetch the content first
      const { content } = await getContentById({ projectRef, id: snippet.id })
      if ('sql' in content) {
        sql = content.sql
      }
    }

    const snippetCopy = createSqlSnippetSkeletonV2({
      id: uuidv4(),
      name: `${snippet.name} (Duplicate)`,
      sql,
      owner_id: profile?.id,
      project_id: project?.id,
    })

    snapV2.addSnippet({ projectRef, snippet: snippetCopy })
    snapV2.addNeedsSaving(snippetCopy.id!)
    router.push(`/project/${projectRef}/sql/${snippetCopy.id}`)
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
    if (projectRef && privateSnippetsPages) {
      privateSnippetsPages.pages.forEach((page) => {
        page.contents?.forEach((snippet: Snippet) => {
          snapV2.addSnippet({ projectRef, snippet })
        })
        page.folders?.forEach((folder: SnippetFolder) => snapV2.addFolder({ projectRef, folder }))
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
    <>
      <InnerSideMenuSeparator />

      <InnerSideMenuCollapsible
        className="px-0"
        open={showSharedSnippets}
        onOpenChange={(value) => {
          setSectionVisibility({ ...(sectionVisibility ?? DEFAULT_SECTION_STATE), shared: value })
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
                    onSelectDuplicate={() => {
                      onSelectDuplicate(element.metadata as Snippet)
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
          setSectionVisibility({ ...(sectionVisibility ?? DEFAULT_SECTION_STATE), favorite: value })
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
                    onSelectDuplicate={() => {
                      onSelectDuplicate(element.metadata as Snippet)
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
                          id: uuidv4(),
                          name: untitledSnippetTitle,
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
                    onSelectDuplicate={() => onSelectDuplicate(element.metadata as Snippet)}
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

      <ConfirmationModal
        size="medium"
        loading={isUpserting}
        title={`Confirm to share query: ${selectedSnippetToShare?.name}`}
        confirmLabel="Share query"
        confirmLabelLoading="Sharing query"
        visible={selectedSnippetToShare !== undefined}
        onCancel={() => setSelectedSnippetToShare(undefined)}
        onConfirm={() => onUpdateVisibility('share')}
        alert={{
          title: 'This SQL query will become public to all team members',
          description: 'Anyone with access to the project can view it',
        }}
      >
        <ul className="text-sm text-foreground-light space-y-5">
          <li className="flex gap-3 items-center">
            <Eye size={16} />
            <span>Project members will have read-only access to this query.</span>
          </li>
          <li className="flex gap-3 items-center">
            <Unlock size={16} />
            <span>Anyone will be able to duplicate it to their personal snippets.</span>
          </li>
        </ul>
      </ConfirmationModal>

      <ConfirmationModal
        size="medium"
        title={`Confirm to unshare query: ${selectedSnippetToUnshare?.name}`}
        confirmLabel="Unshare query"
        confirmLabelLoading="Unsharing query"
        visible={selectedSnippetToUnshare !== undefined}
        onCancel={() => setSelectedSnippetToUnshare(undefined)}
        onConfirm={() => onUpdateVisibility('unshare')}
        alert={{
          title: 'This SQL query will no longer be public to all team members',
          description: 'Only you will have access to this query',
        }}
      >
        <ul className="text-sm text-foreground-light space-y-5">
          <li className="flex gap-3">
            <EyeOffIcon />
            <span>Project members will no longer be able to view this query.</span>
          </li>
        </ul>
      </ConfirmationModal>

      <ConfirmationModal
        size="small"
        title={`Confirm to delete ${selectedSnippets.length === 1 ? 'query' : `${selectedSnippets.length.toLocaleString()} quer${selectedSnippets.length > 1 ? 'ies' : 'y'}`}`}
        confirmLabel={`Delete ${selectedSnippets.length.toLocaleString()} quer${selectedSnippets.length > 1 ? 'ies' : 'y'}`}
        confirmLabelLoading="Deleting query"
        loading={isDeleting}
        visible={showDeleteModal}
        variant="destructive"
        onCancel={() => {
          setShowDeleteModal(false)
          setSelectedSnippets([])
        }}
        onConfirm={onConfirmDelete}
        alert={
          (selectedSnippets[0]?.visibility as unknown as string) === 'project'
            ? {
                title: 'This SQL snippet will be lost forever',
                description:
                  'Deleting this query will remove it for all members of the project team.',
              }
            : undefined
        }
      >
        <p className="text-sm">
          This action cannot be undone.{' '}
          {selectedSnippets.length === 1
            ? `Are you sure you want to delete '${selectedSnippets[0]?.name}'?`
            : `Are you sure you want to delete the selected ${selectedSnippets.length} quer${selectedSnippets.length > 1 ? 'ies' : 'y'}?`}
        </p>
      </ConfirmationModal>

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
    </>
  )
}
