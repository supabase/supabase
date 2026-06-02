import { FolderPlus, Plus } from 'lucide-react'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface SQLEditorSectionActionsProps {
  onNewSnippet?: () => void
  onNewFolder?: () => void
  canCreateSnippet?: boolean
  newSnippetTestId?: string
  newFolderTestId?: string
  newSnippetTooltip?: string
  newFolderTooltip?: string
}

export function SQLEditorSectionActions({
  onNewSnippet,
  onNewFolder,
  canCreateSnippet = true,
  newSnippetTestId,
  newFolderTestId,
  newSnippetTooltip = 'New snippet',
  newFolderTooltip = 'New folder',
}: SQLEditorSectionActionsProps) {
  if (!onNewSnippet && !onNewFolder) return null

  return (
    <div className="flex items-center shrink-0 pr-3">
      {onNewSnippet ? (
        <ButtonTooltip
          type="text"
          size="tiny"
          className="px-1 h-6 w-6"
          icon={<Plus size={14} />}
          onClick={(event) => {
            event.stopPropagation()
            onNewSnippet()
          }}
          disabled={!canCreateSnippet}
          data-testid={newSnippetTestId}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canCreateSnippet
                ? 'You need additional permissions to create snippets'
                : newSnippetTooltip,
            },
          }}
        />
      ) : null}
      {onNewFolder ? (
        <ButtonTooltip
          type="text"
          size="tiny"
          className="px-1 h-6 w-6"
          icon={<FolderPlus size={14} />}
          onClick={(event) => {
            event.stopPropagation()
            onNewFolder()
          }}
          disabled={!canCreateSnippet}
          data-testid={newFolderTestId}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canCreateSnippet
                ? 'You need additional permissions to create folders'
                : newFolderTooltip,
            },
          }}
        />
      ) : null}
    </div>
  )
}
