import type { SupabaseClient } from '@supabase/supabase-js'

import { createRowOps } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/supabase-rows'
import { createStorageOps } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/supabase-storage'
import type {
  AuthConfig,
  LogsResult,
  PlatformAdapter,
  Secret,
  Suggestion,
  UserRecord,
} from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/types'
import {
  createManagementApiClient,
  type ManagementApiClient,
} from '@/registry/default/platform/platform-kit-nextjs/lib/management-api'

export interface ManagementTransport {
  /** Base URL of the consumer's Management API proxy (token injected server-side). */
  baseUrl: string
  /** Project ref for Management API calls; defaults to the adapter's projectRef. */
  projectRef?: string
  headers?: Record<string, string>
  fetch?: typeof fetch
}

export interface CreateSupabaseAdapterOptions {
  /** supabase-js client — the data/auth/storage plane. */
  supabase: SupabaseClient
  /** Project ref, used for introspection identity and the dashboard link. */
  projectRef?: string
  /**
   * Optional Management API transport. When provided, the auth-config, logs,
   * secrets, advisors, and SQL-editor features light up. Without it the adapter
   * is fully client-side (supabase-js only).
   */
  management?: ManagementTransport
  /** Optional natural-language → SQL generator (consumer's AI endpoint). */
  generateSql?: (prompt: string) => Promise<{ sql: string }>
}

/**
 * Bundled default adapter for classic hosted Supabase.
 *
 * Data, auth-users, and storage run entirely through supabase-js; introspection
 * uses the PostgREST OpenAPI spec. Management-only features are opt-in via a
 * `management` transport the consumer supplies (the kit ships no proxy).
 */
