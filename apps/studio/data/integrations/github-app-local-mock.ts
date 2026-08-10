import type { paths } from 'api-types'

type GitHubAuthorization =
  paths['/platform/integrations/github/authorization']['get']['responses']['200']['content']['application/json']
type GitHubRepositories =
  paths['/platform/integrations/github/repositories']['get']['responses']['200']['content']['application/json']
type GitHubConnections =
  paths['/platform/integrations/github/connections']['get']['responses']['200']['content']['application/json']

const MOCK_INSTALLATION_ID = 900_001
const MOCK_REPOSITORY_ID = 900_002
const DEFAULT_MOCK_BRANCH = 'main'

/**
 * Local-only fixture for developing the GitHub App connection UI without an
 * installed GitHub App. This is intentionally opt-in and read-only.
 */
export const isGitHubAppLocalMockEnabled = () =>
  process.env.NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK === 'true'

export function getGitHubAppLocalMock() {
  const repositoryName = process.env.NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_REPOSITORY?.trim()
  const projectRef = process.env.NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_PROJECT_REF?.trim()
  const defaultBranch =
    process.env.NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_DEFAULT_BRANCH?.trim() || DEFAULT_MOCK_BRANCH

  if (!repositoryName || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repositoryName)) {
    throw new Error(
      'NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_REPOSITORY must use the owner/repository format'
    )
  }
  if (!projectRef) {
    throw new Error('NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_PROJECT_REF is required')
  }

  const [repositoryOwner, repository] = repositoryName.split('/')

  return {
    authorization: {
      id: 900_003,
      sender_id: 900_004,
      user_id: 900_005,
    } satisfies GitHubAuthorization,
    repositories: {
      partial_response_due_to_sso: false,
      repositories: [
        {
          id: MOCK_REPOSITORY_ID,
          installation_id: MOCK_INSTALLATION_ID,
          name: repositoryName,
          default_branch: defaultBranch,
        },
      ],
    } satisfies GitHubRepositories,
    connections: {
      connections: [
        {
          id: 900_006,
          inserted_at: '2026-08-04T00:00:00.000Z',
          updated_at: '2026-08-04T00:00:00.000Z',
          branch_limit: 10,
          installation_id: MOCK_INSTALLATION_ID,
          new_branch_per_pr: true,
          supabase_changes_only: false,
          workdir: '',
          project: {
            id: 900_007,
            name: repository,
            ref: projectRef,
          },
          repository: {
            id: MOCK_REPOSITORY_ID,
            name: repositoryName,
          },
          user: {
            id: 900_005,
            primary_email: null,
            username: repositoryOwner,
          },
        },
      ],
    } satisfies GitHubConnections,
  }
}
