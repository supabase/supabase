import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { Snippet, useSQLSnippetFoldersQuery } from 'data/content/folders-query'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Separator,
  TreeView,
  TreeViewItem,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ROOT_NODE, TreeViewItemProps, formatFolderResponseForTreeView } from './SQLEditorNav.utils'

// Requirements
// - Asynchronous loading
// - Directory tree
// - Multi select
// - Context menu

export const SQLEditorNav = () => {
  const router = useRouter()
  const { ref: projectRef, id } = useParams()
  const snap = useSqlEditorV2StateSnapshot()

  const [selectedSnippets, setSelectedSnippets] = useState<Snippet[]>([])
  const [treeState, setTreeState] = useState<TreeViewItemProps[]>([ROOT_NODE])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showFavouriteSnippets, setShowFavouriteSnippets] = useState(false)
  const [showSharedSnippets, setShowSharedSnippets] = useState(false)
  const [showPrivateSnippets, setShowPrivateSnippets] = useState(true)

  useSQLSnippetFoldersQuery(
    { projectRef },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        const entities = formatFolderResponseForTreeView(data)
        setTreeState(entities)
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
    // if (ids.length > 0) ids.forEach((id) => snap.removeSnippet(id))
    // const existingSnippetIds = (snap.orders[ref!] ?? []).filter((x) => !ids.includes(x))
    // if (existingSnippetIds.length === 0) {
    //   router.push(`/project/${ref}/sql/new`)
    // } else if (ids.includes(activeId as string)) {
    //   router.push(`/project/${ref}/sql/${existingSnippetIds[0]}`)
    // }
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

      <Collapsible_Shadcn_ open={showFavouriteSnippets} onOpenChange={setShowFavouriteSnippets}>
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
            nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level, isSelected }) => (
              <ContextMenu modal={false}>
                <ContextMenuTrigger asChild>
                  <TreeViewItem
                    level={level}
                    xPadding={16}
                    name={element.name}
                    isExpanded={isExpanded}
                    isBranch={isBranch}
                    isSelected={isSelected || id === element.id}
                    isEditing={element.metadata?.isEditing === true}
                    // onEditSubmit={(value) => {
                    //   let updatedTreeData = { ...treeData }
                    //   const findNode = (node: any) => {
                    //     if (node.id === element.id) {
                    //       node.name = value
                    //       node.metadata = { isEditing: false }
                    //     }
                    //     if (node.children) {
                    //       node.children.forEach(findNode)
                    //     }
                    //   }
                    //   updatedTreeData.children.forEach(findNode)
                    //   setDataTreeState(updatedTreeData)
                    // }}
                    {...getNodeProps()}
                    className={cn('bg-brand')}
                    onClick={() => {
                      if (!isBranch) router.push(`/project/${projectRef}/sql/${element.id}`)
                    }}
                  />
                </ContextMenuTrigger>
                <ContextMenuContent onCloseAutoFocus={(e) => e.stopPropagation()}>
                  {isBranch ? (
                    <>
                      <ContextMenuItem disabled>New snippet</ContextMenuItem>
                    </>
                  ) : (
                    <>
                      <ContextMenuItem disabled>Open in new tab</ContextMenuItem>
                      <ContextMenuItem disabled>Share with team</ContextMenuItem>
                    </>
                  )}
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={(e) => {}} onFocusCapture={(e) => e.stopPropagation()}>
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() => {
                      setShowDeleteModal(true)
                      setSelectedSnippets([element.metadata as unknown as Snippet])
                    }}
                  >
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            )}
          />
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>

      <Separator />

      <ConfirmationModal
        title="Confirm to delete query"
        confirmLabel="Delete query"
        confirmLabelLoading="Deleting query"
        size="medium"
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
