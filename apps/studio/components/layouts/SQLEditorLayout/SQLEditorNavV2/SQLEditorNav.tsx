import { useDebounce } from '@uidotdev/usehooks'
import { Eye, EyeOffIcon, Heart, Unlock } from 'lucide-react'
import { useRouter } from 'next/router'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import DownloadSnippetModal from 'components/interfaces/SQLEditor/DownloadSnippetModal'
import { MoveQueryModal } from 'components/interfaces/SQLEditor/MoveQueryModal'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useContentCountQuery } from 'data/content/content-count-query'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { getContentById } from 'data/content/content-id-query'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { useSQLSnippetFoldersDeleteMutation } from 'data/content/sql-folders-delete-mutation'
import { Snippet, SnippetFolder, useSQLSnippetFoldersQuery } from 'data/content/sql-folders-query'
import { useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import uuidv4 from 'lib/uuid'
import {
  SnippetWithContent,
  useSnippetFolders,
  useSqlEditorV2StateSnapshot,
} from 'state/sql-editor-v2'
import { SqlSnippets } from 'types'
import { cn, Separator, TreeView } from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuSeparator,
} from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import SQLEditorLoadingSnippets from './SQLEditorLoadingSnippets'
import { formatFolderResponseForTreeView, getLastItemIds, ROOT_NODE } from './SQLEditorNav.utils'
import { SQLEditorTreeViewItem } from './SQLEditorTreeViewItem'

interface SQLEditorNavProps {
  searchText: string
  sort?: 'inserted_at' | 'name'
  setIsSearching?: Dispatch<SetStateAction<boolean>>
}

