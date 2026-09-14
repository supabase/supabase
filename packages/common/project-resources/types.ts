export type ProjectFramework =
  | 'nextjs'
  | 'nuxt'
  | 'tanstack'
  | 'react-router'
  | 'flutter'
  | 'generic'

export type ProjectFile = { path: string; content?: string }

export type ProjectResource = {
  id: string
  kind: 'table' | 'edge-function' | 'api-route' | 'page'
  name: string
  files: string[]
  schema?: string
  route?: string
}

export type ProjectResourceDiagnostic = {
  code:
    | 'invalid-input'
    | 'conflicting-file'
    | 'missing-content'
    | 'invalid-sql'
    | 'unsupported-sql'
    | 'ambiguous-schema'
    | 'invalid-function-config'
    | 'missing-function-entrypoint'
    | 'ambiguous-route'
  message: string
  files: string[]
}

export type ProjectResourceAnalysis = {
  resources: ProjectResource[]
  diagnostics: ProjectResourceDiagnostic[]
}

export type ProjectResourceOptions = { framework?: ProjectFramework }
