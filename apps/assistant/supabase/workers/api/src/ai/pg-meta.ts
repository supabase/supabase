import pgMetaExport from '@supabase/pg-meta'

type PgMetaModule = typeof import('@supabase/pg-meta')
type PgMeta = PgMetaModule extends { default: infer D } ? D : PgMetaModule

function resolvePgMeta(mod: unknown): PgMeta {
  let current: unknown = mod
  for (let i = 0; i < 5; i++) {
    if (!current || typeof current !== 'object') break
    const candidate = current as { schemas?: { list?: unknown }; default?: unknown }
    if (typeof candidate.schemas?.list === 'function') {
      return current as PgMeta
    }
    current = candidate.default
  }
  throw new Error('Failed to resolve @supabase/pg-meta default export (schemas.list)')
}

/**
 * Vitest/Next unwrap `export default` on `@supabase/pg-meta`. `tsx` loading a
 * `.ts` entry often yields the module namespace instead, with the bag one
 * `.default` deeper (`mod.default.schemas`).
 */
export const pgMeta = resolvePgMeta(pgMetaExport)
