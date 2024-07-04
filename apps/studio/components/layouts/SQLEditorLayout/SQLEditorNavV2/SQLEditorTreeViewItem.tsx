import { Download, Edit, ExternalLink, Share, Trash } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import {
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  ContextMenu_Shadcn_,
  TreeViewItem,
  cn,
} from 'ui'
import { SqlSnippet } from 'data/content/sql-snippets-query'

interface SQLEditorTreeViewItemProps {
  element: any
  level: number
  isBranch: boolean
  isSelected: boolean
  isExpanded: boolean
  getNodeProps: () => any
  onSelectDelete: () => void
  onSelectRename: () => void
}

export const SQLEditorTreeViewItem = ({
  element,
  isBranch,
  isExpanded,
  getNodeProps,
  level,
  isSelected,
  onSelectDelete,
  onSelectRename,
}: SQLEditorTreeViewItemProps) => {
  const router = useRouter()
  const { id, ref } = useParams()

  return (
    <>
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
              <ContextMenuItem_Shadcn_
                asChild
                className="gap-x-2"
                onSelect={() => {}}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <a href={`/project/${ref}/sql/${element.id}`} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} />
                  Open in new tab
                </a>
              </ContextMenuItem_Shadcn_>
            </>
          )}
          <ContextMenuSeparator_Shadcn_ />
          <ContextMenuItem_Shadcn_
            className="gap-x-2"
            onSelect={() => onSelectRename()}
            onFocusCapture={(e) => e.stopPropagation()}
          >
            <Edit size={14} />
            Rename query
          </ContextMenuItem_Shadcn_>
          <ContextMenuItem_Shadcn_
            className="gap-x-2"
            onSelect={() => {}}
            onFocusCapture={(e) => e.stopPropagation()}
          >
            <Share size={14} />
            Share query with team
          </ContextMenuItem_Shadcn_>
          <ContextMenuItem_Shadcn_
            className="gap-x-2"
            onSelect={() => {}}
            onFocusCapture={(e) => e.stopPropagation()}
          >
            <Download size={14} />
            Download as migration file
          </ContextMenuItem_Shadcn_>
          <ContextMenuSeparator_Shadcn_ />
          <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={() => onSelectDelete()}>
            <Trash size={14} />
            Delete query
          </ContextMenuItem_Shadcn_>
        </ContextMenuContent_Shadcn_>
      </ContextMenu_Shadcn_>
    </>
  )
}
