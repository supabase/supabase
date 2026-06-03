import { keepPreviousData } from '@tanstack/react-query'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useParams } from 'common'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  InnerSideBarEmptyPanel,
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
} from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { ChatSection } from './ChatSection'
import { DeleteSnippetsModal } from './DeleteSnippetsModal'
import { NotebookSection } from './NotebookSection'
import { PrivateSnippetsNav } from './PrivateSnippetsNav'
import { ShareSnippetModal } from './ShareSnippetModal'
import { SnippetNavList } from './SnippetNavList'
import { SQLEditorLoadingSnippets } from './SQLEditorLoadingSnippets'
import {
  DEFAULT_SECTION_STATE,
  SQL_EDITOR_NAV_SECTION_TRIGGER_CLASSNAME,
  SQL_EDITOR_NAV_TOP_LEVEL_SECTION_CLASSNAME,
  type SectionState,
} from './SQLEditorNav.constants'
import { SqlEditorNavFolder } from './SqlEditorNavFolder'
import { SQLEditorSectionActions } from './SQLEditorSectionActions'
import { UnshareSnippetModal } from './UnshareSnippetModal'
import { useSqlEditorCreateActions } from './useSqlEditorCreateActions'
import { DownloadSnippetModal } from '@/components/interfaces/SQLEditor/DownloadSnippetModal'
import { MoveQueryModal } from '@/components/interfaces/SQLEditor/MoveQueryModal'
import { RenameQueryModal } from '@/components/interfaces/SQLEditor/RenameQueryModal'
import { generateSnippetTitle } from '@/components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from '@/components/interfaces/SQLEditor/SQLEditor.utils'
import { mergeSnippetsWithLogSql } from '@/components/interfaces/SQLEditor/sqlSnippet.utils'
import { EmptyPrivateQueriesPanel } from '@/components/layouts/SQLEditorLayout/PrivateSqlSnippetEmpty'
import { EditorMenuListSkeleton } from '@/components/layouts/TableEditorLayout/EditorMenuListSkeleton'
import { useSqlEditorTabsCleanup } from '@/components/layouts/Tabs/Tabs.utils'
import { useContentCountQuery } from '@/data/content/content-count-query'
import { useContentDeleteMutation } from '@/data/content/content-delete-mutation'
import { useContentQuery } from '@/data/content/content-query'
import { useSQLSnippetFoldersDeleteMutation } from '@/data/content/sql-folders-delete-mutation'
import { Snippet, SnippetFolder, useSQLSnippetFoldersQuery } from '@/data/content/sql-folders-query'
import { useSqlSnippetsQuery, type SqlSnippet } from '@/data/content/sql-snippets-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useLocalStorage } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProfile } from '@/lib/profile'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import {
  useSnippetFolders,
  useSqlEditorV2StateSnapshot,
  type SnippetWithContent,
} from '@/state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

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
  const assistant = useAiAssistantStateSnapshot()
  const addSnippet = snapV2.addSnippet

  const [sectionVisibility, setSectionVisibility] = useLocalStorage<SectionState>(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_SECTION_STATE(projectRef ?? ''),
    DEFAULT_SECTION_STATE
  )
  const mergedSectionVisibility = useMemo(
    () => ({ ...DEFAULT_SECTION_STATE, ...sectionVisibility }),
    [sectionVisibility]
  )
  const {
    snippets: showSnippets,
    shared: showSharedSnippets,
    favorite: showFavoriteSnippets,
    private: showPrivateSnippets,
    reports: showReports,
    chats: showChats,
  } = mergedSectionVisibility
  const isSharedSnippetsEnabled = showSnippets && showSharedSnippets
  const isFavoriteSnippetsEnabled = showSnippets && showFavoriteSnippets
  const { reportsAll } = useIsFeatureEnabled(['reports:all'])
  const showNotebookSection = IS_PLATFORM && reportsAll
  const { canCreateSQLSnippet, createNewFolder, createNewSnippet } = useSqlEditorCreateActions()

  const { data: notebooksData } = useContentQuery(
    {
      projectRef,
      type: 'report',
    },
    { enabled: showNotebookSection }
  )

  const notebooksInView = useMemo(
    () =>
      (notebooksData?.content ?? [])
        .filter((report) => {
          const notebookContent = report.content as { meta?: { role?: string } } | undefined
          return notebookContent?.meta?.role !== 'home' && report.name !== 'Home'
        })
        .map((report) => ({ id: report.id, name: report.name })),
    [notebooksData?.content]
  )

  const chatsInView = useMemo(
    () => Object.values(assistant.chats).map((chat) => ({ id: chat.id, name: chat.name })),
    [assistant.chats]
  )

  const { data: logSqlSnippetsData } = useContentQuery(
    { projectRef, type: 'log_sql', limit: 100 },
    {
      enabled:
        IS_PLATFORM &&
        showSnippets &&
        (showPrivateSnippets || showSharedSnippets || showFavoriteSnippets),
    }
  )
  const logSqlSnippets = useMemo(() => logSqlSnippetsData?.content ?? [], [logSqlSnippetsData])

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

    if (
      snippet &&
      snippet.visibility === 'user' &&
      !snippet.isNotSavedInDatabaseYet &&
      !snippetInfo.snippetIds.has(snippet.id)
    ) {
      snippetInfo.snippetIds.add(snippet.id)
      snippetInfo.snippets = [...snippetInfo.snippets, snippet]
    }

    return snippetInfo
  }, [privateSnippetsPages?.pages, subResults, isLoading, isPlaceholderData, isFetching, snippet])

  const privateSnippets = useMemo(() => {
    const userSnippets =
      filteredSnippets.snippets?.filter((snippet) => snippet.visibility === 'user') ?? []

    return mergeSnippetsWithLogSql(
      userSnippets,
      logSqlSnippets.filter((snippet) => snippet.visibility === 'user')
    ).sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      else return new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
    })
  }, [filteredSnippets.snippets, logSqlSnippets, sort])
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

  const validExpandedFolderIds = useMemo(
    () => expandedFolderIds.filter((id) => folders.some((folder) => folder.id === id)),
    [expandedFolderIds, folders]
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
    { enabled: isFavoriteSnippetsEnabled, placeholderData: keepPreviousData }
  )

  const favoriteSnippets = useMemo(() => {
    let snippets = favoriteSqlSnippetsData?.pages.flatMap((page) => page.contents ?? []) ?? []

    if (
      snippet &&
      snippet.favorite &&
      !snippet.isNotSavedInDatabaseYet &&
      !snippets.find((x) => x.id === snippet.id)
    ) {
      snippets.push(snippet as SqlSnippet)
    }

    const withLogSqlFavorites = mergeSnippetsWithLogSql(
      snippets,
      logSqlSnippets.filter((item) => item.favorite)
    )

    return (
      withLogSqlFavorites
        .map((snippet) => ({ ...snippet, folder_id: undefined }))
        .sort((a, b) => {
          if (sort === 'name') return a.name.localeCompare(b.name)
          else return new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
        }) ?? []
    )
  }, [favoriteSqlSnippetsData?.pages, snippet, sort, logSqlSnippets])

  const numFavoriteSnippets = snippetCountData?.favorites ?? 0

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
    { enabled: isSharedSnippetsEnabled, placeholderData: keepPreviousData }
  )

  const sharedSnippets = useMemo(() => {
    let snippets = mergeSnippetsWithLogSql(
      sharedSqlSnippetsData?.pages.flatMap((page) => page.contents ?? []) ?? [],
      logSqlSnippets.filter((snippet) => snippet.visibility === 'project')
    )

    if (
      snippet &&
      snippet.visibility === 'project' &&
      !snippet.isNotSavedInDatabaseYet &&
      !snippets.find((x) => x.id === snippet.id)
    ) {
      snippets.push(snippet as SqlSnippet)
    }

    return (
      snippets.sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        else return new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
      }) ?? []
    )
  }, [sharedSqlSnippetsData?.pages, snippet, sort, logSqlSnippets])

  const numProjectSnippets = snippetCountData?.shared ?? 0
  const numTotalSnippets =
    numPrivateSnippets + numFavoriteSnippets + (IS_PLATFORM ? numProjectSnippets : 0)

  const allSnippetsInView = useMemo(
    () => [
      ...(privateSnippetsPages?.pages.flatMap((x) => x.contents) ?? []),
      ...(sharedSqlSnippetsData?.pages.flatMap((x) => x.contents) ?? []),
      ...logSqlSnippets,
    ],
    [privateSnippetsPages, sharedSqlSnippetsData, logSqlSnippets]
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
      const nextSectionVisibility = { ...mergedSectionVisibility, snippets: true }
      if (snippet.visibility === 'project') {
        nextSectionVisibility.shared = true
      } else if (snippet.visibility === 'user') {
        nextSectionVisibility.private = true
      }
      if (snippet.favorite) {
        nextSectionVisibility.favorite = true
      }
      setSectionVisibility(nextSectionVisibility)
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

  useEffect(() => {
    if (projectRef === undefined) return

    logSqlSnippets.forEach((snippet) => {
      addSnippet({ projectRef, snippet: snippet as unknown as SnippetWithContent })
    })
  }, [addSnippet, projectRef, logSqlSnippets])

  const sqlEditorTabsCleanup = useSqlEditorTabsCleanup()
  useEffect(() => {
    if (isSuccess) {
      sqlEditorTabsCleanup({
        snippets: allSnippetsInView as any,
        notebooks: notebooksInView,
        chats: chatsInView,
      })
    }
  }, [allSnippetsInView, chatsInView, isSuccess, notebooksInView, sqlEditorTabsCleanup])

  const activeSnippetId = id as string | undefined
  const isSnippetPreview = (snippetId: string) =>
    tabs.previewTabId === createTabId('sql', { id: snippetId })

  const handleSnippetDelete = (snippet: Snippet) => {
    setShowDeleteModal(true)
    setSelectedSnippets([snippet])
  }

  const handleSnippetRename = (snippet: Snippet) => {
    setShowRenameModal(true)
    setSelectedSnippetToRename(snippet)
  }

  const handleSnippetMove = (snippet: Snippet) => {
    setShowMoveModal(true)
    if (selectedSnippets.length === 0) {
      setSelectedSnippets([snippet])
    }
  }

  const handleSnippetShare = (snippet: Snippet) => {
    setSelectedSnippetToShare(snippet)
  }

  const handleSnippetUnshare = (snippet: Snippet) => {
    setSelectedSnippetToUnshare(snippet)
  }

  const handleSnippetDownload = (snippet: Snippet) => {
    setSelectedSnippetToDownload(snippet)
  }

  const snippetListProps = {
    activeSnippetId,
    isPreviewTabId: isSnippetPreview,
    selectedSnippets,
    onSnippetDelete: handleSnippetDelete,
    onSnippetRename: handleSnippetRename,
    onSnippetMove: handleSnippetMove,
    onSnippetShare: handleSnippetShare,
    onSnippetUnshare: handleSnippetUnshare,
    onSnippetDownload: handleSnippetDownload,
  }

  return (
    <>
      <InnerSideMenuCollapsible
        className={SQL_EDITOR_NAV_TOP_LEVEL_SECTION_CLASSNAME}
        open={showSnippets}
        onOpenChange={(value) => {
          setSectionVisibility({
            ...mergedSectionVisibility,
            snippets: value,
          })
        }}
      >
        <InnerSideMenuCollapsibleTrigger
          className={SQL_EDITOR_NAV_SECTION_TRIGGER_CLASSNAME}
          title={`Snippets${numTotalSnippets > 0 ? ` (${numTotalSnippets})` : ''}`}
        />
        <InnerSideMenuCollapsibleContent className="group-data-open:pt-1 flex flex-col gap-0.5">
          {IS_PLATFORM && (
            <SqlEditorNavFolder
              open={showSharedSnippets}
              onOpenChange={(value) => {
                setSectionVisibility({
                  ...mergedSectionVisibility,
                  shared: value,
                })
              }}
              title={`Shared${numProjectSnippets > 0 ? ` (${numProjectSnippets})` : ''}`}
              actions={
                <SQLEditorSectionActions
                  onNewSnippet={() => void createNewSnippet('shared')}
                  canCreateSnippet={canCreateSQLSnippet}
                  newSnippetTestId="sql-editor-shared-new-snippet-button"
                />
              }
            >
              {isLoadingSharedSqlSnippets ? (
                <SQLEditorLoadingSnippets />
              ) : sharedSnippets.length === 0 ? (
                <InnerSideBarEmptyPanel
                  className="mx-2"
                  title="No shared queries"
                  description="Share queries with your team by right-clicking on the query."
                />
              ) : (
                <SnippetNavList
                  snippets={sharedSnippets}
                  depth={1}
                  {...snippetListProps}
                  onSnippetUnshare={handleSnippetUnshare}
                  hasNextPage={hasMoreSharedSqlSnippets}
                  fetchNextPage={fetchNextSharedSqlSnippets}
                  isFetchingNextPage={isFetchingMoreSharedSqlSnippets}
                />
              )}
            </SqlEditorNavFolder>
          )}

          {IS_PLATFORM && (
            <SqlEditorNavFolder
              open={showFavoriteSnippets}
              onOpenChange={(value) => {
                setSectionVisibility({
                  ...mergedSectionVisibility,
                  favorite: value,
                })
              }}
              title={`Favorites${numFavoriteSnippets > 0 ? ` (${numFavoriteSnippets})` : ''}`}
              actions={
                <SQLEditorSectionActions
                  onNewSnippet={() => void createNewSnippet('favorite')}
                  canCreateSnippet={canCreateSQLSnippet}
                  newSnippetTestId="sql-editor-favorites-new-snippet-button"
                />
              }
            >
              {isLoadingFavoriteSqlSnippets ? (
                <SQLEditorLoadingSnippets />
              ) : favoriteSnippets.length === 0 ? (
                <InnerSideBarEmptyPanel
                  title="No favorite queries"
                  className="mx-2 px-3"
                  description={
                    <>
                      Save a query to favorites for easy accessibility by clicking the{' '}
                      <Heart size={12} className="inline-block relative align-center -top-px" />{' '}
                      icon.
                    </>
                  }
                />
              ) : (
                <SnippetNavList
                  snippets={favoriteSnippets}
                  depth={1}
                  {...snippetListProps}
                  hasNextPage={hasMoreFavoriteSqlSnippets}
                  fetchNextPage={fetchNextFavoriteSqlSnippets}
                  isFetchingNextPage={isFetchingMoreFavoriteSqlSnippets}
                />
              )}
            </SqlEditorNavFolder>
          )}

          <SqlEditorNavFolder
            open={showPrivateSnippets}
            onOpenChange={(value) => {
              setSectionVisibility({ ...mergedSectionVisibility, private: value })
            }}
            title={`Private${numPrivateSnippets > 0 ? ` (${numPrivateSnippets})` : ''}`}
            actions={
              <SQLEditorSectionActions
                onNewSnippet={() => void createNewSnippet('private')}
                onNewFolder={createNewFolder}
                canCreateSnippet={canCreateSQLSnippet}
                newSnippetTestId="sql-editor-new-query-button"
                newFolderTestId="sql-editor-private-new-folder-button"
              />
            }
          >
            {isLoading ? (
              <EditorMenuListSkeleton />
            ) : folders.length === 0 && privateSnippets.length === 0 ? (
              <EmptyPrivateQueriesPanel />
            ) : (
              <PrivateSnippetsNav
                folders={folders}
                snippets={privateSnippets}
                sort={sort}
                expandedFolderIds={validExpandedFolderIds}
                onExpandedFolderIdsChange={setExpandedFolderIds}
                selectedSnippets={selectedSnippets}
                activeSnippetId={activeSnippetId}
                previewTabId={tabs.previewTabId}
                onMultiSelect={onMultiSelect}
                onSelectCreateInFolder={(folderId) => {
                  if (profile && project) {
                    const newSnippet = createSqlSnippetSkeletonV2({
                      name: generateSnippetTitle(),
                      owner_id: profile.id,
                      project_id: project.id,
                      folder_id: folderId,
                      sql: '',
                    })
                    snapV2.addSnippet({ projectRef: project.ref, snippet: newSnippet })
                    router.push(`/project/${projectRef}/sql/${newSnippet.id}`)
                  }
                }}
                onSelectDeleteFolder={setSelectedFolderToDelete}
                onSelectRenameFolder={(folderId) => snapV2.editFolder(folderId)}
                onEditSaveFolder={(folderId, name) => {
                  if (name.length === 0 && folderId === 'new-folder') {
                    snapV2.removeFolder(folderId)
                  } else if (name.length > 0) {
                    snapV2.saveFolder({ id: folderId, name })
                  }
                }}
                onFolderContentsChange={(folderId, info) => {
                  setSubResults((prev) => ({
                    ...prev,
                    [folderId]: info,
                  }))
                }}
                onSnippetDelete={handleSnippetDelete}
                onSnippetRename={handleSnippetRename}
                onSnippetMove={handleSnippetMove}
                onSnippetShare={handleSnippetShare}
                onSnippetDownload={handleSnippetDownload}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
              />
            )}
          </SqlEditorNavFolder>
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>

      {showNotebookSection && (
        <NotebookSection
          open={showReports}
          onOpenChange={(value) => {
            setSectionVisibility({ ...mergedSectionVisibility, reports: value })
          }}
        />
      )}

      <ChatSection
        open={showChats}
        onOpenChange={(value) => {
          setSectionVisibility({ ...mergedSectionVisibility, chats: value })
        }}
      />

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
        open={selectedSnippetToDownload !== undefined}
        onOpenChange={() => setSelectedSnippetToDownload(undefined)}
      />

      <ShareSnippetModal
        snippet={selectedSnippetToShare}
        onClose={() => setSelectedSnippetToShare(undefined)}
        onSuccess={() =>
          setSectionVisibility({ ...mergedSectionVisibility, snippets: true, shared: true })
        }
      />

      <UnshareSnippetModal
        snippet={selectedSnippetToUnshare}
        onClose={() => setSelectedSnippetToUnshare(undefined)}
        onSuccess={() =>
          setSectionVisibility({ ...mergedSectionVisibility, snippets: true, private: true })
        }
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
    </>
  )
}
