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
  // Unlike `setMaskingFunction`, span customizers also see a span's `error`.
  // https://www.braintrust.dev/docs/admin/data-management/protect-sensitive-data#redact-before-upload
  configureInstrumentation({ spanCustomizers: [{ onSpanExport: redactSpanExport }] })
}

// Fields that can carry tool output, like a later LLM span's input.
const MASKED_FIELDS = ['input', 'output', 'expected', 'metadata']

/** If this throws, the SDK drops the record. */
export function redactSpanExport(data: SpanExportData): SpanExportData {
  const masked = { ...data }
  for (const field of MASKED_FIELDS) {
    if (field in data) masked[field] = maskTraceValue(data[field])
  }
  return redactHiddenSpanError(masked)
}

// An id stays here if its span's end is never exported, at most one per failed request.
const hiddenErrorSpanIds = new Set<string>()

/**
 * Hides every error Braintrust exports for the current span and its children until the span
 * ends. The thrown error is unchanged. `execute` runs in the parent of the tool span, so
 * parallel failures share one id.
 */
export function hideSpanErrorFromTrace(spanId = currentSpan().spanId) {
  if (spanId) hiddenErrorSpanIds.add(spanId)
}

/**
 * Error records are incremental, so they carry span ids but no span name or metadata.
 * This also hides unrelated errors under the same span, which fails closed.
 */
export function redactHiddenSpanError(data: SpanExportData): SpanExportData {
  const parentIds = Array.isArray(data.span_parents) ? data.span_parents : []
  const hiddenId = [data.span_id, ...parentIds].find(
    (id): id is string => typeof id === 'string' && hiddenErrorSpanIds.has(id)
  )
  if (hiddenId === undefined) return data

  // Children end before their parent, so the parent's end is the last record that needs this id
  const isEnd = isRecord(data.metrics) && data.metrics.end !== undefined
  if (data.span_id === hiddenId && isEnd) hiddenErrorSpanIds.delete(hiddenId)

  return data.error === undefined ? data : { ...data, error: NO_DATA_ERROR }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * TODO: Remove this mask once tool spans log `toModelOutput` instead of the raw `execute` result:
 * https://github.com/braintrustdata/braintrust-sdk-javascript/issues/2651
 *
 * Replaces stamped `execute_sql` and `run_notebook` output below the data opt-in level with what
 * `toModelOutput` sent the model. The mask only receives a bare value, so the tool is recognized
 * by its output schema. A stamped value that neither schema accepts keeps only its stamp.
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
