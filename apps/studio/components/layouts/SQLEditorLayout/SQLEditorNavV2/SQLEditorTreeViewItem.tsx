import { useRouter } from 'next/router'

import { useParams } from 'common'
import {
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  ContextMenu_Shadcn_,
  TreeViewItem,
  cn,
} from 'ui'
import { Snippet } from 'data/content/sql-folders-query'

interface SQLEditorTreeViewItemProps {
  element: any
  level: number
  isBranch: boolean
  isSelected: boolean
  isExpanded: boolean
  getNodeProps: () => any
  onSelectDelete: () => void
}

export const SQLEditorTreeViewItem = ({
  element,
  isBranch,
  isExpanded,
  getNodeProps,
  level,
  isSelected,
  onSelectDelete,
}: SQLEditorTreeViewItemProps) => {
  const { id, ref } = useParams()
  const router = useRouter()

  return (
    <ContextMenu_Shadcn_ modal={false}>
      <ContextMenuTrigger_Shadcn_ asChild>
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
            if (!isBranch) router.push(`/project/${ref}/sql/${element.id}`)
          }}
        />
      </ContextMenuTrigger_Shadcn_>
      <ContextMenuContent_Shadcn_ onCloseAutoFocus={(e) => e.stopPropagation()}>
        {isBranch ? (
          <>
            <ContextMenuItem_Shadcn_ disabled>New snippet</ContextMenuItem_Shadcn_>
          </>
        ) : (
          <>
            <ContextMenuItem_Shadcn_ disabled>Open in new tab</ContextMenuItem_Shadcn_>
            <ContextMenuItem_Shadcn_ disabled>Share with team</ContextMenuItem_Shadcn_>
          </>
        )}
        <ContextMenuSeparator_Shadcn_ />
        <ContextMenuItem_Shadcn_ onSelect={() => {}} onFocusCapture={(e) => e.stopPropagation()}>
          Rename
        </ContextMenuItem_Shadcn_>
        <ContextMenuItem_Shadcn_ onSelect={() => onSelectDelete()}>Delete</ContextMenuItem_Shadcn_>
      </ContextMenuContent_Shadcn_>
    </ContextMenu_Shadcn_>
  )
}
