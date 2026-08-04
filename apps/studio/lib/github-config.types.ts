export type GitHubConfigFormat = 'json' | 'toml'

export interface GitHubConfigSource {
  repository: string
  branch: string
  path: string
  format: GitHubConfigFormat
  sha: string
  htmlUrl: string | null
}

export interface GitHubConfigResponse {
  source: GitHubConfigSource
  config: Record<string, unknown>
  managedPaths: string[]
}

export interface GitHubConfigErrorResponse {
  error: {
    code: string
    message: string
  }
}
