/**
 * PROTOTYPE — the Explorer tab bar.
 *
 * The bar is agnostic of what a tab contains: it reads `tab.resource.type` only
 * to pick an icon. Everything else (title, dirty state, close) is uniform, which
 * is what makes adding a fourth resource type cheap later.
 */

import { Home, MessageSquare, NotebookText, Plus, SquareCode, X } from 'lucide-react'
import { cn, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

import type { Tab } from './ExplorerPrototype.types'
import { RESOURCE_ICON } from './ExplorerResources'

interface ExplorerTabBarProps {
  tabs: Tab[]
  activeTabId: string
  dirtyResources: Record<string, boolean>
  isHomeActive: boolean
  onHomeSelect: () => void
  onCreateQuery: () => void
  onCreateNotebook: () => void
  onCreateChat: () => void
  onSelect: (tabId: string) => void
  onClose: (tabId: string) => void
}

export const ExplorerTabBar = ({
  tabs,
  activeTabId,
  dirtyResources,
  isHomeActive,
  onHomeSelect,
  onCreateQuery,
  onCreateNotebook,
  onCreateChat,
  onSelect,
  onClose,
}: ExplorerTabBarProps) => (
  <div className="flex h-full items-stretch overflow-hidden">
    <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
      <div
        className={cn(
          'relative flex shrink-0 items-center border-r',
          isHomeActive ? 'bg-muted' : 'bg-background hover:bg-surface-200'
        )}
      >
        <button
          type="button"
          tabIndex={0}
          aria-label="Home"
          onClick={onHomeSelect}
          className={cn(
            'flex h-full aspect-square items-center justify-center px-0 text-xs',
            isHomeActive ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          <Home size={14} />
        </button>
      </div>

      {tabs.map((tab) => {
        const Icon = RESOURCE_ICON[tab.resource.type]
        const isActive = tab.id === activeTabId
        const isDirty = dirtyResources[tab.resource.id] ?? false

        return (
          <div
            key={tab.id}
            className={cn(
              'group/tab relative flex items-center border-r',
              // The active tab shares the muted content surface; inactive tabs
              // remain on the background surface until selected.
              isActive ? 'bg-muted' : 'bg-background hover:bg-surface-200'
            )}
          >
            <button
              type="button"
              tabIndex={0}
              onClick={() => onSelect(tab.id)}
              className={cn(
                'flex h-full items-center gap-2 pl-3 pr-8 text-xs',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon size={14} className="shrink-0 text-foreground-muted" />
              <span className="max-w-40 truncate">{tab.title}</span>
            </button>

            {isDirty && (
              <span
                aria-label="Unsaved changes"
                className="absolute right-3 size-1.5 rounded-full bg-foreground-light group-hover/tab:opacity-0"
              />
            )}

            <button
              type="button"
              tabIndex={0}
              aria-label={`Close ${tab.title}`}
              onClick={() => onClose(tab.id)}
              className={cn(
                'absolute right-1.5 flex size-5 items-center justify-center rounded-xs',
                'opacity-0 hover:bg-surface-300 group-hover/tab:opacity-100'
              )}
            >
              <X size={12} className="text-foreground-light" />
            </button>
          </div>
        )
      })}
    </div>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          tabIndex={0}
          aria-label="Create new resource"
          className="sticky right-0 z-10 flex h-full aspect-square shrink-0 items-center justify-center px-0 text-muted-foreground hover:bg-surface-200 hover:text-foreground"
        >
          <Plus size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-44">
        <DropdownMenuItem className="gap-x-2" onClick={onCreateQuery}>
          <SquareCode size={14} strokeWidth={1.5} />
          New SQL query
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-x-2" onClick={onCreateNotebook}>
          <NotebookText size={14} strokeWidth={1.5} />
          New notebook
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-x-2" onClick={onCreateChat}>
          <MessageSquare size={14} strokeWidth={1.5} />
          New chat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)
