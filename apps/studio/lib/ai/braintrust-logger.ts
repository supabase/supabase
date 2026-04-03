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

// Returns true only when all compliance flags are explicitly confirmed off.
// Treats undefined as restricted — unknown state is not safe to trace.
export function isTracingAllowed({
  orgHasHipaaAddon,
  projectIsSensitive,
  orgIsDpaSigned,
  projectRegion,
}: {
  orgHasHipaaAddon: boolean | undefined
  projectIsSensitive: boolean | null | undefined
  orgIsDpaSigned: boolean | undefined
  projectRegion: string | undefined
}) {
  const isHipaaEnabled =
    orgHasHipaaAddon == null || projectIsSensitive == null
      ? undefined
      : orgHasHipaaAddon && projectIsSensitive
  const isEuRegion = projectRegion === undefined ? undefined : projectRegion.startsWith('eu-')
  return isHipaaEnabled === false && orgIsDpaSigned === false && isEuRegion === false
}
