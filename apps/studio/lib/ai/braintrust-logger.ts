import { initLogger } from 'braintrust'

const BRAINTRUST_API_KEY = process.env.BRAINTRUST_API_KEY
const BRAINTRUST_PROJECT_ID = process.env.BRAINTRUST_PROJECT_ID

export const IS_TRACING_ENABLED = BRAINTRUST_API_KEY !== undefined

export const TRACING_ENVIRONMENT_TAG = process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'unknown'

if (IS_TRACING_ENABLED) {
  initLogger({
    apiKey: BRAINTRUST_API_KEY,
    ...(BRAINTRUST_PROJECT_ID
      ? { projectId: BRAINTRUST_PROJECT_ID }
      : { projectName: 'Assistant' }),
    asyncFlush: true,
  })
}
