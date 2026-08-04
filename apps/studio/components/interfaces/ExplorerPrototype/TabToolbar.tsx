/**
 * PROTOTYPE — the toolbar every tab type shows above its content.
 *
 * Deliberately uniform: icon + name on the left, primary actions on the right,
 * and the same height as the tab strip so the two rows read as one header.
 * No badges — resource type is already carried by the icon and the tab.
 */

import type { ReactNode } from 'react'

import type { ResourceIcon } from './ExplorerResources'

interface TabToolbarProps {
  icon: ResourceIcon
  title: string
  /** Omitted entirely when a view has no primary actions. */
  actions?: ReactNode
}

export const TabToolbar = ({ icon: Icon, title, actions }: TabToolbarProps) => (
  <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3 md:min-h-(--header-height)">
    <Icon size={14} className="shrink-0 text-foreground-muted" />
    <h2 className="truncate text-sm">{title}</h2>
    {actions !== undefined && <div className="ml-auto flex items-center gap-1">{actions}</div>}
  </div>
)
