/**
 * PROTOTYPE — the toolbar every tab type shows above its content.
 *
 * Deliberately uniform: icon + name on the left, primary actions on the right,
 * and the same height as the tab strip so the two rows read as one header.
 * The title accepts a static label or an editable control for query-backed tabs.
 */

import type { ReactNode } from 'react'

import type { ResourceIcon } from './ExplorerResources'

interface TabToolbarProps {
  icon: ResourceIcon
  /** Static tab title or an editable title control, such as a query cell name. */
  title: ReactNode
  /** Omitted entirely when a view has no primary actions. */
  actions?: ReactNode
}

export const TabToolbar = ({ icon: Icon, title, actions }: TabToolbarProps) => (
  <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-transparent px-3 md:min-h-(--header-height)">
    <Icon size={14} className="shrink-0 text-foreground-muted" />
    <div className="min-w-0 flex-1">
      {typeof title === 'string' ? <h2 className="truncate text-sm">{title}</h2> : title}
    </div>
    {actions !== undefined && <div className="ml-auto flex items-center gap-px">{actions}</div>}
  </div>
)
