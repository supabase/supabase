import { describe, expect, it } from 'vitest'

import { convertProjectConfigToGitHubConfig } from './github-config-convert'

describe('convertProjectConfigToGitHubConfig', () => {
  it('returns an empty object when no dashboard config is provided', () => {
    expect(convertProjectConfigToGitHubConfig()).toEqual({})
  })

  it('maps registered fields onto their nested config.toml path', () => {
    const result = convertProjectConfigToGitHubConfig({
      auth: {
        site_url: 'https://example.com',
        disable_signup: false,
        mailer_otp_length: 6,
      },
      api: {
        max_rows: 1000,
      },
    })

    expect(result).toEqual({
      auth: {
        site_url: 'https://example.com',
        enable_signup: true,
        email: { otp_length: 6 },
      },
      api: { max_rows: 1000 },
    })
  })

  it('inverts booleans that config.toml expresses the opposite way', () => {
    const result = convertProjectConfigToGitHubConfig({
      auth: { disable_signup: true },
    })

    expect(result).toEqual({ auth: { enable_signup: false } })
  })

  it('omits fields it has no conversion mapping for, secret-named or not', () => {
    const result = convertProjectConfigToGitHubConfig({
      auth: {
        sms_twilio_auth_token: 'super-secret',
        some_unregistered_field: 'value',
      },
    })

    expect(result).toEqual({})
  })

  it('skips sections that are absent from the dashboard config', () => {
    const result = convertProjectConfigToGitHubConfig({ database: { some_field: 'x' } })
    expect(result).toEqual({})
  })

  describe('auth.additional_redirect_urls', () => {
    it('splits the comma-separated list, then dedupes, trims and sorts it', () => {
      const result = convertProjectConfigToGitHubConfig({
        auth: { uri_allow_list: 'https://b.com, https://a.com ,https://b.com' },
      })

      expect(result).toEqual({
        auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] },
      })
    })

    it('maps an empty list to an empty array, not to an absent field', () => {
      const result = convertProjectConfigToGitHubConfig({ auth: { uri_allow_list: '' } })

      expect(result).toEqual({ auth: { additional_redirect_urls: [] } })
    })

    it('omits the field when the dashboard has no list at all', () => {
      const result = convertProjectConfigToGitHubConfig({ auth: { site_url: 'https://a.com' } })

      expect(result).toEqual({ auth: { site_url: 'https://a.com' } })
    })
  })

  it('leaves order-sensitive comma lists in their original order', () => {
    // Only the redirect allow-list is a set — `extra_search_path` order is meaningful to Postgres.
    const result = convertProjectConfigToGitHubConfig({
      api: { db_extra_search_path: 'public, extensions, auth' },
    })

    expect(result).toEqual({ api: { extra_search_path: ['public', 'extensions', 'auth'] } })
  })

  describe('db.network_restrictions', () => {
    it('derives enabled from status and splits allowed CIDRs by type', () => {
      const result = convertProjectConfigToGitHubConfig({
        database: {
          network_restrictions: {
            status: 'applied',
            allowed_cidrs: [
              { type: 'v4', address: '10.0.0.0/24' },
              { type: 'v6', address: '::1/128' },
            ],
          },
        },
      })

      expect(result).toEqual({
        db: {
          network_restrictions: {
            enabled: true,
            allowed_cidrs: ['10.0.0.0/24'],
            allowed_cidrs_v6: ['::1/128'],
          },
        },
      })
    })
  })

  describe('db.pooler', () => {
    it('maps the top-level dashboard pooler section under db.pooler', () => {
      const result = convertProjectConfigToGitHubConfig({
        pooler: { pool_mode: 'transaction', default_pool_size: 20, max_client_conn: 100 },
      })

      expect(result).toEqual({
        db: { pooler: { pool_mode: 'transaction', default_pool_size: 20, max_client_conn: 100 } },
      })
    })
  })

  describe('storage', () => {
    it('maps file_size_limit and renames feature flags onto their config.toml fields', () => {
      const result = convertProjectConfigToGitHubConfig({
        storage: {
          file_size_limit: 52428800,
          features: {
            s3_protocol: { enabled: true },
            iceberg_catalog: {
              enabled: true,
              max_namespaces: 10,
              max_tables: 100,
              max_catalogs: 5,
            },
            vector_buckets: { enabled: false, max_buckets: 2, max_indexes: 4 },
          },
        },
      })

      expect(result).toEqual({
        storage: {
          file_size_limit: 52428800,
          s3_protocol: { enabled: true },
          analytics: { enabled: true, max_namespaces: 10, max_tables: 100, max_catalogs: 5 },
          vector: { enabled: false, max_buckets: 2, max_indexes: 4 },
        },
      })
    })
  })

  describe('auth.password_requirements', () => {
    it('maps NO_REQUIRED_CHARS and null to an empty string', () => {
      expect(
        convertProjectConfigToGitHubConfig({
          auth: { password_required_characters: 'NO_REQUIRED_CHARS' },
        })
      ).toEqual({ auth: { password_requirements: '' } })

      expect(
        convertProjectConfigToGitHubConfig({ auth: { password_required_characters: null } })
      ).toEqual({ auth: { password_requirements: '' } })
    })

    it('passes through any other value unchanged', () => {
      const result = convertProjectConfigToGitHubConfig({
        auth: { password_required_characters: 'abcdefgABCDEFG01234' },
      })

      expect(result).toEqual({ auth: { password_requirements: 'abcdefgABCDEFG01234' } })
    })
  })
})
