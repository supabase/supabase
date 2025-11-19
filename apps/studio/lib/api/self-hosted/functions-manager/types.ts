/**
 * Abstraction for storing and retrieving function artifacts across
 * different backends (local, remote, or cloud providers).
 */
export interface IFunctionsArtifactStore {
  getFunctions(): Promise<FunctionArtifact[]>
}

export type FunctionArtifact = {
  slug: string
  entrypoint_url: string
}

export type NewFunctionArtifactStore = {
  store: IFunctionsArtifactStore
  error: undefined
} | {
  store: undefined
  error: string
}
