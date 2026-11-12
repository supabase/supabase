import type { AdvisorIssue, NotebookSummary, Project } from '@supabase/mcp-server-supabase/apps'

import type { AdvisorCategory } from '../project/issues-list'
import type { ProjectCheckId } from '../project/project-overview'

/**
 * Types and helpers shared by every surface. Surfaces build their UI from `ui`
 * and `ui-patterns` directly, so nothing here renders.
 */

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export function displayValue(value: unknown): string {
  if (value == null) return 'NULL'
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

/**
 * Data a host loaded for a view. Views never fetch: the host passes the current
 * state of a read and the view renders it. `idle` means the host will not load
 * it (for example, the connection lacks the feature).
 */
export type Loadable<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

/** Bounded content a user chose to share with the agent, e.g. selected log rows. */
export interface ContextAttachment {
  projectId: string
  title: string
  text: string
}

/**
 * Lets a view share and withdraw a selection as agent context without starting
 * a turn. The host decides what that means (OpenAI model context, Studio's
 * Assistant context…). `detach` removes the attachment only if it is current.
 */
export interface SelectionSharing {
  attach(attachment: ContextAttachment): Promise<void>
  detach(attachment: ContextAttachment): Promise<void>
}

/**
 * Something the user asked the agent to do from a view. Views describe the
 * request; the host decides how to phrase it for its agent, since tools,
 * context and wording differ between Studio's Assistant and MCP Apps hosts.
 */
export type AgentRequest =
  /** Run one of the project checks listed on Home. */
  | { type: 'project-check'; project: Project; check: ProjectCheckId }
  /** Review one advisor finding. */
  | { type: 'review-finding'; project: Project; category: AdvisorCategory; finding: AdvisorIssue }
  /** Investigate the logs the user selected. */
  | { type: 'investigate-logs'; project: Project; attachment: ContextAttachment }
  /** Run a saved notebook and summarize its results. */
  | { type: 'run-notebook'; project: Project; notebook: Pick<NotebookSummary, 'id' | 'name'> }

/** Sends a request to the active agent on the user's behalf. */
export type AskAgent = (request: AgentRequest) => Promise<void>
