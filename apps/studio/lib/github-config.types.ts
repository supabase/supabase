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
  /** Original file bytes, used by Studio writes to preserve formatting and comments. */
  originalContent?: string
}

export interface GitHubConfigErrorResponse {
  error: {
    code: string
    message: string
  }
}

export interface GitHubConfigPullRequestRequest {
  action: 'accept-remote-changes'
  projectRef: string
  expectedSourceSha: string
  target: 'production' | 'preview'
  gitBranch?: string
}

export interface GitHubConfigPullRequestResponse {
  pullRequestUrl: string
  pullRequestNumber: number
  pullRequestTitle: string
  branch: string
  commitSha: string
  affectedPaths: string[]
}
