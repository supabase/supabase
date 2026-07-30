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
  failed: ['rewriteRequested', 'dismissed'],
  noRewriteNeeded: ['dismissed'],
  dismissed: [],
}

function targetState(event: LegacyLogsRewriteEvent): LegacyLogsRewriteState {
  switch (event.type) {
    case 'rewriteRequested':
      return { status: 'rewriting' }
    // The proposal opens the diff; the offer returns to idle behind it so the
    // banner is ready again if the user discards the diff.
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
