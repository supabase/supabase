import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { Snippet, useSQLSnippetFoldersQuery } from 'data/content/sql-folders-query'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  Separator,
  TreeView,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ROOT_NODE, formatFolderResponseForTreeView } from './SQLEditorNav.utils'
import { SQLEditorTreeViewItem } from './SQLEditorTreeViewItem'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import { useRouter } from 'next/router'

// Requirements
// - Asynchronous loading
// - Directory tree
// - Multi select
// - Context menu

export const SQLEditorNav = () => {
  const router = useRouter()
  const { ref: projectRef, id } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showFavouriteSnippets, setShowFavouriteSnippets] = useState(false)
  const [showSharedSnippets, setShowSharedSnippets] = useState(false)
  const [showPrivateSnippets, setShowPrivateSnippets] = useState(true)

  const [selectedSnippets, setSelectedSnippets] = useState<Snippet[]>([])
  const [selectedSnippetToRename, setSelectedSnippetToRename] = useState<Snippet>()

  const folders = Object.values(snapV2.folders)
    .filter((folder) => folder.projectRef === projectRef)
    .map((x) => x.folder)
  const contents = Object.values(snapV2.snippets)
    .filter((snippet) => snippet.projectRef === projectRef)
    .map((x) => x.snippet)
  const treeState =
    folders.length === 0 && contents.length === 0
      ? [ROOT_NODE]
      : formatFolderResponseForTreeView({ folders, contents })

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
    if (!id) return console.error('Snippet ID is required')
    deleteContent({ projectRef, ids: selectedSnippets.map((x) => x.id) })
  }

  const COLLAPSIBLE_TRIGGER_CLASS_NAMES =
    'flex items-center gap-x-2 px-4 [&[data-state=open]>svg]:!rotate-90'
  const COLLAPSIBLE_ICON_CLASS_NAMES = 'text-foreground-light transition-transform duration-200'
  const COLLASIBLE_HEADER_CLASS_NAMES = 'text-foreground-light font-mono text-sm uppercase'

  return (
    <>
      <Separator />

      <Collapsible_Shadcn_ open={showFavouriteSnippets} onOpenChange={setShowFavouriteSnippets}>
        <CollapsibleTrigger_Shadcn_ className={COLLAPSIBLE_TRIGGER_CLASS_NAMES}>
          <ChevronRight size={16} className={COLLAPSIBLE_ICON_CLASS_NAMES} />
          <span className={COLLASIBLE_HEADER_CLASS_NAMES}>Favorites</span>
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_ className="pt-2 px-4">Favorites</CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>

      <Separator />

      <Collapsible_Shadcn_ open={showSharedSnippets} onOpenChange={setShowSharedSnippets}>
        <CollapsibleTrigger_Shadcn_ className={COLLAPSIBLE_TRIGGER_CLASS_NAMES}>
          <ChevronRight size={16} className={COLLAPSIBLE_ICON_CLASS_NAMES} />
          <span className={COLLASIBLE_HEADER_CLASS_NAMES}>Shared</span>
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_ className="pt-2 px-4">Shared</CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>

      <Separator />

      <Collapsible_Shadcn_ open={showPrivateSnippets} onOpenChange={setShowPrivateSnippets}>
        <CollapsibleTrigger_Shadcn_ className={COLLAPSIBLE_TRIGGER_CLASS_NAMES}>
          <ChevronRight size={16} className={COLLAPSIBLE_ICON_CLASS_NAMES} />
          <span className={COLLASIBLE_HEADER_CLASS_NAMES}>PRIVATE</span>
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_ className="pt-2">
          <TreeView
            data={treeState}
            className=""
            aria-label="directory tree"
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
              />
            )}
          />
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>

      <Separator />

      <RenameQueryModal
        snippet={selectedSnippetToRename}
        visible={showRenameModal}
        onCancel={() => setShowRenameModal(false)}
        onComplete={() => setShowRenameModal(false)}
      />

      <ConfirmationModal
        title="Confirm to delete query"
        confirmLabel="Delete query"
        confirmLabelLoading="Deleting query"
        size="small"
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
