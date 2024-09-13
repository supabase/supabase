import { ChevronRight, Eye, EyeOffIcon, Heart, Unlock } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
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
import { useSQLSnippetFoldersDeleteMutation } from 'data/content/sql-folders-delete-mutation'
import {
  Snippet,
  SnippetDetail,
  SnippetFolder,
  getSQLSnippetFolders,
  useSQLSnippetFoldersQuery,
} from 'data/content/sql-folders-query'
import { useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import uuidv4 from 'lib/uuid'
import {
  useFavoriteSnippets,
  useSnippetFolders,
  useSnippets,
  useSqlEditorV2StateSnapshot,
} from 'state/sql-editor-v2'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  Separator,
  TreeView,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { ROOT_NODE, formatFolderResponseForTreeView } from './SQLEditorNav.utils'
import { SQLEditorTreeViewItem } from './SQLEditorTreeViewItem'

interface SQLEditorNavProps {
  searchText: string
}

export const SQLEditorNav = ({ searchText: _searchText }: SQLEditorNavProps) => {
  const searchText = _searchText.trim()
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const { ref: projectRef, id } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const [sort] = useLocalStorage<'name' | 'inserted_at'>('sql-editor-sort', 'inserted_at')

  const [mountedId, setMountedId] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showFavouriteSnippets, setShowFavouriteSnippets] = useState(false)
  const [showSharedSnippets, setShowSharedSnippets] = useState(false)
  const [showPrivateSnippets, setShowPrivateSnippets] = useState(true)

  const [defaultExpandedFolderIds, setDefaultExpandedFolderIds] = useState<string[]>()
  const [selectedSnippets, setSelectedSnippets] = useState<Snippet[]>([])
  const [selectedSnippetToShare, setSelectedSnippetToShare] = useState<Snippet>()
  const [selectedSnippetToUnshare, setSelectedSnippetToUnshare] = useState<Snippet>()
  const [selectedSnippetToRename, setSelectedSnippetToRename] = useState<Snippet>()
  const [selectedSnippetToDownload, setSelectedSnippetToDownload] = useState<Snippet>()
  const [selectedFolderToDelete, setSelectedFolderToDelete] = useState<SnippetFolder>()

  const COLLAPSIBLE_TRIGGER_CLASS_NAMES =
    'flex items-center gap-x-2 px-4 [&[data-state=open]>svg]:!rotate-90'
  const COLLAPSIBLE_ICON_CLASS_NAMES = 'text-foreground-light transition-transform duration-200'
  const COLLASIBLE_HEADER_CLASS_NAMES = 'text-foreground-light font-mono text-sm uppercase'

  // =======================================================
  // [Joshen] Set up favorites, shared, and private snippets
  // =======================================================
  const snippets = useSnippets(projectRef as string)
  const folders = useSnippetFolders(projectRef as string)
  const contents = snippets.filter((x) =>
    searchText.length > 0 ? x.name.toLowerCase().includes(searchText.toLowerCase()) : true
  )
  const snippet = snapV2.snippets[id as string]?.snippet

  const privateSnippets = contents.filter((snippet) => snippet.visibility === 'user')
  const numPrivateSnippets = snapV2.privateSnippetCount[projectRef as string]
  const privateSnippetsTreeState =
    folders.length === 0 && snippets.length === 0
      ? [ROOT_NODE]
      : formatFolderResponseForTreeView({ folders, contents: privateSnippets })

  const favoriteSnippets = useFavoriteSnippets(projectRef as string)
  const numFavoriteSnippets = favoriteSnippets.length
  const favoritesTreeState =
    numFavoriteSnippets === 0
      ? [ROOT_NODE]
      : formatFolderResponseForTreeView({ contents: favoriteSnippets as any })

  const projectSnippets = contents.filter((snippet) => snippet.visibility === 'project')
  const numProjectSnippets = projectSnippets.length
  const projectSnippetsTreeState =
    numProjectSnippets === 0
      ? [ROOT_NODE]
      : formatFolderResponseForTreeView({ contents: projectSnippets })

  // =================================
  // [Joshen] React Queries
  // =================================

  useSQLSnippetFoldersQuery(
    { projectRef },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (projectRef !== undefined) {
          snapV2.initializeRemoteSnippets({ projectRef, data, sort })
        }
      },
    }
  )

  useSqlSnippetsQuery(projectRef, {
    onSuccess(data) {
      if (projectRef !== undefined) {
        const favoriteSnippets = data.snippets.filter((snippet) => snippet.content.favorite)
        snapV2.initializeFavoriteSnippets({ projectRef, snippets: favoriteSnippets })
      }
    },
  })

  useContentCountQuery(
    { projectRef, type: 'sql' },
    {
      onSuccess(data) {
        if (projectRef !== undefined) {
          snapV2.setPrivateSnippetCount({ projectRef, value: data.count })
        }
      },
    }
  )

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

  // =================================
  // [Joshen] UI functions
  // =================================

  const postDeleteCleanup = (ids: string[]) => {
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

  const onConfirmShare = () => {
    if (!selectedSnippetToShare) return console.error('Snippet ID is required')
    snapV2.shareSnippet(selectedSnippetToShare.id, 'project')
    setSelectedSnippetToShare(undefined)
    setShowSharedSnippets(true)

    if (projectRef !== undefined) {
      snapV2.setPrivateSnippetCount({
        projectRef,
        value: snapV2.privateSnippetCount[projectRef] - 1,
      })
    }
  }

  const onConfirmUnshare = () => {
    if (!selectedSnippetToUnshare) return console.error('Snippet ID is required')
    snapV2.shareSnippet(selectedSnippetToUnshare.id, 'user')
    setSelectedSnippetToUnshare(undefined)
    setShowPrivateSnippets(true)

    if (projectRef !== undefined) {
      snapV2.setPrivateSnippetCount({
        projectRef,
        value: snapV2.privateSnippetCount[projectRef] + 1,
      })
    }
  }

  const onSelectCopyPersonal = async (snippet: Snippet) => {
    if (!profile) return console.error('Profile is required')
    if (!project) return console.error('Project is required')
    if (!projectRef) return console.error('Project ref is required')
    if (!id) return console.error('Snippet ID is required')

    let sql: string = ''
    if (!('content' in snippet)) {
      // Fetch the content first
      const { content } = await getContentById({ projectRef, id: snippet.id })
      sql = content.sql
    } else {
      sql = (snippet as SnippetDetail).content.sql
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

    const folderSnippets = contents.filter(
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
    const contentIds = contents.map((x) => x.id)
    const baseIndex = contentIds.indexOf(id as string)
    const targetIndex = contentIds.indexOf(selectedId)

    const floor = Math.min(baseIndex, targetIndex)
    const ceiling = Math.max(baseIndex, targetIndex)

    const _selectedSnippets = []
    const sameFolder = contents[floor].folder_id === contents[ceiling].folder_id

    for (let i = floor; i <= ceiling; i++) {
      if (sameFolder) {
        if (contents[i].folder_id === contents[floor].folder_id) _selectedSnippets.push(contents[i])
      } else {
        // [Joshen] Temp don't allow selecting across folders for now
        // _selectedSnippets.push(contents[i])
      }
    }

    setSelectedSnippets(_selectedSnippets)
  }

  // ======================================
  // [Joshen] useEffects kept at the bottom
  // ======================================

  useEffect(() => {
    const loadFolderContents = async (folderId: string) => {
      const { contents } = await getSQLSnippetFolders({ projectRef, folderId })
      if (projectRef) {
        contents?.forEach((snippet) => snapV2.addSnippet({ projectRef, snippet }))
      }
    }

    if (snippet !== undefined && !mountedId) {
      if (snippet.visibility === 'project') setShowSharedSnippets(true)
      if (snippet.folder_id) {
        setDefaultExpandedFolderIds([snippet.folder_id])
        loadFolderContents(snippet.folder_id)
      }

      // Only want to run this once when loading sql/[id] route
      setMountedId(true)
    }
  }, [snippet, mountedId])

  useEffect(() => {
    // Unselect all snippets whenever opening another snippet
    setSelectedSnippets([])
  }, [id])

  return (
    <>
      <Separator />

      {((numFavoriteSnippets === 0 && searchText.length === 0) || numFavoriteSnippets > 0) && (
        <>
          <Collapsible_Shadcn_ open={showFavouriteSnippets} onOpenChange={setShowFavouriteSnippets}>
            <CollapsibleTrigger_Shadcn_ className={COLLAPSIBLE_TRIGGER_CLASS_NAMES}>
              <ChevronRight size={16} className={COLLAPSIBLE_ICON_CLASS_NAMES} />
              <span className={COLLASIBLE_HEADER_CLASS_NAMES}>
                Favorites{numFavoriteSnippets > 0 && ` (${numFavoriteSnippets})`}
              </span>
            </CollapsibleTrigger_Shadcn_>
            <CollapsibleContent_Shadcn_ className="pt-2">
              {numFavoriteSnippets === 0 ? (
                <div className="mx-4">
                  <Alert_Shadcn_ className="p-3">
                    <AlertTitle_Shadcn_ className="text-xs">No favorite queries</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_ className="text-xs ">
                      Save a query to favorites for easy accessbility by clicking the{' '}
                      <Heart size={12} className="inline-block relative align-center -top-[1px]" />{' '}
                      icon.
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                </div>
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
                    />
                  )}
                />
              )}
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>
          <Separator />
        </>
      )}

      {((numProjectSnippets === 0 && searchText.length === 0) || numProjectSnippets > 0) && (
        <>
          <Collapsible_Shadcn_ open={showSharedSnippets} onOpenChange={setShowSharedSnippets}>
            <CollapsibleTrigger_Shadcn_ className={COLLAPSIBLE_TRIGGER_CLASS_NAMES}>
              <ChevronRight size={16} className={COLLAPSIBLE_ICON_CLASS_NAMES} />
              <span className={COLLASIBLE_HEADER_CLASS_NAMES}>
                Shared{numProjectSnippets > 0 && ` (${numProjectSnippets})`}
              </span>
            </CollapsibleTrigger_Shadcn_>
            <CollapsibleContent_Shadcn_ className="pt-2">
              {numProjectSnippets === 0 ? (
                <div className="mx-4">
                  <Alert_Shadcn_ className="p-3">
                    <AlertTitle_Shadcn_ className="text-xs">No shared queries</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_ className="text-xs ">
                      Share queries with your team by right-clicking on the query.
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                </div>
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
                    />
                  )}
                />
              )}
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>
          <Separator />
        </>
      )}

      <Collapsible_Shadcn_ open={showPrivateSnippets} onOpenChange={setShowPrivateSnippets}>
        <CollapsibleTrigger_Shadcn_ className={COLLAPSIBLE_TRIGGER_CLASS_NAMES}>
          <ChevronRight size={16} className={COLLAPSIBLE_ICON_CLASS_NAMES} />
          <span className={COLLASIBLE_HEADER_CLASS_NAMES}>
            PRIVATE
            {numPrivateSnippets > 0 && ` (${numPrivateSnippets})`}
          </span>
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_ className="pt-2">
          {!snapV2.loaded[projectRef as string] ? (
            <div className="px-4">
              <GenericSkeletonLoader />
            </div>
          ) : folders.length === 0 && numPrivateSnippets === 0 ? (
            <div className="mx-4">
              <Alert_Shadcn_ className="p-3">
                <AlertTitle_Shadcn_ className="text-xs">No queries created yet</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_ className="text-xs">
                  Queries will be automatically saved once you start writing in the editor.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            </div>
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
                />
              )}
            />
          )}
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>

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
        title={`Confirm to share query: ${selectedSnippetToShare?.name}`}
        confirmLabel="Share query"
        confirmLabelLoading="Sharing query"
        visible={selectedSnippetToShare !== undefined}
        onCancel={() => setSelectedSnippetToShare(undefined)}
        onConfirm={onConfirmShare}
        alert={{
          title: 'This SQL query will become public to all team members',
          description: 'Anyone with access to the project can view it',
        }}
      >
        <ul className="text-sm text-foreground-light space-y-5">
          <li className="flex gap-3">
            <Eye />
            <span>Project members will have read-only access to this query.</span>
          </li>
          <li className="flex gap-3">
            <Unlock />
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
        onConfirm={onConfirmUnshare}
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
