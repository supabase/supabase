import { initLogger, setMaskingFunction } from 'braintrust'

const DATA_LEVEL = 'schema_and_log_and_data'
const BRAINTRUST_API_KEY = process.env.BRAINTRUST_API_KEY
const BRAINTRUST_PROJECT_ID = process.env.BRAINTRUST_PROJECT_ID

export const IS_TRACING_ENABLED =
  BRAINTRUST_API_KEY !== undefined && BRAINTRUST_PROJECT_ID !== undefined

if (IS_TRACING_ENABLED) {
  initLogger({
    apiKey: BRAINTRUST_API_KEY,
    projectId: BRAINTRUST_PROJECT_ID,
  })
  // TODO: Remove this mask (and `maskTraceValue`) once tool spans log `toModelOutput` instead of
  // the raw `execute` result: https://github.com/braintrustdata/braintrust-sdk-javascript/issues/2651
  setMaskingFunction((value) => maskTraceValue(value))
}

const REDACTED = '[redacted]'
const MAX_MASK_DEPTH = 50

/**
 * Redacts query rows and cell errors from tool output stamped below the data opt-in level.
 * The nearest enclosing `optInLevel` decides, so a notebook's stamp covers its cells.
 * Unstamped values, like what the model saw, are left alone.
 *
 * `{ optInLevel: 'schema', rows: [...] }` → `{ optInLevel: 'schema', rows: '[redacted]' }`
 */
export function maskTraceValue(value: unknown, isBelowData = false, depth = 0): unknown {
  if (depth > MAX_MASK_DEPTH) return REDACTED
  if (Array.isArray(value)) return value.map((item) => maskTraceValue(item, isBelowData, depth + 1))
  if (typeof value !== 'object' || value === null) return value

  const entries = Object.entries(value)
  const stamp = entries.find(([key]) => key === 'optInLevel')?.[1]
  const isBelowDataHere = typeof stamp === 'string' ? stamp !== DATA_LEVEL : isBelowData

  return Object.fromEntries(
    entries.map(([key, child]) => [
      key,
      isBelowDataHere && (key === 'rows' || key === 'error')
        ? REDACTED
        : maskTraceValue(child, isBelowDataHere, depth + 1),
    ])
  )
}

// Checks that the project is outside the EU. An unknown region fails closed.
export function isTracingAllowed({ projectRegion }: { projectRegion: string | undefined }) {
  if (projectRegion === undefined || projectRegion.startsWith('eu-')) return false

  return true
}
