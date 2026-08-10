import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ConfigurationDriftPage,
  ConfigurationDriftPageSkeleton,
  ConfigurationDriftResults,
} from './ConfigurationDriftPage'
import { customRender } from '@/tests/lib/custom-render'

const { createPullRequestMock, driftHookMock, mutateAsyncMock, permissionMock, refetchMock } =
  vi.hoisted(() => ({
    createPullRequestMock: vi.fn(),
    driftHookMock: vi.fn(),
    mutateAsyncMock: vi.fn(),
    permissionMock: vi.fn(),
    refetchMock: vi.fn(),
  }))

vi.mock('@/hooks/misc/useGitHubConfigDrift', () => ({
  useSelectedGitHubConfigDrift: driftHookMock,
}))

vi.mock('@/data/auth/auth-config-update-mutation', () => ({
  useAuthConfigUpdateMutation: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}))

vi.mock('@/data/config/github-config-pull-request-mutation', () => ({
  useGitHubConfigPullRequestMutation: () => ({
    mutateAsync: createPullRequestMock,
    isPending: false,
  }),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: permissionMock,
}))

const redirectUrlRow = {
  status: 'drifted' as const,
  fieldName: 'URI_ALLOW_LIST',
  configPath: 'auth.additional_redirect_urls',
  dashboardValue: ['https://dashboard.example.com'],
  githubValue: ['https://config.example.com'],
  settingLabel: 'Redirect URLs',
  settingHref: '/project/project-ref/auth/url-configuration',
  valueDiff: {
    kind: 'list' as const,
    onlyInDashboard: ['https://dashboard.example.com'],
    onlyInConfig: ['https://config.example.com'],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  permissionMock.mockReturnValue({ can: true, isLoading: false, isSuccess: true })
  mutateAsyncMock.mockResolvedValue({})
  createPullRequestMock.mockResolvedValue({
    pullRequestUrl: 'https://github.com/example/project/pull/42',
    pullRequestNumber: 42,
    pullRequestTitle: 'Accept remote configuration',
    branch: 'studio/config-drift-test',
    commitSha: 'commit-sha',
    affectedPaths: ['auth.additional_redirect_urls'],
  })
  refetchMock.mockResolvedValue([])
})

describe('ConfigurationDriftPageSkeleton', () => {
  it('reserves the source and results regions while loading', () => {
    customRender(<ConfigurationDriftPageSkeleton />)

    const skeleton = screen.getByLabelText('Loading configuration drift')
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
    expect(skeleton.children).toHaveLength(2)
  })
})

