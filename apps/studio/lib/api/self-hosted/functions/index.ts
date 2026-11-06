import assert from 'node:assert'

import { assertSelfHosted } from '../util'
import { FileSystemFunctionsArtifactStore } from './fileSystemStore'

export function getFunctionsArtifactStore() {
  assertSelfHosted()
  assert(
    process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER,
    'EDGE_FUNCTIONS_MANAGEMENT_FOLDER is required'
  )

  return new FileSystemFunctionsArtifactStore(process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER)
}
