import type { SupabaseClient } from '@supabase/supabase-js'

import { createRowOps } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/supabase-rows'
import { createStorageOps } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/supabase-storage'
import type { PlatformAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/types'
import {
  mapIntrospectResult,
  type SupaliteIntrospectResult,
} from '@/registry/default/platform/platform-kit-nextjs/lib/introspection/supalite'

export interface CreateSupaliteAdapterOptions {
  /** supabase-js client pointed at the supalite origin. */
  supabase: SupabaseClient
  /** Base URL for `/_system/*` calls. Defaults to the current origin. */
  baseUrl?: string
  /** Mirror of supalite's EXPERIMENTAL_STORAGE flag. */
  enableStorage?: boolean
}

/**
 * Example adapter for supalite (`@supabase/lite`).
 *
 * Data and storage use supabase-js (PostgREST / storage-api). Schema comes from
 * supalite's `GET /_system/introspect`. supalite has no Management API, no
 * arbitrary-SQL endpoint, and no auth-admin, so those features are off.
 */
export function createSupaliteAdapter(opts: CreateSupaliteAdapterOptions): PlatformAdapter {
  const { supabase, enableStorage = false } = opts
  const baseUrl = opts.baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '')
  const rows = createRowOps(supabase)
  const storage = createStorageOps(supabase)

  const adapter: PlatformAdapter = {
    projectRef: undefined,
    features: {
      introspection: true,
      tableRows: true,
      authConfig: false,
      authUsers: false,
      storage: enableStorage,
      logs: false,
      secrets: false,
      advisors: false,
      runSql: false,
      naturalLanguageSql: false,
      rlsPolicies: false,
    },

    async listTables(schemas?: string[]) {
      const response = await fetch(`${baseUrl}/_system/introspect`)
      if (!response.ok) {
        throw new Error(`Failed to introspect supalite (${response.status}).`)
      }
      const json = (await response.json()) as SupaliteIntrospectResult
      return mapIntrospectResult(json, schemas)
    },

    selectRows: rows.selectRows,
    updateRow: rows.updateRow,
    insertRow: rows.insertRow,
    deleteRow: rows.deleteRow,

    dashboardUrl() {
      return null
    },
  }

  if (enableStorage) {
    adapter.listBuckets = storage.listBuckets
    adapter.listObjects = storage.listObjects
  }

  return adapter
}
