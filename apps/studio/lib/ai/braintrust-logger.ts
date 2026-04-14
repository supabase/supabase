import { initLogger } from 'braintrust'

const BRAINTRUST_API_KEY = process.env.BRAINTRUST_API_KEY
const BRAINTRUST_PROJECT_ID = process.env.BRAINTRUST_PROJECT_ID

export const IS_TRACING_ENABLED =
  BRAINTRUST_API_KEY !== undefined && BRAINTRUST_PROJECT_ID !== undefined

if (IS_TRACING_ENABLED) {
  initLogger({
    apiKey: BRAINTRUST_API_KEY,
    projectId: BRAINTRUST_PROJECT_ID,
  })
}

// Checks compliance flags for tracing and returns true only when all checks pass.
// Defaults to disabling tracing when states are unknown.
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
  // Disable tracing for orgs with a signed (or unknown) DPA status
  if (orgIsDpaSigned !== false) return false

  // Disable tracing for EU (or unknown) regions
  if (projectRegion === undefined || projectRegion.startsWith('eu-')) return false

  // Disable tracing for orgs with an unknown HIPAA addon state
  if (orgHasHipaaAddon === undefined) return false

  // Disable tracing for projects within a HIPAA-enabled org that are sensitive (or unknown sensitivity)
  if (orgHasHipaaAddon && projectIsSensitive !== false) return false

  return true
}
