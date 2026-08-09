import { useReducer } from 'react'

import { constructHeaders } from '@/data/fetchers'
import { rewriteLogsSqlWithAI } from '@/data/logs/logs-sql-rewrite'
import { useLogsAttributeKeys } from '@/hooks/analytics/useLogsAttributeKeys'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { getErrorMessage } from '@/lib/get-error-message'

export type LegacyLogsRewriteState =
  | { status: 'offered' }
  | { status: 'rewriting' }
  | { status: 'failed'; message: string }
  | { status: 'noRewriteNeeded' }
  | { status: 'dismissed' }

export type LegacyLogsRewriteEvent =
  | { type: 'rewriteRequested' }
  | { type: 'rewriteProposed' }
  | { type: 'rewriteFailed'; message: string }
  | { type: 'rewriteNoop' }
  | { type: 'dismissed' }

export const INITIAL_LEGACY_LOGS_REWRITE_STATE: LegacyLogsRewriteState = { status: 'offered' }

/**
 * The events each state accepts. Anything absent is an invalid transition and
 * leaves the state untouched — notably `dismissed` is terminal, and the offer
 * can't be dismissed mid-rewrite.
 */
const VALID_EVENTS: {
  [S in LegacyLogsRewriteState['status']]: readonly LegacyLogsRewriteEvent['type'][]
} = {
  offered: ['rewriteRequested', 'dismissed'],
  rewriting: ['rewriteProposed', 'rewriteFailed', 'rewriteNoop'],
  // A failure is recoverable: the same Rewrite control retries it.
  failed: ['rewriteRequested', 'dismissed'],
  noRewriteNeeded: ['dismissed'],
  dismissed: [],
}

function targetState(event: LegacyLogsRewriteEvent): LegacyLogsRewriteState {
  switch (event.type) {
    case 'rewriteRequested':
      return { status: 'rewriting' }
    // The proposal is handed to the caller; the offer returns to idle behind it so
    // it's ready again if the user discards the proposal.
    case 'rewriteProposed':
      return { status: 'offered' }
    case 'rewriteFailed':
      return { status: 'failed', message: event.message }
    case 'rewriteNoop':
      return { status: 'noRewriteNeeded' }
    case 'dismissed':
      return { status: 'dismissed' }
  }
}

export function legacyLogsRewriteReducer(
  state: LegacyLogsRewriteState,
  event: LegacyLogsRewriteEvent
): LegacyLogsRewriteState {
  if (!VALID_EVENTS[state.status].includes(event.type)) return state
  return targetState(event)
}

const CHANGED_WHILE_REWRITING_MESSAGE =
  'The query changed while the Assistant was working, so the rewrite no longer matches it.'

const NO_RESPONSE_MESSAGE = 'The Assistant did not respond. Try again.'

export type LegacyLogsRewriteProposal = { original: string; modified: string }

type UseLegacyLogsRewriteArgs = {
  /**
   * Reads the query to rewrite at the moment the user asks. A callback rather than
   * a value so the rewrite operates on exactly what the user sees, not on whatever
   * a surface last rendered.
   */
  readSql: () => string
  /** Receives a rewrite worth reviewing. Each surface routes this to its own diff. */
  onProposal: (proposal: LegacyLogsRewriteProposal) => void
  /**
   * Called when the offer is dismissed, for surfaces that persist that. The
   * machine covers the current session only — a surface that remembers dismissals
   * across sessions layers that on top of its own visibility check, since a value
   * read from storage isn't available in time to seed the machine.
   */
  onDismissed?: () => void
}

/**
 * Owns the BigQuery → ClickHouse rewrite request end to end: key discovery, the
 * completion call, the stale-edit guard, no-op detection, and the resulting state.
 */
export function useLegacyLogsRewrite({
  readSql,
  onProposal,
  onDismissed,
}: UseLegacyLogsRewriteArgs) {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const projectRef = project?.ref

  const [state, dispatch] = useReducer(legacyLogsRewriteReducer, INITIAL_LEGACY_LOGS_REWRITE_STATE)

  const { fetchAttributeKeys } = useLogsAttributeKeys()

  const requestRewrite = async () => {
    if (!projectRef) return console.error('[useLegacyLogsRewrite] Project ref is required')

    const currentSql = readSql()
    if (currentSql.trim().length === 0) return

    dispatch({ type: 'rewriteRequested' })
    try {
      const [headerData, availableKeys] = await Promise.all([
        constructHeaders(),
        fetchAttributeKeys(currentSql),
      ])
      const rewritten = await rewriteLogsSqlWithAI({
        sql: currentSql,
        projectRef,
        connectionString: project?.connectionString,
        orgSlug: organization?.slug,
        authorizationHeader: headerData.get('Authorization'),
        availableKeys,
      })

      // The user may have kept typing while the model worked; a proposal built from
      // stale text would clobber those edits when accepted.
      if (readSql() !== currentSql) {
        dispatch({ type: 'rewriteFailed', message: CHANGED_WHILE_REWRITING_MESSAGE })
        return
      }

      // An unchanged response means the query already runs on ClickHouse and the
      // dialect heuristic was over-eager. Proposing it would show an empty diff.
      if (rewritten.trim() === currentSql.trim()) {
        dispatch({ type: 'rewriteNoop' })
        return
      }

      onProposal({ original: currentSql, modified: rewritten })
      dispatch({ type: 'rewriteProposed' })
    } catch (error) {
      dispatch({ type: 'rewriteFailed', message: getErrorMessage(error, NO_RESPONSE_MESSAGE) })
    }
  }

  const dismiss = () => {
    const dismissed: LegacyLogsRewriteEvent = { type: 'dismissed' }
    // The transition table is the contract, not the UI that happens to disable the
    // control: never report a dismissal the machine rejected (mid-rewrite, say),
    // or a surface that persists it would suppress an offer that's still live.
    if (legacyLogsRewriteReducer(state, dismissed) === state) return
    dispatch(dismissed)
    onDismissed?.()
  }

  return { state, requestRewrite, dismiss }
}
