import { initLogger } from 'braintrust'

const BRAINTRUST_API_KEY = process.env.BRAINTRUST_API_KEY
const BRAINTRUST_PROJECT_ID = process.env.BRAINTRUST_PROJECT_ID

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'

// NOTE(mattrossman): Temporary killswitch to disable tracing in production
export const IS_TRACING_ENABLED =
  BRAINTRUST_API_KEY !== undefined && BRAINTRUST_PROJECT_ID !== undefined && !IS_PRODUCTION

if (IS_TRACING_ENABLED) {
  initLogger({
    apiKey: BRAINTRUST_API_KEY,
    projectId: BRAINTRUST_PROJECT_ID,
  })
}
