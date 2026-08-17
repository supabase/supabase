export interface GitHubConfigSource {
  repository: string
  branch: string
  path: string
  htmlUrl: string | null
}

export interface GitHubConfigResponse {
  source: GitHubConfigSource
  config: Record<string, unknown>
}