export function createSupabaseAdapter(opts: CreateSupabaseAdapterOptions): PlatformAdapter {
  const { supabase } = opts
  const rows = createRowOps(supabase)
  const storage = createStorageOps(supabase)

  const hasManagement = !!opts.management
  const ref = opts.management?.projectRef ?? opts.projectRef

  let mgmt: ManagementApiClient | null = null
  if (opts.management) {
    mgmt = createManagementApiClient({
      baseUrl: opts.management.baseUrl,
      headers: opts.management.headers,
      fetch: opts.management.fetch,
    })
  }

  const adapter: PlatformAdapter = {
    projectRef: opts.projectRef,
    features: {
      introspection: true,
      tableRows: true,
      authConfig: hasManagement,
      authUsers: true,
      storage: true,
      logs: hasManagement,
      secrets: hasManagement,
      advisors: hasManagement,
      runSql: hasManagement,
      naturalLanguageSql: !!opts.generateSql && hasManagement,
      rlsPolicies: hasManagement,
    },

    async listTables(schemas?: string[]) {
      const { introspectViaPostgrest } =
        await import('@/registry/default/platform/platform-kit-nextjs/lib/introspection/postgrest')
      const tables = await introspectViaPostgrest(supabase)
      if (schemas && schemas.length > 0) {
        return tables.filter((t) => schemas.includes(t.schema))
      }
      return tables
    },

    selectRows: rows.selectRows,
    updateRow: rows.updateRow,
    insertRow: rows.insertRow,
    deleteRow: rows.deleteRow,

    listBuckets: storage.listBuckets,
    listObjects: storage.listObjects,

    async listUsers({ page = 1, perPage = 100 } = {}) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error) throw error
      return {
        users: (data?.users ?? []) as UserRecord[],
        total: (data as any)?.total ?? null,
      }
    },

    async userCountsByDay(days: number) {
      // Aggregate created_at across admin.listUsers pages, bounded to avoid
      // runaway fetches on very large projects.
      const now = new Date()
      const start = new Date(now)
      start.setUTCDate(start.getUTCDate() - (days - 1))
      start.setUTCHours(0, 0, 0, 0)

      const counts = new Map<string, number>()
      const perPage = 1000
      const maxPages = 10
      for (let page = 1; page <= maxPages; page++) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
        if (error) throw error
        const users = data?.users ?? []
        for (const u of users) {
          if (!u.created_at) continue
          const created = new Date(u.created_at)
          if (created < start) continue
          const key = created.toISOString().slice(0, 10)
          counts.set(key, (counts.get(key) ?? 0) + 1)
        }
        if (users.length < perPage) break
      }

      const series: { date: string; users: number }[] = []
      for (let i = 0; i < days; i++) {
        const d = new Date(start)
        d.setUTCDate(start.getUTCDate() + i)
        const key = d.toISOString().slice(0, 10)
        series.push({ date: key, users: counts.get(key) ?? 0 })
      }
      return series
    },

    dashboardUrl() {
      return opts.projectRef ? `https://supabase.com/dashboard/project/${opts.projectRef}` : null
    },
  }

  if (opts.generateSql) {
    adapter.generateSql = opts.generateSql
  }

  // --- Management-only capabilities ---
  if (mgmt && ref) {
    adapter.getAuthConfig = async (): Promise<AuthConfig> => {
      const { data, error } = await mgmt!.GET('/v1/projects/{ref}/config/auth', {
        params: { path: { ref } },
      })
      if (error) throw error
      return data as AuthConfig
    }

    adapter.updateAuthConfig = async (payload): Promise<AuthConfig> => {
      const { data, error } = await mgmt!.PATCH('/v1/projects/{ref}/config/auth', {
        params: { path: { ref } },
        body: payload as any,
      })
      if (error) throw error
      return data as AuthConfig
    }

    adapter.getLogs = async ({ sql, start, end }): Promise<LogsResult> => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const { data, error } = await mgmt!.GET('/v1/projects/{ref}/analytics/endpoints/logs.all', {
        params: {
          path: { ref },
          query: {
            sql,
            iso_timestamp_start: start ?? oneHourAgo.toISOString(),
            iso_timestamp_end: end ?? now.toISOString(),
          },
        },
      })
      if (error) throw error
      return data as LogsResult
    }

    adapter.getSecrets = async (): Promise<Secret[]> => {
      const { data, error } = await mgmt!.GET('/v1/projects/{ref}/secrets', {
        params: { path: { ref } },
      })
      if (error) throw error
      return (data ?? []) as Secret[]
    }

    adapter.createSecrets = async (secrets): Promise<void> => {
      const { error } = await mgmt!.POST('/v1/projects/{ref}/secrets', {
        params: { path: { ref } },
        body: secrets as any,
      })
      if (error) throw error
    }

    adapter.deleteSecrets = async (names): Promise<void> => {
      const { error } = await mgmt!.DELETE('/v1/projects/{ref}/secrets', {
        params: { path: { ref } },
        body: names as any,
      })
      if (error) throw error
    }

    adapter.getAdvisors = async (): Promise<Suggestion[]> => {
      const { data: perfData, error: perfError } = await mgmt!.GET(
        '/v1/projects/{ref}/advisors/performance',
        { params: { path: { ref } } }
      )
      if (perfError) throw perfError
      const { data: secData, error: secError } = await mgmt!.GET(
        '/v1/projects/{ref}/advisors/security',
        { params: { path: { ref } } }
      )
      if (secError) throw secError
      const performance = (perfData?.lints ?? []).map((l: any) => ({
        ...l,
        type: 'performance' as const,
      }))
      const security = (secData?.lints ?? []).map((l: any) => ({
        ...l,
        type: 'security' as const,
      }))
      return [...performance, ...security] as Suggestion[]
    }

    adapter.runSql = async ({ query, readOnly }): Promise<any[]> => {
      const { data, error } = await mgmt!.POST('/v1/projects/{ref}/database/query', {
        params: { path: { ref } },
        body: { query, read_only: readOnly },
      })
      if (error) throw error
      return data as any[]
    }
  }

  return adapter
}
