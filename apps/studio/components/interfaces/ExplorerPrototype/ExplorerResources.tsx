/**
 * PROTOTYPE — the one place that knows what each resource type looks like.
 *
 * The tab bar, the sidebar and each view's toolbar all read from here, so a
 * fourth resource type is a single entry rather than three parallel edits.
 */

import { MessageSquare, NotebookText, SquareCode } from 'lucide-react'
import type { ComponentType } from 'react'

import type { TabResource } from './ExplorerPrototype.types'

export type ResourceType = TabResource['type']

export type ResourceIcon = ComponentType<{ size?: number; className?: string }>

export const RESOURCE_ICON: Record<ResourceType, ResourceIcon> = {
  snippet: SquareCode,
  notebook: NotebookText,
  chat: MessageSquare,
}

export const RESOURCE_SECTIONS: Array<{
  type: ResourceType
  label: string
  searchPlaceholder: string
}> = [
  { type: 'snippet', label: 'Snippets', searchPlaceholder: 'Search snippets' },
  { type: 'notebook', label: 'Notebooks', searchPlaceholder: 'Search notebooks' },
  { type: 'chat', label: 'Chats', searchPlaceholder: 'Search chats' },
]
