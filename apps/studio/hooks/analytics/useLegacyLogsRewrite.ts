import { useReducer } from 'react'

import { constructHeaders } from '@/data/fetchers'
import { detectLogSource, rewriteLogsSqlWithAI } from '@/data/logs/logs-sql-rewrite'
import { useOtelLogKeysQuery } from '@/data/logs/otel-log-keys-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { getErrorMessage } from '@/lib/get-error-message'

/**
 * The legacy-logs rewrite offer for one query, as a state machine. The states are
 * mutually exclusive by construction — a rewrite can't be in flight on an offer
 * the user already dismissed, and a dismissed offer never comes back — so callers
 * read one value instead of reconciling independent booleans.
 *
 * `failed` and `noRewriteNeeded` are outcomes a surface renders, not toasts: a
 * failure keeps its message so the user can read it and retry, and a no-op tells
 * the user the Assistant found nothing to change and waits for acknowledgement
 * rather than silently retiring the offer.
 */
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
 * can't be dismissed mid-rewrite (surfaces disable that control while a rewrite is
 * in flight), so a settling request can never resurrect it.
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

/**
 * Where each event lands. Split from `VALID_EVENTS` because the target depends
 * only on the event, never on the state it came from — which keeps this total and
 * exhaustive (so a new event is a compile error) without any casts to thread the
 * failure message through a lookup table.
 */
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
   * The query the offer is about, as currently displayed. Used to discover the
   * source's real `log_attributes` keys, so pass a settled (e.g. debounced) value
   * rather than one that changes on every keystroke.
   */
  sql: string
  /** Whether an offer is on screen — gates the key-discovery query. */
  isOffered: boolean
  /**
   * Reads the query to rewrite at the moment the user asks. Separate from `sql`
   * because a surface may hold a fresher value than the one driving visibility,
   * and the rewrite must operate on exactly what the user sees.
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
 * Shared by the SQL editor's rewrite banner and the Logs Explorer so both behave
 * identically — the two previously hand-rolled this sequence and had already
 * drifted on no-op handling, key sourcing, and error formatting.
 */
export function useLegacyLogsRewrite({
  sql,
  isOffered,
  readSql,
  onProposal,
  onDismissed,
}: UseLegacyLogsRewriteArgs) {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const projectRef = project?.ref

  const [state, dispatch] = useReducer(legacyLogsRewriteReducer, INITIAL_LEGACY_LOGS_REWRITE_STATE)

  // Real keys for the query's source keep the model from inventing dotted paths.
  // Fetched reactively so they're ready when the user asks for the rewrite.
  const { data: availableKeys } = useOtelLogKeysQuery(
    { projectRef, source: isOffered ? detectLogSource(sql) : undefined },
    { enabled: isOffered }
  )

  const requestRewrite = async () => {
    if (!projectRef) return console.error('[useLegacyLogsRewrite] Project ref is required')

    const currentSql = readSql()
    if (currentSql.trim().length === 0) return

    dispatch({ type: 'rewriteRequested' })
    try {
      const headerData = await constructHeaders()
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
    dispatch({ type: 'dismissed' })
    onDismissed?.()
  }

  return { state, requestRewrite, dismiss }
}