export const SQLEditorNav = ({
  searchText: _searchText,
  sort = 'inserted_at',
  setIsSearching,
}: SQLEditorNavProps) => {
  const searchText = _searchText.trim()
  const debouncedSearchText = useDebounce(searchText, 250)
  const isSearching = searchText.length > 0

  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const { ref: projectRef, id } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [mountedId, setMountedId] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showFavoriteSnippets, setShowFavoriteSnippets] = useState(false)
  const [showSharedSnippets, setShowSharedSnippets] = useState(false)
  const [showPrivateSnippets, setShowPrivateSnippets] = useState(true)

  const [defaultExpandedFolderIds, setDefaultExpandedFolderIds] = useState<string[]>()
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
    isLoading,
    isPreviousData,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useSQLSnippetFoldersQuery(
    { projectRef, name: debouncedSearchText, sort },
    { keepPreviousData: true }
  )

  useEffect(() => {
    if (projectRef && privateSnippetsPages) {
      privateSnippetsPages.pages.forEach((page) => {
        page.contents?.forEach((snippet) => {
          snapV2.addSnippet({
            projectRef,
            snippet,
          })
        })

        page.folders?.forEach((folder) => {
          snapV2.addFolder({ projectRef, folder })
        })
      })
    }
  }, [projectRef, privateSnippetsPages?.pages])

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

  const { data: privateSnippetCountData } = useContentCountQuery({
    projectRef,
    type: 'sql',
    visibility: 'user',
    name: debouncedSearchText,
  })
  const numPrivateSnippets = privateSnippets.length

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
      name: debouncedSearchText,
      sort,
    },
    { enabled: showFavoriteSnippets, keepPreviousData: true }
  )

  useEffect(() => {
    if (projectRef === undefined || !isFavoriteSnippetsSuccess) return

    favoriteSqlSnippetsData.pages.forEach((page) => {
      page.contents?.forEach((snippet) => {
        snapV2.addSnippet({
          projectRef,
          snippet,
        })
      })
    })
  }, [projectRef, privateSnippetsPages?.pages])

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

  const { data: favoritedSnippetCountData } = useContentCountQuery({
    projectRef,
    type: 'sql',
    favorite: true,
    name: debouncedSearchText,
  })
  const numFavoriteSnippets = favoriteSnippets.length

  const favoritesTreeState = useMemo(
    () =>
      numFavoriteSnippets === 0
        ? [ROOT_NODE]
        : formatFolderResponseForTreeView({ contents: favoriteSnippets }),
    [favoriteSnippets, numFavoriteSnippets]
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
      name: debouncedSearchText,
      sort,
    },
    { enabled: showSharedSnippets, keepPreviousData: true }
  )

  useEffect(() => {
    if (projectRef === undefined || !isSharedSqlSnippetsSuccess) return

    sharedSqlSnippetsData.pages.forEach((page) => {
      page.contents?.forEach((snippet) => {
        snapV2.addSnippet({
          projectRef,
          snippet,
        })
      })
    })
  }, [projectRef, privateSnippetsPages?.pages])

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

  const { data: sharedSnippetCountData } = useContentCountQuery({
    projectRef,
    type: 'sql',
    visibility: 'project',
    name: debouncedSearchText,
  })
  const numProjectSnippets = sharedSnippets.length

  const projectSnippetsTreeState = useMemo(
    () =>
      numProjectSnippets === 0
        ? [ROOT_NODE]
        : formatFolderResponseForTreeView({ contents: sharedSnippets }),
    [sharedSnippets, numProjectSnippets]
  )

  const projectSnippetsLastItemIds = useMemo(
    () => getLastItemIds(projectSnippetsTreeState),
    [projectSnippetsTreeState]
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
          setShowSharedSnippets(true)
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

  const onSelectCopyPersonal = async (snippet: SnippetWithContent) => {
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
      name: snippet.name,
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
    setIsSearching?.(filteredSnippets.isLoading)
  }, [filteredSnippets.isLoading, setIsSearching])

  useEffect(() => {
    if (snippet !== undefined && !mountedId) {
      if (snippet.visibility === 'project') setShowSharedSnippets(true)
      if (snippet.folder_id) {
        setDefaultExpandedFolderIds([snippet.folder_id])
      }

      // Only want to run this once when loading sql/[id] route
      setMountedId(true)
    }
  }, [snippet, mountedId, sort, debouncedSearchText])

  useEffect(() => {
    // Unselect all snippets whenever opening another snippet
    setSelectedSnippets([])
  }, [id])

  return (
    <>
      <InnerSideMenuSeparator />
      <InnerSideMenuCollapsible
        open={showSharedSnippets}
        onOpenChange={setShowSharedSnippets}
        className="px-0"
      >
        <InnerSideMenuCollapsibleTrigger title={`Shared`} />
        <InnerSideMenuCollapsibleContent className="group-data-[state=open]:pt-2">
          {isLoadingSharedSqlSnippets ? (
            <SQLEditorLoadingSnippets />
          ) : numProjectSnippets === 0 ? (
            <InnerSideBarEmptyPanel
              className={cn('mx-2 px-3', isSearching ? '[&>div>p]:text-foreground-lighter' : '')}
              title={isSearching ? 'No results found based on your search' : 'No shared queries'}
              description={
                isSearching
                  ? undefined
                  : 'Share queries with your team by right-clicking on the query'
              }
            />
          ) : (
            <TreeView
              data={projectSnippetsTreeState}
              aria-label="project-level-snippets"
              nodeRenderer={({ element, ...props }) => (
                <SQLEditorTreeViewItem
                  {...props}
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
                  onSelectCopyPersonal={() => {
                    onSelectCopyPersonal(element.metadata as Snippet)
                  }}
                  onSelectUnshare={() => {
                    setSelectedSnippetToUnshare(element.metadata as Snippet)
                  }}
                  isLastItem={projectSnippetsLastItemIds.has(element.id as string)}
                  hasNextPage={hasMoreSharedSqlSnippets}
                  fetchNextPage={fetchNextSharedSqlSnippets}
                  isFetchingNextPage={isFetchingMoreSharedSqlSnippets}
                />
              )}
            />
          )}
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
      <InnerSideMenuSeparator />

      <InnerSideMenuCollapsible
        className="px-0"
        open={showFavoriteSnippets}
        onOpenChange={setShowFavoriteSnippets}
      >
        <InnerSideMenuCollapsibleTrigger title={`Favorites`} />
        <InnerSideMenuCollapsibleContent className="group-data-[state=open]:pt-2">
          {isLoadingFavoriteSqlSnippets ? (
            <SQLEditorLoadingSnippets />
          ) : numFavoriteSnippets === 0 ? (
            <InnerSideBarEmptyPanel
              title={isSearching ? 'No results found based on your search' : 'No favorite queries'}
              className={cn('mx-2 px-3', isSearching ? '[&>div>p]:text-foreground-lighter' : '')}
              description={
                isSearching ? null : (
                  <>
                    Save a query to favorites for easy accessibility by clicking the{' '}
                    <Heart size={12} className="inline-block relative align-center -top-[1px]" />{' '}
                    icon.
                  </>
                )
              }
            />
          ) : (
            <TreeView
              data={favoritesTreeState}
              aria-label="favorite-snippets"
              nodeRenderer={({ element, ...props }) => (
                <SQLEditorTreeViewItem
                  {...props}
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
                  onSelectCopyPersonal={() => {
                    onSelectCopyPersonal(element.metadata as Snippet)
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
              )}
            />
          )}
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
      <InnerSideMenuSeparator />

      <InnerSideMenuCollapsible
        open={showPrivateSnippets}
        onOpenChange={setShowPrivateSnippets}
        className="px-0"
      >
        <InnerSideMenuCollapsibleTrigger title={`PRIVATE`} />
        <InnerSideMenuCollapsibleContent className="group-data-[state=open]:pt-2">
          {isLoading ? (
            <SQLEditorLoadingSnippets />
          ) : folders.length === 0 && numPrivateSnippets === 0 ? (
            <InnerSideBarEmptyPanel
              className="mx-3 px-4"
              title="No queries created yet"
              description="Queries will be automatically saved once you start writing in the editor"
            />
          ) : (
            <TreeView
              multiSelect
              togglableSelect
              clickAction="EXCLUSIVE_SELECT"
              data={privateSnippetsTreeState}
              selectedIds={selectedSnippets.map((x) => x.id)}
              aria-label="private-snippets"
              expandedIds={defaultExpandedFolderIds}
              nodeRenderer={({ element, ...props }) => (
                <SQLEditorTreeViewItem
                  {...props}
                  element={element}
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
                  onSelectDownload={() => setSelectedSnippetToDownload(element.metadata as Snippet)}
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
                  name={debouncedSearchText}
                  onFolderContentsChange={({ isLoading, snippets }) => {
                    setSubResults((prev) => ({
                      ...prev,
                      [element.id as string]: { snippets, isLoading },
                    }))
                  }}
                />
              )}
            />
          )}
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>

      <Separator />

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
