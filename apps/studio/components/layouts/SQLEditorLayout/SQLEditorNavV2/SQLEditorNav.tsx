import { ChevronRight, Eye, EyeOffIcon, Heart, Unlock } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import DownloadSnippetModal from 'components/interfaces/SQLEditor/DownloadSnippetModal'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { getContentById } from 'data/content/content-id-query'
import { Snippet, SnippetDetail, useSQLSnippetFoldersQuery } from 'data/content/sql-folders-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import uuidv4 from 'lib/uuid'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
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
import { ROOT_NODE, formatFolderResponseForTreeView } from './SQLEditorNav.utils'
import { SQLEditorTreeViewItem } from './SQLEditorTreeViewItem'

// Requirements
// - Asynchronous loading
// - Directory tree
// - Multi select
// - Context menu

interface SQLEditorNavProps {
  searchText: string
  sort: 'name' | 'inserted_at'
}

export const SQLEditorNav = ({ sort, searchText }: SQLEditorNavProps) => {
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const { ref: projectRef, id } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showFavouriteSnippets, setShowFavouriteSnippets] = useState(false)
  const [showSharedSnippets, setShowSharedSnippets] = useState(false)
  const [showPrivateSnippets, setShowPrivateSnippets] = useState(true)

  const [selectedSnippets, setSelectedSnippets] = useState<Snippet[]>([])
  const [selectedSnippetToShare, setSelectedSnippetToShare] = useState<Snippet>()
  const [selectedSnippetToUnshare, setSelectedSnippetToUnshare] = useState<Snippet>()
  const [selectedSnippetToRename, setSelectedSnippetToRename] = useState<Snippet>()
  const [selectedSnippetToDownload, setSelectedSnippetToDownload] = useState<Snippet>()

  const COLLAPSIBLE_TRIGGER_CLASS_NAMES =
    'flex items-center gap-x-2 px-4 [&[data-state=open]>svg]:!rotate-90'
  const COLLAPSIBLE_ICON_CLASS_NAMES = 'text-foreground-light transition-transform duration-200'
  const COLLASIBLE_HEADER_CLASS_NAMES = 'text-foreground-light font-mono text-sm uppercase'

  // =================================
  // [Joshen] Set up favorites, shared, and private snippets
  // =================================
  const folders = Object.values(snapV2.folders).map((x) => x.folder)
  const contents = Object.values(snapV2.snippets)
    .map((x) => x.snippet)
    .filter((x) =>
      searchText.length > 0 ? x.name.toLowerCase().includes(searchText.toLowerCase()) : true
    )
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      else return new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
    })

  const privateSnippets = contents.filter((snippet) => snippet.visibility === 'user')
  const numPrivateSnippets = Object.keys(snapV2.snippets).length
  const privateSnippetsTreeState =
    folders.length === 0 && numPrivateSnippets === 0
      ? [ROOT_NODE]
      : formatFolderResponseForTreeView({ folders, contents: privateSnippets })

  const favoriteSnippets = contents.filter((snippet) => snippet.favorite)
  const numFavoriteSnippets = favoriteSnippets.length
  const favoritesTreeState =
    numFavoriteSnippets === 0
      ? [ROOT_NODE]
      : formatFolderResponseForTreeView({ contents: favoriteSnippets })

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
          snapV2.initializeRemoteSnippets({ projectRef, data })
        }
      },
    }
  )

  const { mutate: deleteContent, isLoading: isDeleting } = useContentDeleteMutation({
    onSuccess: (data) => {
      toast.success('Successfully deleted query')
      postDeleteCleanup(data)
    },
    onError: (error, data) => {
      if (error.message.includes('Contents not found')) {
        postDeleteCleanup(data.ids)
      } else {
        toast.error(`Failed to delete query: ${error.message}`)
      }
    },
  })

  // =================================
  // [Joshen] UI functions
  // =================================

  const postDeleteCleanup = (ids: string[]) => {
    setShowDeleteModal(false)
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
    deleteContent({ projectRef, ids: selectedSnippets.map((x) => x.id) })
  }

  const onConfirmShare = () => {
    if (!selectedSnippetToShare) return console.error('Snippet ID is required')
    snapV2.shareSnippet(selectedSnippetToShare.id, 'project')
    setSelectedSnippetToShare(undefined)
  }

  const onConfirmUnshare = () => {
    if (!selectedSnippetToUnshare) return console.error('Snippet ID is required')
    snapV2.shareSnippet(selectedSnippetToUnshare.id, 'user')
    setSelectedSnippetToUnshare(undefined)
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

  // =================================
  // [Joshen] useEffects kept at the bottom
  // =================================

  useEffect(() => {
    if (id !== undefined && snapV2.loaded && snapV2.snippets[id] !== undefined) {
      const snippet = snapV2.snippets[id].snippet
      if (snippet.visibility === 'project') {
        setShowSharedSnippets(true)
      }
    }
  }, [id, snapV2.loaded])

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
          {numPrivateSnippets === 0 ? (
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
              data={privateSnippetsTreeState}
              aria-label="private-snippets"
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
                  onSelectShare={() => {
                    setSelectedSnippetToShare(element.metadata as Snippet)
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
        title="Confirm to delete query"
        confirmLabel="Delete query"
        confirmLabelLoading="Deleting query"
        loading={isDeleting}
        visible={showDeleteModal}
        variant={'destructive'}
        onCancel={() => setShowDeleteModal(false)}
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
        <p className="text-sm">Are you sure you want to delete '{selectedSnippets[0]?.name}'?</p>
      </ConfirmationModal>
    </>
  )
}
