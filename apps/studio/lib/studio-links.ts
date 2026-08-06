/**
 * Centralized utility for building internal Studio navigation links.
 *
 * Problem: Schema names, table names, column names, and other user-supplied
 * identifiers frequently contain characters that are special in URLs
 * (spaces, slashes, ampersands, hashes, non-ASCII). When these are
 * interpolated directly into href strings the URL becomes malformed and
 * navigation silently breaks or drops parameters.
 *
 * Five separate "encode special characters" fix commits (Mar–May 2026)
 * patched this one call-site at a time. This module is the systemic fix:
 * all internal link construction goes through here so encoding happens once,
 * consistently, using the URL API (which handles all edge cases).
 *
 * Usage:
 *   // Before (broken for schema names with spaces / slashes):
 *   href={`/project/${ref}/database/policies?schema=${schema}&search=${name}`}
 *
 *   // After:
 *   href={studioLinks.databasePolicies(ref, schema, name)}
 */

type StudioLinkParams = Record<string, string | number | undefined | null>

/**
 * Build an internal Studio path with query parameters safely encoded.
 * Uses the URL API so all encoding edge cases are handled correctly:
 * spaces (%20), slashes (%2F), ampersands (%26), hashes (%23), Unicode, etc.
 *
 * Returns only the pathname + search (no origin), suitable for use in
 * Next.js <Link href>, TanStack <Link to>, or plain <a href>.
 */
export function buildStudioLink(path: string, params?: StudioLinkParams): string {
  // Dummy origin required by URL constructor; stripped before returning.
  const url = new URL(path, 'http://x')
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.pathname + url.search
}

// ─── Named convenience wrappers ──────────────────────────────────────────────
// Each wrapper encodes the common query params for its destination route so
// call sites don't have to remember which params a route accepts.

export const studioLinks = {
  databasePolicies: (ref: string, schema: string, search?: string) =>
    buildStudioLink(`/project/${ref}/database/policies`, { schema, search }),

  databaseIndexes: (ref: string, schema: string, table?: string) =>
    buildStudioLink(`/project/${ref}/database/indexes`, { schema, table }),

  databaseFunctions: (ref: string, schema: string, search?: string) =>
    buildStudioLink(`/project/${ref}/database/functions`, { schema, search }),

  databaseTables: (ref: string, schema: string, search?: string) =>
    buildStudioLink(`/project/${ref}/database/tables`, { schema, search }),

  databaseExtensions: (ref: string, filter?: string) =>
    buildStudioLink(`/project/${ref}/database/extensions`, { filter }),

  databaseReplication: (ref: string, pipelineId: string | number, search?: string) =>
    buildStudioLink(`/project/${ref}/database/replication/${pipelineId}`, { search }),

  tableEditor: (ref: string, tableId: string | number, schema: string) =>
    buildStudioLink(`/project/${ref}/editor/${tableId}`, { schema }),

  sqlEditorNew: (ref: string, schema?: string) =>
    buildStudioLink(`/project/${ref}/sql/new`, { schema }),

  sqlEditorSnippet: (ref: string, id: string, schema?: string) =>
    buildStudioLink(`/project/${ref}/sql/${id}`, { schema }),

  storagePolicies: (ref: string, search?: string) =>
    buildStudioLink(`/project/${ref}/storage/policies`, { search }),

  vaultSecrets: (ref: string, search?: string) =>
    buildStudioLink(`/project/${ref}/integrations/vault/secrets`, { search }),

  triggersAndFunctions: (ref: string, schema: string, search?: string) =>
    buildStudioLink(`/project/${ref}/database/triggers`, { schema, search }),
}
