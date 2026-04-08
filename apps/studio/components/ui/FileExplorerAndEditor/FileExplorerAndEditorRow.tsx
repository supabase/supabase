import { IS_PLATFORM } from 'common'
import { Edit, File, Trash } from 'lucide-react'
import {
  cn,
  ContextMenu_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TreeViewItem,
  type INodeRendererProps,
} from 'ui'

import { FileData } from './FileExplorerAndEditor.types'

type FileExplorerAndEditorRowProps = INodeRendererProps & {
  files: FileData[]
  selectedFileId: number
  setSelectedFileId: (id: number) => void
  handleFileNameChange: (id: number, newName: string) => void
  handleStartRename: (id: number) => void
  handleFileDelete: (id: number) => void
}

export const FileExplorerAndEditorRow = ({
  element,
  isBranch,
  isExpanded,
  getNodeProps,
  level,
  files,
  selectedFileId,
  setSelectedFileId,
  handleFileNameChange,
  handleStartRename,
  handleFileDelete,
}: FileExplorerAndEditorRowProps) => {
  const nodeProps = getNodeProps()
  const originalId =
    typeof element.metadata?.originalId === 'number' ? element.metadata.originalId : null
  const state = element.metadata?.state as FileData['state']
  const isEditing = Boolean(element.metadata?.isEditing)

  return (
    <ContextMenu_Shadcn_ modal={false}>
      <ContextMenuTrigger_Shadcn_ asChild>
        <div>
          <TreeViewItem
            {...nodeProps}
            isExpanded={isExpanded}
            isBranch={isBranch}
            isSelected={files.find((f) => f.id === originalId)?.id === selectedFileId}
            level={level}
            xPadding={16}
            name={element.name}
            className={cn(
              isEditing
                ? ''
                : state === 'new'
                  ? 'text-brand-600'
                  : state === 'modified'
                    ? 'text-code_block-2'
                    : ''
            )}
            icon={<File size={14} className="text-foreground-light shrink-0" />}
            isEditing={isEditing}
            onEditSubmit={(value) => {
              if (IS_PLATFORM && originalId !== null) {
                handleFileNameChange(originalId, value)
              }
            }}
            onClick={() => {
              if (originalId !== null && !isEditing) {
                setSelectedFileId(originalId)
              }
            }}
            onDoubleClick={() => {
              if (IS_PLATFORM && originalId !== null) {
                handleStartRename(originalId)
              }
            }}
            actions={
              state !== 'unchanged' && (
                <div className="flex items-center justify-center w-3">
                  <Tooltip>
                    <TooltipTrigger className="text-xs">
                      {state === 'new' ? 'U' : 'M'}
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {state === 'new' ? 'Unsaved' : 'Modified'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )
            }
          />
        </div>
      </ContextMenuTrigger_Shadcn_>
      {IS_PLATFORM && (
        <ContextMenuContent_Shadcn_ onCloseAutoFocus={(e) => e.stopPropagation()}>
          <ContextMenuItem_Shadcn_
            className="gap-x-2"
            onSelect={() => {
              if (originalId !== null) handleStartRename(originalId)
            }}
            onFocusCapture={(e) => e.stopPropagation()}
          >
            <Edit size={14} />
            Rename file
          </ContextMenuItem_Shadcn_>

          {files.length > 1 && (
            <>
              <ContextMenuSeparator_Shadcn_ />
              <ContextMenuItem_Shadcn_
                className="gap-x-2"
                onSelect={() => {
                  if (originalId !== null) {
                    handleFileDelete(originalId)
                  }
                }}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Trash size={14} />
                Delete file
              </ContextMenuItem_Shadcn_>
            </>
          )}
        </ContextMenuContent_Shadcn_>
      )}
    </ContextMenu_Shadcn_>
  )
}
