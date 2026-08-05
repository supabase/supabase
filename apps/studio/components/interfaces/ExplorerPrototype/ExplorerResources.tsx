/**
 * PROTOTYPE — the one place that knows what each resource type looks like.
 *
 * The tab bar, the sidebar and each view's toolbar all read from here, so a
 * fourth resource type is a single entry rather than three parallel edits.
 */

import { MessageSquare, NotebookText, SquareCode } from 'lucide-react'
import type { ComponentType } from 'react'

import type { NotebookContent, TabResource } from './ExplorerPrototype.types'

export type ResourceType = TabResource['type']
export type SidebarResourceType = Exclude<ResourceType, 'query'>

export type ResourceIcon = ComponentType<{ size?: number; className?: string }>

export const RESOURCE_ICON: Record<ResourceType, ResourceIcon> = {
  query: SquareCode,
  notebook: NotebookText,
  chat: MessageSquare,
}

export const RESOURCE_SECTIONS: Array<{
  type: SidebarResourceType
  label: string
  searchPlaceholder: string
}> = [
  { type: 'notebook', label: 'Notebooks', searchPlaceholder: 'Search notebooks' },
  { type: 'chat', label: 'Chats', searchPlaceholder: 'Search chats' },
]

export const notebookTitle = (notebook: NotebookContent) => {
  const heading = notebook.cells.find((cell) => cell.type === 'markdown')
  if (heading && heading.type === 'markdown') {
    const firstLine = heading.markdown
      .split('\n')[0]
      .replace(/^#+\s*/, '')
      .trim()
    if (firstLine.length > 0) return firstLine
  }
  return 'Untitled notebook'
}
