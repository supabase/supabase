import { useParams } from 'common'
import { useSQLSnippetFoldersQuery } from 'data/content/folders-query'
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
  flattenTree,
} from 'ui'
import { ROOT_NODE, TreeViewItemProps, formatFolderResponseForTreeView } from './SQLEditorNav.utils'
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/router'

// Requirements
// - Asynchronous loading
// - Directory tree
// - Multi select
// - Context menu

export const SQLEditorNav = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const [treeState, setTreeState] = useState<TreeViewItemProps[]>([ROOT_NODE])
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

  return (
    <>
      <Separator />

      <Collapsible_Shadcn_ open={showPrivateSnippets} onOpenChange={setShowPrivateSnippets}>
        <CollapsibleTrigger_Shadcn_ className="flex items-center gap-x-2 px-4 [&[data-state=open]>svg]:!rotate-90">
          <ChevronRight
            className="text-foreground-light transition-transform duration-200"
            size={16}
          />
          <span className="text-foreground-light font-mono text-sm">PRIVATE</span>
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
                    isSelected={isSelected}
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
                  <ContextMenuItem disabled>Delete</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            )}
          />
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>

      <Separator />
    </>
  )
}
