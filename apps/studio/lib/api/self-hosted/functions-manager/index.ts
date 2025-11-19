import { IS_PLATFORM } from 'common'
import { FileSystemFunctionsArtifactStore } from './fileSystemFunctionsArtifactStore'
import { NewFunctionArtifactStore } from './types'

export function getFunctionsArtifactStore(): NewFunctionArtifactStore {
  if (IS_PLATFORM)
    return { store: undefined, error: "custom 'FunctionsArtifactStore'not available on platform" }

  return FileSystemFunctionsArtifactStore.new()
}