describe('ConfigurationDriftResults', () => {
  it('shows semantic URL differences and exposes per-setting actions', async () => {
    const user = userEvent.setup()
    const onAcceptRemoteChanges = vi.fn()
    const onResetOne = vi.fn()
    const onRestoreAll = vi.fn()

    customRender(
      <ConfigurationDriftResults
        rows={[redirectUrlRow]}
        onAcceptRemoteChanges={onAcceptRemoteChanges}
        onResetOne={onResetOne}
        onRestoreAll={onRestoreAll}
      />
    )

    expect(screen.getByText('1 setting differs')).toBeVisible()
    expect(screen.getByText('Only in current environment')).toBeVisible()
    expect(screen.getByText('https://dashboard.example.com')).toBeVisible()
    expect(screen.getByText('Only in config.toml')).toBeVisible()
    expect(screen.getByText('https://config.example.com')).toBeVisible()
    expect(screen.queryByText(/ahead/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Actions for Redirect URLs' }))
    expect(await screen.findByRole('menuitem', { name: 'Open setting' })).toHaveAttribute(
      'href',
      '/project/project-ref/auth/url-configuration'
    )
    await user.click(screen.getByRole('menuitem', { name: 'Reset to config.toml' }))
    expect(onResetOne).toHaveBeenCalledWith(redirectUrlRow)

    const acceptAction = screen.getByRole('button', {
      name: /Accept current environment values\s*Create one pull request/,
    })
    const restoreAction = screen.getByRole('button', {
      name: /Restore all from config.toml\s*Apply every intended value now/,
    })
    fireEvent.click(acceptAction)
    fireEvent.click(restoreAction)

    expect(onAcceptRemoteChanges).toHaveBeenCalledOnce()
    expect(onRestoreAll).toHaveBeenCalledOnce()
  })

  it('permission-gates restoring the live setting', () => {
    customRender(
      <ConfigurationDriftResults
        rows={[redirectUrlRow]}
        canRestoreLiveSetting={false}
        onRestoreAll={vi.fn()}
      />
    )

    expect(
      screen.getByRole('button', {
        name: /Restore all from config.toml\s*Apply every intended value now/,
      })
    ).toBeDisabled()
  })
})

describe('ConfigurationDriftPage source resolution', () => {
  it('shows the literal GitHub config for the production target', () => {
    driftHookMock.mockReturnValue({
      requestedGitBranch: undefined,
      target: 'production',
      source: {
        repository: 'example/project',
        branch: 'main',
        path: 'supabase/config.toml',
        format: 'toml',
        sha: 'source-sha',
        htmlUrl: 'https://github.com/example/project/blob/main/supabase/config.toml',
      },
      configContent:
        '[auth]\nsite_url = "https://base.example.com"\n\n[env.production.auth]\nsite_url = "https://production.example.com"\n',
      hasSourceBranchFallback: false,
      summary: { managedCount: 0, driftedFields: [] },
      isReady: true,
      isPending: false,
      isFetching: false,
      isError: false,
      error: undefined,
      refetch: refetchMock,
    })

    customRender(<ConfigurationDriftPage />)

    expect(screen.getByText('Production')).toBeVisible()
    expect(screen.getByText('Repository default')).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Repository default' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'config.toml on GitHub (opens in new tab)' })
    ).toHaveAttribute('href', 'https://github.com/example/project/blob/main/supabase/config.toml')
    expect(
      screen.getByRole('link', { name: 'example/project repository (opens in new tab)' })
    ).toHaveAttribute('href', 'https://github.com/example/project')
    expect(
      screen.getByRole('link', { name: 'main source branch (opens in new tab)' })
    ).toHaveAttribute('href', 'https://github.com/example/project/tree/main')
    expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument()
    const config = screen.getByLabelText('GitHub config.toml with configuration conflicts')
    expect(within(config).getByText('Base')).toBeVisible()
    expect(within(config).getByText('All environments')).toBeVisible()
    expect(within(config).getByText('Production')).toBeVisible()
    expect(config).toHaveTextContent('[auth]')
    expect(config).toHaveTextContent('[env.production.auth]')
    expect(config).toHaveTextContent('"https://base.example.com"')
    expect(config).toHaveTextContent('"https://production.example.com"')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('describes preview and branch overrides and shows a fallback source branch notice', () => {
    driftHookMock.mockReturnValue({
      requestedGitBranch: 'feat/google-auth.v2',
      target: 'preview',
      source: {
        repository: 'example/project',
        branch: 'main',
        path: 'supabase/config.toml',
        format: 'toml',
        sha: 'source-sha',
        htmlUrl: 'https://github.com/example/project/blob/main/supabase/config.toml',
      },
      configContent:
        '[auth]\nsite_url = "https://base.example.com"\n\n[env.preview.auth]\nsite_url = "https://preview.example.com"\n\n[env.preview.branches."feat/google-auth.v2".auth]\nadditional_redirect_urls = ["https://branch.example.com/callback"]\n',
      hasSourceBranchFallback: true,
      summary: { managedCount: 0, driftedFields: [] },
      isReady: true,
      isPending: false,
      isFetching: false,
      isError: false,
      error: undefined,
      refetch: refetchMock,
    })

    customRender(<ConfigurationDriftPage />)

    expect(screen.getByText('Preview')).toBeVisible()
    const requestedBranchLink = screen.getByRole('link', {
      name: 'feat/google-auth.v2 (opens in new tab)',
    })
    expect(requestedBranchLink).toHaveAttribute(
      'href',
      'https://github.com/example/project/tree/feat/google-auth.v2'
    )
    expect(requestedBranchLink).toHaveAttribute('target', '_blank')
    expect(requestedBranchLink).toHaveAttribute('rel', 'noopener noreferrer')
    const config = screen.getByLabelText('GitHub config.toml with configuration conflicts')
    expect(within(config).getByText('Base')).toBeVisible()
    expect(within(config).getByText('All environments')).toBeVisible()
    expect(within(config).getByText('Preview')).toBeVisible()
    expect(config).toHaveTextContent('[env.preview.auth]')
    expect(config).toHaveTextContent('[env.preview.branches."feat/google-auth.v2".auth]')

    const fallbackNotice = screen.getByRole('status')
    expect(fallbackNotice).toHaveTextContent('Requested branch config was not found.')
    expect(fallbackNotice).toHaveTextContent('feat/google-auth.v2')
    expect(fallbackNotice).toHaveTextContent('main')
    expect(fallbackNotice).toHaveTextContent('supabase/config.toml')
  })

  it('explains when only the shared configuration is active', () => {
    driftHookMock.mockReturnValue({
      requestedGitBranch: undefined,
      target: 'production',
      source: {
        repository: 'example/project',
        branch: 'main',
        path: 'supabase/config.toml',
        format: 'toml',
        sha: 'source-sha',
        htmlUrl: 'https://github.com/example/project/blob/main/supabase/config.toml',
      },
      configContent: '[auth]\nenable_signup = true\n',
      hasSourceBranchFallback: false,
      summary: { managedCount: 0, driftedFields: [] },
      isReady: true,
      isPending: false,
      isFetching: false,
      isError: false,
      error: undefined,
      refetch: refetchMock,
    })

    customRender(<ConfigurationDriftPage />)

    expect(
      screen.getByLabelText('GitHub config.toml with configuration conflicts')
    ).toHaveTextContent('enable_signup = true')
  })
})

describe('ConfigurationDriftPage restore flow', () => {
  it('resets one selected setting without changing the other drifted settings', async () => {
    const user = userEvent.setup()
    driftHookMock.mockReturnValue({
      source: undefined,
      summary: {
        managedCount: 0,
        driftedFields: [
          {
            fieldName: 'URI_ALLOW_LIST',
            configPath: 'auth.additional_redirect_urls',
            dashboardValue: ['https://dashboard.example.com'],
            githubValue: ['https://config.example.com'],
          },
          {
            fieldName: 'SITE_URL',
            configPath: 'auth.site_url',
            dashboardValue: 'https://dashboard.example.com',
            githubValue: 'https://site.config.example.com',
          },
        ],
      },
      isReady: true,
      isPending: false,
      isFetching: false,
      isError: false,
      error: undefined,
      refetch: refetchMock,
    })

    customRender(<ConfigurationDriftPage />)

    await user.click(screen.getByRole('button', { name: 'Actions for Site URL' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Reset to config.toml' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Reset Site URL to config.toml?')).toBeVisible()
    expect(within(dialog).getByText('https://site.config.example.com')).toBeVisible()
    expect(within(dialog).queryByText('https://config.example.com')).not.toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Reset setting' }))

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        projectRef: 'default',
        config: { SITE_URL: 'https://site.config.example.com' },
      })
      expect(refetchMock).toHaveBeenCalledOnce()
    })
  })

  it('confirms every intended value before patching the complete drift set once', async () => {
    driftHookMock.mockReturnValue({
      source: undefined,
      summary: {
        managedCount: 0,
        driftedFields: [
          {
            fieldName: 'URI_ALLOW_LIST',
            configPath: 'auth.additional_redirect_urls',
            dashboardValue: ['https://dashboard.example.com'],
            githubValue: ['https://config.example.com'],
          },
          {
            fieldName: 'SITE_URL',
            configPath: 'auth.site_url',
            dashboardValue: 'https://dashboard.example.com',
            githubValue: 'https://site.config.example.com',
          },
        ],
      },
      isReady: true,
      isPending: false,
      isFetching: false,
      isError: false,
      error: undefined,
      refetch: refetchMock,
    })

    customRender(<ConfigurationDriftPage />)

    fireEvent.click(
      screen.getByRole('button', {
        name: /Restore all from config.toml\s*Apply every intended value now/,
      })
    )

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('config.toml')).toBeVisible()
    expect(within(dialog).getByText('Current environment')).toBeVisible()
    expect(within(dialog).getByText('https://config.example.com')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Restore all settings' }))

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        projectRef: 'default',
        config: {
          URI_ALLOW_LIST: 'https://config.example.com',
          SITE_URL: 'https://site.config.example.com',
        },
      })
      expect(refetchMock).toHaveBeenCalledOnce()
    })
  })

  it('confirms accepting all current environment values and creates one PR without changing the runtime', async () => {
    driftHookMock.mockReturnValue({
      gitBranch: undefined,
      target: 'production',
      source: {
        repository: 'example/project',
        branch: 'main',
        path: 'supabase/config.toml',
        format: 'toml',
        sha: 'source-sha',
        htmlUrl: 'https://github.com/example/project/blob/main/supabase/config.toml',
      },
      summary: {
        managedCount: 0,
        driftedFields: [
          {
            fieldName: 'URI_ALLOW_LIST',
            configPath: 'auth.additional_redirect_urls',
            dashboardValue: ['https://dashboard.example.com'],
            githubValue: ['https://config.example.com'],
          },
        ],
      },
      isReady: true,
      isPending: false,
      isFetching: false,
      isError: false,
      error: undefined,
      refetch: refetchMock,
    })

    customRender(<ConfigurationDriftPage />)
    fireEvent.click(
      screen.getByRole('button', {
        name: /Accept current environment values\s*Create one pull request/,
      })
    )

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Accept all 1 current environment values?')).toBeVisible()
    expect(within(dialog).getByText('Current environment')).toBeVisible()
    expect(within(dialog).getByText('config.toml pull request')).toBeVisible()
    expect(within(dialog).getByText('https://dashboard.example.com')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Create pull request' }))

    await waitFor(() => {
      expect(createPullRequestMock).toHaveBeenCalledWith({
        action: 'accept-remote-changes',
        projectRef: 'default',
        expectedSourceSha: 'source-sha',
        target: 'production',
        gitBranch: undefined,
      })
    })
    const pullRequestLink = await screen.findByRole('link', { name: 'View on GitHub' })
    expect(pullRequestLink).toHaveAttribute('href', 'https://github.com/example/project/pull/42')
    const pullRequestSection = screen.getByLabelText('Pull request #42')
    expect(within(pullRequestSection).getByText('Pull request')).toBeVisible()
    expect(within(pullRequestSection).getByText('#42')).toBeVisible()
    expect(within(pullRequestSection).getByText('Accept remote configuration')).toBeVisible()
    expect(within(pullRequestSection).getByText('Open · studio/config-drift-test')).toBeVisible()
    expect(
      screen.queryByRole('button', {
        name: /Accept current environment values\s*Create one pull request/,
      })
    ).not.toBeInTheDocument()
    expect(mutateAsyncMock).not.toHaveBeenCalled()
  })
})
