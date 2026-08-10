import { afterEach, describe, expect, test, vi } from 'vitest'

import { getGitHubAppLocalMock, isGitHubAppLocalMockEnabled } from './github-app-local-mock'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('GitHub App local mock', () => {
  test('is disabled unless explicitly enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK', 'false')
    expect(isGitHubAppLocalMockEnabled()).toBe(false)

    vi.stubEnv('NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK', 'true')
    expect(isGitHubAppLocalMockEnabled()).toBe(true)
  })

  test('requires portable repository and project inputs when enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_REPOSITORY', '')
    vi.stubEnv('NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_PROJECT_REF', '')

    expect(() => getGitHubAppLocalMock()).toThrow(
      'NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_REPOSITORY must use the owner/repository format'
    )
  })

  test('uses env inputs consistently across the connection and repository list', () => {
    vi.stubEnv('NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_REPOSITORY', 'example/portable-repo')
    vi.stubEnv('NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_PROJECT_REF', 'abcdefghijklmnopqrst')
    vi.stubEnv('NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_DEFAULT_BRANCH', 'develop')

    const mock = getGitHubAppLocalMock()
    const repository = mock.repositories.repositories[0]
    const connection = mock.connections.connections[0]

    expect(repository).toMatchObject({
      name: 'example/portable-repo',
      default_branch: 'develop',
    })
    expect(connection).toMatchObject({
      installation_id: repository.installation_id,
      repository: { id: repository.id, name: repository.name },
      project: { name: 'portable-repo', ref: 'abcdefghijklmnopqrst' },
      user: { username: 'example' },
    })
  })

  test('defaults only the mock repository branch to main', () => {
    vi.stubEnv('NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_REPOSITORY', 'example/portable-repo')
    vi.stubEnv('NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_PROJECT_REF', 'abcdefghijklmnopqrst')
    vi.stubEnv('NEXT_PUBLIC_STUDIO_GITHUB_APP_MOCK_DEFAULT_BRANCH', '')

    expect(getGitHubAppLocalMock().repositories.repositories[0].default_branch).toBe('main')
  })
})
