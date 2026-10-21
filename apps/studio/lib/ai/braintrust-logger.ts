import { initLogger, setMaskingFunction } from 'braintrust'

import { contract as executeSqlContract } from './tools/execute-sql'
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
  // TODO: Remove this mask (and `maskTraceValue`) once tool spans log `toModelOutput` instead of
  // the raw `execute` result: https://github.com/braintrustdata/braintrust-sdk-javascript/issues/2651
  setMaskingFunction(maskTraceValue)
}

/**
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
