import { Plus } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { useSqlEditorCreateActions } from './useSqlEditorCreateActions'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'

export function SQLEditorCreateMenu() {
  const {
    canCreateNotebook,
    canCreateSQLSnippet,
    createNewChat,
    createNewNotebook,
    createNewSnippet,
  } = useSqlEditorCreateActions()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="default"
          size="tiny"
          className="px-1.5 h-[32px] md:h-[28px] shrink-0"
          icon={<Plus size={14} />}
          aria-label="Create"
          data-testid="sql-editor-create-menu-button"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          disabled={!canCreateSQLSnippet}
          onSelect={() => void createNewSnippet('private')}
          data-testid="sql-editor-create-snippet"
        >
          <span className="mr-2 inline-flex shrink-0">
            <EntityTypeIcon type="sql" size={16} />
          </span>
          Snippet
        </DropdownMenuItem>
        {canCreateNotebook ? (
          <DropdownMenuItem
            onSelect={() => createNewNotebook()}
            data-testid="sql-editor-create-notebook"
          >
            <span className="mr-2 inline-flex shrink-0">
              <EntityTypeIcon type="notebook" size={16} />
            </span>
            Notebook
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={() => createNewChat()} data-testid="sql-editor-create-chat">
          <span className="mr-2 inline-flex shrink-0">
            <EntityTypeIcon type="chat" size={16} />
          </span>
          Chat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
