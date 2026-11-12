import type { Capabilities, DataPort } from '@supabase/mcp-server-supabase/apps'
import { createContext, useContext, type ReactNode } from 'react'
import type { ContextAttachment, SelectionSharing } from 'surfaces/common'
import type { SqlEditorComponent } from 'surfaces/query'

import type { WorkspaceConnection } from './workspace-tools'

/**
 * The MCP app's own services. Shared views never see this: the app's screens
 * read from it, load data, and pass data and callbacks into the views.
 */

/** Shares what the user is looking at without starting an agent turn. */
export interface AgentContext extends SelectionSharing {
  /** Compact, row-free metadata about the current view. Debounced. */
  publish(snapshot: Record<string, unknown>): void
}

/** Sends a message to the agent as the user, optionally with an attachment. */
export type SendMessage = (text: string, attachment?: ContextAttachment) => Promise<void>

export interface AgentHost {
  /** Names the agent in actions, e.g. "Send to Codex". */
  agentName: string
  /** Absent when the host cannot receive messages. */
  ask?: SendMessage
  /** Absent when the host cannot receive context. */
  context?: AgentContext
  /** Requests more room for the surface, e.g. fullscreen. */
  expand?: () => Promise<void>
  openLink?: (url: string) => void
  /** Development preview on fixtures; agent actions are absent. */
  isPreview?: boolean
}

export interface AppServices {
  /** Supabase data over the originating MCP server's tools. */
  data: DataPort
  agent: AgentHost
  capabilities: Capabilities
  SqlEditor: SqlEditorComponent
  /** Agent-callable tools bound to the mounted workspace, when the host supports them. */
  workspace?: WorkspaceConnection
}

const AppContext = createContext<AppServices | null>(null)

export function AppProvider({
  services,
  children,
}: {
  services: AppServices
  children: ReactNode
}) {
  return <AppContext.Provider value={services}>{children}</AppContext.Provider>
}

export function useApp(): AppServices {
  const services = useContext(AppContext)
  if (!services) throw new Error('Screens must render inside <AppProvider>.')
  return services
}
