/**
 * PROTOTYPE — the Explorer tab bar.
 *
 * The bar is agnostic of what a tab contains: it reads `tab.resource.type` only
 * to pick an icon. Everything else (title, dirty state, close) is uniform, which
 * is what makes adding a fourth resource type cheap later.
 */

import { X } from 'lucide-react'
import { cn } from 'ui'

import type { Tab } from './ExplorerPrototype.types'
import { RESOURCE_ICON } from './ExplorerResources'

interface ExplorerTabBarProps {
  tabs: Tab[]
  activeTabId: string
  dirtyResources: Record<string, boolean>
  onSelect: (tabId: string) => void
  onClose: (tabId: string) => void
}

export const ExplorerTabBar = ({
  tabs,
  activeTabId,
  dirtyResources,
  onSelect,
  onClose,
}: ExplorerTabBarProps) => (
  <div className="flex h-full items-stretch overflow-x-auto">
    {tabs.map((tab) => {
      const Icon = RESOURCE_ICON[tab.resource.type]
      const isActive = tab.id === activeTabId
      const isDirty = dirtyResources[tab.resource.id] ?? false

      return (
        <div
          key={tab.id}
          className={cn(
            'group/tab relative flex items-center border-r',
            // The active tab is the page surface pushed up into the muted row,
            // so it reads as continuous with the content below it.
            isActive ? 'bg-background' : 'bg-transparent hover:bg-surface-200'
          )}
        >
          <button
            type="button"
            tabIndex={0}
            onClick={() => onSelect(tab.id)}
            className="flex h-full items-center gap-2 pl-3 pr-8 text-xs"
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

          {isActive && <div className="absolute inset-x-0 top-0 h-px bg-foreground" />}
        </div>
      )
    })}
  </div>
)
