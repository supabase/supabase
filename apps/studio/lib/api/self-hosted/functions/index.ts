import { assertSelfHosted } from '../util'
import { FileSystemFunctionsArtifactStore } from './fileSystemStore'

/**
 * Without EDGE_FUNCTIONS_MANAGEMENT_FOLDER the store has no folder, so it lists no functions
 * and the dashboard shows the empty state.
 */
export function getFunctionsArtifactStore() {
  assertSelfHosted()

  return new FileSystemFunctionsArtifactStore(
    process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER || undefined
  )
}
