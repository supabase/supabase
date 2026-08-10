import { describe, expect, it } from 'vitest'

import {
  resolveEffectiveGitHubConfig,
  resolveEffectiveGitHubConfigWithLayers,
  resolveGitHubConfigResponse,
} from './github-config-effective'

describe('resolveEffectiveGitHubConfig', () => {
  it('deep-merges the production override onto the base configuration', () => {
    const config = {
      auth: {
        site_url: 'https://base.example.com',
        external: { github: { enabled: false } },
      },
      env: {
        production: { auth: { site_url: 'https://production.example.com' } },
        preview: { auth: { site_url: 'https://preview.example.com' } },
        development: { auth: { site_url: 'http://localhost:3000' } },
      },
    }

    expect(resolveEffectiveGitHubConfig(config, { target: 'production' })).toEqual({
      auth: {
        site_url: 'https://production.example.com',
        external: { github: { enabled: false } },
      },
    })

    expect(resolveEffectiveGitHubConfigWithLayers(config, { target: 'production' }).layers).toEqual(
      [
        { kind: 'base', path: 'base' },
        { kind: 'environment', path: 'env.production' },
      ]
    )
  })

  it('deep-merges the development override without applying production or preview', () => {
    const config = {
      auth: { site_url: 'https://base.example.com', email: { enable_signup: true } },
      env: {
        production: { auth: { site_url: 'https://production.example.com' } },
        preview: { auth: { site_url: 'https://preview.example.com' } },
        development: {
          auth: { site_url: 'http://localhost:3000', email: { enable_signup: false } },
        },
      },
    }

    expect(resolveEffectiveGitHubConfig(config, { target: 'development' })).toEqual({
      auth: {
        site_url: 'http://localhost:3000',
        email: { enable_signup: false },
      },
    })
  })

  it('deep-merges preview-wide config with the exact feat/google-auth branch override', () => {
    const config = {
      auth: {
        site_url: 'https://production.example.com',
        external: { github: { enabled: false, client_id: 'base-client' } },
      },
      env: {
        development: { auth: { site_url: 'http://localhost:3000' } },
        production: { auth: { site_url: 'https://unused-production.example.com' } },
        preview: {
          auth: {
            site_url: 'https://preview.example.com',
            external: { github: { client_id: 'preview-client' } },
          },
          branches: {
            'feat/google-auth': {
              auth: { external: { github: { enabled: true } } },
            },
            feat: {
              auth: { site_url: 'https://must-not-use-a-split-branch-path.example.com' },
            },
          },
        },
      },
    }

    expect(
      resolveEffectiveGitHubConfigWithLayers(config, {
        target: 'preview',
        gitBranch: 'feat/google-auth',
      })
    ).toEqual({
      config: {
        auth: {
          site_url: 'https://preview.example.com',
          external: { github: { enabled: true, client_id: 'preview-client' } },
        },
      },
      layers: [
        { kind: 'base', path: 'base' },
        { kind: 'environment', path: 'env.preview' },
        { kind: 'branch', path: 'env.preview.branches."feat/google-auth"' },
      ],
    })
  })

  it('reports only layers that exist for the selected target and exact branch', () => {
    const config = {
      auth: { site_url: 'https://base.example.com' },
      env: {
        preview: {
          branches: {
            'feat/other': { auth: { site_url: 'https://other.example.com' } },
          },
        },
      },
    }

    expect(
      resolveEffectiveGitHubConfigWithLayers(config, {
        target: 'preview',
        gitBranch: 'feat/requested',
      })
    ).toEqual({
      config: { auth: { site_url: 'https://base.example.com' } },
      layers: [
        { kind: 'base', path: 'base' },
        { kind: 'environment', path: 'env.preview' },
      ],
    })
  })

  it('treats slashes and dots as literal characters in a branch key', () => {
    const config = {
      auth: { site_url: 'https://production.example.com' },
      env: {
        preview: {
          auth: { site_url: 'https://preview.example.com' },
          branches: {
            'feat/google-auth.v2': { auth: { site_url: 'https://branch.example.com' } },
            'feat/google-auth': { auth: { site_url: 'https://other-branch.example.com' } },
          },
        },
      },
    }

    expect(
      resolveEffectiveGitHubConfig(config, {
        target: 'preview',
        gitBranch: 'feat/google-auth.v2',
      })
    ).toEqual({ auth: { site_url: 'https://branch.example.com' } })
  })

  it('replaces arrays and scalars while null and $delete remove sibling keys', () => {
    const config = {
      auth: {
        additional_redirect_urls: ['https://production.example.com/callback'],
        email: { enable_signup: true, double_confirm_changes: true, otp_length: 6 },
      },
      env: {
        preview: {
          auth: {
            additional_redirect_urls: ['https://preview.example.com/callback'],
            email: {
              $delete: ['double_confirm_changes'],
              enable_signup: false,
              otp_length: null,
            },
          },
        },
      },
    }

    expect(resolveEffectiveGitHubConfig(config, { target: 'preview' })).toEqual({
      auth: {
        additional_redirect_urls: ['https://preview.example.com/callback'],
        email: { enable_signup: false },
      },
    })
  })

  it('keeps source metadata while using the requested branch after a file-fetch fallback', () => {
    const response = {
      source: {
        repository: 'MildTomato/toml-test-app',
        branch: 'main',
        path: 'supabase/config.toml',
        format: 'toml' as const,
        sha: 'abc123',
        htmlUrl: 'https://github.com/MildTomato/toml-test-app/blob/main/supabase/config.toml',
      },
      managedPaths: ['auth.site_url'],
      config: {
        auth: { site_url: 'https://production.example.com' },
        env: {
          preview: {
            branches: {
              'feat/google-auth': { auth: { site_url: 'https://google-auth.example.com' } },
            },
          },
        },
      },
    }

    const resolved = resolveGitHubConfigResponse(response, {
      target: 'preview',
      gitBranch: 'feat/google-auth',
    })

    expect(resolved.source).toBe(response.source)
    expect(resolved.managedPaths).toBe(response.managedPaths)
    expect(resolved.config).toEqual({ auth: { site_url: 'https://google-auth.example.com' } })
  })
})
