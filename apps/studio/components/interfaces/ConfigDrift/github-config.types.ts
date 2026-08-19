import { z } from 'zod'

export interface GitHubConfigSource {
  repository: string
  branch: string
  path: string
  htmlUrl: string | null
}

// Mirrors the shape produced by parsing a project's `supabase/config.toml`.
// Every field is optional since config.toml sections are all opt-in, and
// objects allow unknown keys since users can add custom sections/providers.
export const gitHubConfigTomlSchema = z.object({
  project_id: z.string().optional(),
  api: z
    .object({
      enabled: z.boolean().optional(),
      port: z.number().optional(),
      schemas: z.array(z.string()).optional(),
      extra_search_path: z.array(z.string()).optional(),
      max_rows: z.number().optional(),
      tls: z.object({ enabled: z.boolean().optional() }).passthrough().optional(),
    })
    .passthrough()
    .optional(),
  db: z
    .object({
      port: z.number().optional(),
      shadow_port: z.number().optional(),
      major_version: z.number().optional(),
      pooler: z
        .object({
          enabled: z.boolean().optional(),
          port: z.number().optional(),
          pool_mode: z.string().optional(),
          default_pool_size: z.number().optional(),
          max_client_conn: z.number().optional(),
        })
        .passthrough()
        .optional(),
      migrations: z
        .object({
          enabled: z.boolean().optional(),
          schema_paths: z.array(z.string()).optional(),
        })
        .passthrough()
        .optional(),
      seed: z
        .object({
          enabled: z.boolean().optional(),
          sql_paths: z.array(z.string()).optional(),
        })
        .passthrough()
        .optional(),
      network_restrictions: z
        .object({
          enabled: z.boolean().optional(),
          allowed_cidrs: z.array(z.string()).optional(),
          allowed_cidrs_v6: z.array(z.string()).optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough()
    .optional(),
  realtime: z.object({ enabled: z.boolean().optional() }).passthrough().optional(),
  studio: z
    .object({
      enabled: z.boolean().optional(),
      port: z.number().optional(),
      api_url: z.string().optional(),
      openai_api_key: z.string().optional(),
    })
    .passthrough()
    .optional(),
  inbucket: z
    .object({ enabled: z.boolean().optional(), port: z.number().optional() })
    .passthrough()
    .optional(),
  storage: z
    .object({
      enabled: z.boolean().optional(),
      file_size_limit: z.union([z.string(), z.number()]).optional(),
      s3_protocol: z.object({ enabled: z.boolean().optional() }).passthrough().optional(),
      analytics: z
        .object({
          enabled: z.boolean().optional(),
          max_namespaces: z.number().optional(),
          max_tables: z.number().optional(),
          max_catalogs: z.number().optional(),
        })
        .passthrough()
        .optional(),
      vector: z
        .object({
          enabled: z.boolean().optional(),
          max_buckets: z.number().optional(),
          max_indexes: z.number().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough()
    .optional(),
  auth: z
    .object({
      enabled: z.boolean().optional(),
      site_url: z.string().nullable().optional(),
      additional_redirect_urls: z.array(z.string()).optional(),
      jwt_expiry: z.number().optional(),
      enable_refresh_token_rotation: z.boolean().optional(),
      refresh_token_reuse_interval: z.number().optional(),
      enable_signup: z.boolean().optional(),
      enable_anonymous_sign_ins: z.boolean().optional(),
      enable_manual_linking: z.boolean().optional(),
      minimum_password_length: z.number().optional(),
      password_requirements: z.string().nullable().optional(),
      rate_limit: z
        .object({
          email_sent: z.number().optional(),
          sms_sent: z.number().optional(),
          anonymous_users: z.number().optional(),
          token_refresh: z.number().optional(),
          sign_in_sign_ups: z.number().optional(),
          token_verifications: z.number().optional(),
          web3: z.number().optional(),
        })
        .passthrough()
        .optional(),
      email: z
        .object({
          enable_signup: z.boolean().optional(),
          double_confirm_changes: z.boolean().optional(),
          enable_confirmations: z.boolean().optional(),
          secure_password_change: z.boolean().optional(),
          max_frequency: z.string().optional(),
          otp_length: z.number().optional(),
          otp_expiry: z.number().optional(),
          template: z
            .record(
              z.string(),
              z
                .object({ subject: z.string().optional(), content_path: z.string().optional() })
                .passthrough()
            )
            .optional(),
        })
        .passthrough()
        .optional(),
      sms: z
        .object({
          enable_signup: z.boolean().optional(),
          enable_confirmations: z.boolean().optional(),
          template: z.string().nullable().optional(),
          max_frequency: z.string().optional(),
          provider: z.string().nullable().optional(),
          twilio: z
            .object({
              enabled: z.boolean().optional(),
              account_sid: z.string().nullable().optional(),
              message_service_sid: z.string().nullable().optional(),
              auth_token: z.string().optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough()
        .optional(),
      mfa: z
        .object({
          max_enrolled_factors: z.number().optional(),
          totp: z
            .object({
              enroll_enabled: z.boolean().optional(),
              verify_enabled: z.boolean().optional(),
            })
            .passthrough()
            .optional(),
          phone: z
            .object({
              enroll_enabled: z.boolean().optional(),
              verify_enabled: z.boolean().optional(),
              otp_length: z.number().optional(),
              template: z.string().optional(),
              max_frequency: z.string().optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough()
        .optional(),
      external: z
        .record(
          z.string(),
          z
            .object({
              enabled: z.boolean().optional(),
              client_id: z.string().nullable().optional(),
              secret: z.string().nullable().optional(),
              redirect_uri: z.string().nullable().optional(),
              url: z.string().nullable().optional(),
              skip_nonce_check: z.boolean().optional(),
              email_optional: z.boolean().optional(),
            })
            .passthrough()
        )
        .optional(),
      web3: z
        .object({
          solana: z.object({ enabled: z.boolean().optional() }).passthrough().optional(),
        })
        .passthrough()
        .optional(),
      third_party: z
        .record(z.string(), z.object({ enabled: z.boolean().optional() }).passthrough())
        .optional(),
      oauth_server: z
        .object({
          enabled: z.boolean().optional(),
          authorization_url_path: z.string().optional(),
          allow_dynamic_registration: z.boolean().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough()
    .optional(),
  functions: z
    .record(z.string(), z.object({ verify_jwt: z.boolean().optional() }).passthrough())
    .optional(),
  edge_runtime: z
    .object({
      enabled: z.boolean().optional(),
      policy: z.string().optional(),
      inspector_port: z.number().optional(),
      deno_version: z.number().optional(),
    })
    .passthrough()
    .optional(),
  analytics: z
    .object({
      enabled: z.boolean().optional(),
      port: z.number().optional(),
      backend: z.string().optional(),
    })
    .passthrough()
    .optional(),
  remotes: z
    .record(z.string(), z.object({ project_id: z.string().optional() }).passthrough())
    .optional(),
  experimental: z
    .object({
      orioledb_version: z.string().optional(),
      s3_host: z.string().optional(),
      s3_region: z.string().optional(),
      s3_access_key: z.string().optional(),
      s3_secret_key: z.string().optional(),
    })
    .passthrough()
    .optional(),
})

export type GitHubConfigToml = z.infer<typeof gitHubConfigTomlSchema>
