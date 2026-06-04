export interface MergedFile {
  path: string
  content: string
  sources: string[]
}

export interface MergeResult {
  files: MergedFile[]
  compositionId: string
  warnings: string[]
}

export interface CompositionManifest {
  compositionId: string
  generatedAt: string
  templates: string[]
  files: Array<{
    path: string
    sources: string[]
  }>
  warnings: string[]
}
