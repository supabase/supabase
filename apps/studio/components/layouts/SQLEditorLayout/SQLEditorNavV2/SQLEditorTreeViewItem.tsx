import { Copy, Download, Edit, ExternalLink, Lock, Share, Trash } from 'lucide-react'
import { useRouter } from 'next/router'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common/hooks/useParams'
import {
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  ContextMenu_Shadcn_,
  TreeViewItem,
  cn,
} from 'ui'
import { useProfile } from 'lib/profile'
import { IS_PLATFORM } from 'common'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

interface SQLEditorTreeViewItemProps {
  element: any
  level: number
  isBranch: boolean
  isSelected: boolean
  isExpanded: boolean
  getNodeProps: () => any
  onSelectDelete?: () => void
  onSelectRename?: () => void
  onSelectShare?: () => void
  onSelectUnshare?: () => void
  onSelectDownload?: () => void
  onSelectCopyPersonal?: () => void
}

export const SQLEditorTreeViewItem = ({
  element,
  isBranch,
  isExpanded,
  level,
  isSelected,
  getNodeProps,
  onSelectDelete,
  onSelectRename,
  onSelectShare,
  onSelectUnshare,
  onSelectDownload,
  onSelectCopyPersonal,
}: SQLEditorTreeViewItemProps) => {
  const router = useRouter()
  const { id, ref } = useParams()
  const { profile } = useProfile()

  const isSnippetOwner = profile?.id === element?.metadata.owner_id
  const isSharedSnippet = element.metadata.visibility === 'project'

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

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
          {onSelectRename !== undefined && isSnippetOwner && (
            <ContextMenuItem_Shadcn_
              className="gap-x-2"
              onSelect={() => onSelectRename()}
              onFocusCapture={(e) => e.stopPropagation()}
            >
              <Edit size={14} />
              Rename query
            </ContextMenuItem_Shadcn_>
          )}
          {onSelectShare !== undefined && !isSharedSnippet && canCreateSQLSnippet && (
            <ContextMenuItem_Shadcn_
              className="gap-x-2"
              onSelect={() => onSelectShare()}
              onFocusCapture={(e) => e.stopPropagation()}
            >
              <Share size={14} />
              Share query with team
            </ContextMenuItem_Shadcn_>
          )}
          {onSelectUnshare !== undefined && isSharedSnippet && isSnippetOwner && (
            <ContextMenuItem_Shadcn_
              className="gap-x-2"
              onSelect={() => onSelectUnshare()}
              onFocusCapture={(e) => e.stopPropagation()}
            >
              <Lock size={14} />
              Unshare query with team
            </ContextMenuItem_Shadcn_>
          )}
          {onSelectCopyPersonal !== undefined &&
            isSharedSnippet &&
            // !isSnippetOwner &&
            canCreateSQLSnippet && (
              <ContextMenuItem_Shadcn_
                className="gap-x-2"
                onSelect={() => onSelectCopyPersonal()}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Copy size={14} />
                Duplicate personal copy
              </ContextMenuItem_Shadcn_>
            )}
          {onSelectDownload !== undefined && IS_PLATFORM && (
            <ContextMenuItem_Shadcn_
              className="gap-x-2"
              onSelect={() => onSelectDownload()}
              onFocusCapture={(e) => e.stopPropagation()}
            >
              <Download size={14} />
              Download as migration file
            </ContextMenuItem_Shadcn_>
          )}
          {onSelectDelete !== undefined && isSnippetOwner && (
            <>
              <ContextMenuSeparator_Shadcn_ />
              <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={() => onSelectDelete()}>
                <Trash size={14} />
                Delete query
              </ContextMenuItem_Shadcn_>
            </>
          )}
        </ContextMenuContent_Shadcn_>
      </ContextMenu_Shadcn_>
    </>
  )
}
