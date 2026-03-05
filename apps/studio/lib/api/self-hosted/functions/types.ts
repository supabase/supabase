export type FunctionArtifact = {
  slug: string
  entrypoint_path: string
  created_at: number
  updated_at: number
}

export type FunctionFileEntry = {
  /** Absolute path on disk */
  absolutePath: string
  /** Path relative to the function folder, used as the multipart filename */
  relativePath: string
  size: number
}
