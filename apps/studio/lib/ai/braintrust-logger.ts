import { currentSpan, initLogger, type SpanExportData } from 'braintrust'
import { configureInstrumentation } from 'braintrust/instrumentation'

import { contract as executeSqlContract } from './tools/execute-sql'
import { NO_DATA_ERROR } from './tools/execute-sql-output'
import { contract as runNotebookContract } from './tools/run-notebook'

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
  // Span customizers can redact errors before upload.
  // https://www.braintrust.dev/docs/admin/data-management/protect-sensitive-data#redact-before-upload
  configureInstrumentation({ spanCustomizers: [{ onSpanExport: redactSpanExport }] })
}

const MASKED_FIELDS = ['input', 'output', 'expected', 'metadata']

export function redactSpanExport(data: SpanExportData): SpanExportData {
  const masked = { ...data }
  for (const field of MASKED_FIELDS) {
    if (field in data) masked[field] = maskTraceValue(data[field])
  }
  return redactHiddenSpanError(masked)
}

// Markers survive if their span never exports an end record.
const hiddenErrorSpanIds = new Set<string>()

/**
 * Keeps a shared parent marked across parallel failures. See braintrust-logger.sdk.test.ts.
 * [tool error, tool error] → one marker → parent end clears it
 */
export function hideSpanErrorFromTrace(spanId = currentSpan().spanId) {
  if (spanId) hiddenErrorSpanIds.add(spanId)
}

// The parent marker also hides unrelated child errors.
export function redactHiddenSpanError(data: SpanExportData): SpanExportData {
  const parentIds = Array.isArray(data.span_parents) ? data.span_parents : []
  const hiddenId = [data.span_id, ...parentIds].find(
    (id): id is string => typeof id === 'string' && hiddenErrorSpanIds.has(id)
  )
  if (hiddenId === undefined) return data

  const isEnd = isRecord(data.metrics) && data.metrics.end !== undefined
  if (data.span_id === hiddenId && isEnd) hiddenErrorSpanIds.delete(hiddenId)

  return data.error === undefined ? data : { ...data, error: NO_DATA_ERROR }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Masks stamped tool output using its contract's model view.
 * TODO remove once Braintrust logs `toModelOutput`.
 * https://github.com/braintrustdata/braintrust-sdk-javascript/issues/2651
 */
export function maskTraceValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskTraceValue)
  if (typeof value !== 'object' || value === null) return value

  if (
    'optInLevel' in value &&
    typeof value.optInLevel === 'string' &&
    value.optInLevel !== DATA_LEVEL
  ) {
    return toModelView(value) ?? { optInLevel: value.optInLevel }
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, maskTraceValue(child)])
  )
}

function toModelView(value: object) {
  const sqlOutput = executeSqlContract.outputSchema.safeParse(value)
  if (sqlOutput.success) {
    return executeSqlContract.toModelOutput(sqlOutput.data, sqlOutput.data.optInLevel)
  }

  const notebookOutput = runNotebookContract.outputSchema.safeParse(value)
  if (notebookOutput.success && notebookOutput.data.optInLevel) {
    return runNotebookContract.toModelOutput(notebookOutput.data, notebookOutput.data.optInLevel)
  }

  return undefined
}

// Checks that the project is outside the EU. An unknown region fails closed.
export function isTracingAllowed({ projectRegion }: { projectRegion: string | undefined }) {
  if (projectRegion === undefined || projectRegion.startsWith('eu-')) return false

  return true
}
