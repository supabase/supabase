import { CopyIcon, EditIcon, Layers2Icon, MoreVerticalIcon, Trash2Icon } from 'lucide-react'
import { Ref } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { type LogsView } from '../UnifiedLogs.views'

interface LogsViewRowProps {
  view: LogsView
  isActive: boolean
  isModified: boolean
  canUpdate: boolean
  canDelete: boolean
  isPreset?: boolean
  description?: string
  canCreate?: boolean
  activeRowRef?: Ref<HTMLDivElement>
  onApply: (view: LogsView) => void
  onReviewChanges: () => void
  onRequestRename: (view: LogsView) => void
  onRequestDelete: (view: LogsView) => void
  onRequestDuplicate: (view: LogsView) => void
}

export const LogsViewRow = ({
  view,
  isActive,
  isModified,
  canUpdate,
  canDelete,
  isPreset = false,
  description,
  canCreate = true,
  activeRowRef,
  onApply,
  onReviewChanges,
  onRequestRename,
  onRequestDelete,
  onRequestDuplicate,
}: LogsViewRowProps) => {
  const isModifiedActive = isActive && isModified

  return (
    <div
      ref={isActive ? activeRowRef : undefined}
      className={cn(
        'group relative flex w-full items-center gap-2 rounded-md pl-2 pr-1',
        isActive ? 'bg-selection' : 'hover:bg-surface-200'
      )}
    >
      <button
        type="button"
        tabIndex={0}
        onClick={() => (isModifiedActive ? onReviewChanges() : onApply(view))}
        aria-current={isActive}
        aria-label={isModifiedActive ? `${view.name} — review changes` : undefined}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 text-left focus-ring"
      >
        <Layers2Icon size={14} className="shrink-0 text-foreground-light" />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-sm leading-none',
            isActive ? 'text-foreground' : 'text-foreground-light'
          )}
          title={description ?? view.name}
        >
          {view.name}
        </span>
        {isModifiedActive && (
          <span className="shrink-0 text-xs leading-none text-foreground-lighter">Modified</span>
        )}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="tiny"
            variant="text"
            className="px-1 opacity-0 transition-opacity data-[state=open]:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
            icon={<MoreVerticalIcon size={14} />}
            aria-label={`View options for ${view.name}`}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            disabled={!canCreate}
            className="gap-x-2"
            onSelect={() => onRequestDuplicate(view)}
          >
            <CopyIcon size={14} />
            <span>Duplicate</span>
          </DropdownMenuItem>
          {!isPreset && (
            <>
              <DropdownMenuItem
                disabled={!canUpdate}
                className="gap-x-2"
                onSelect={() => onRequestRename(view)}
              >
                <EditIcon size={14} />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canDelete}
                className="gap-x-2"
                onSelect={() => onRequestDelete(view)}
              >
                <Trash2Icon size={14} />
                <span>Delete</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
