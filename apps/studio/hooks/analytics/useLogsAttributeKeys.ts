import { useDebounce } from '@uidotdev/usehooks'
import { useMemo } from 'react'

import { detectLogSource } from '@/data/logs/logs-sql-rewrite'
import { useOtelLogKeysQuery } from '@/data/logs/otel-log-keys-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

/** Long enough that typing a source name doesn't fire a request per keystroke. */
export const SOURCE_DETECTION_DEBOUNCE_MS = 500

/**
 * The real `log_attributes` keys for whichever source a logs query targets. The AI
 * flows pass these along so the model uses exact dotted paths instead of inventing
 * them.
 *
 * Takes the live query text and debounces internally, deliberately: the detected
 * source is part of the React Query key, so an undebounced caller fires a fresh
 * analytics request for every intermediate source name while the user types one
 * (`edge_l`, `edge_lo`, `edge_log`, …). Owning the debounce here means a new caller
 * can't reintroduce that by forgetting to pre-debounce.
 */
export function useLogsAttributeKeys({ sql, enabled }: { sql: string; enabled: boolean }) {
  const { data: project } = useSelectedProjectQuery()

  const settledSql = useDebounce(sql, SOURCE_DETECTION_DEBOUNCE_MS)
  // Memoized so the query key stays referentially stable between renders — the
  // callers re-render on every keystroke even though `settledSql` doesn't change.
  const source = useMemo(
    () => (enabled ? detectLogSource(settledSql) : undefined),
    [enabled, settledSql]
  )

  const { data } = useOtelLogKeysQuery({ projectRef: project?.ref, source }, { enabled })
  return data
}
