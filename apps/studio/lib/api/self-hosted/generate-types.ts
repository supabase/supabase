import {
  findLanguage,
  sparkGeneratorMetadata,
  type Host,
  type SparkSchemaDescription,
} from '@supabase/typegen'

import { DEFAULT_EXPOSED_SCHEMAS } from './constants'
import { assertSelfHosted, isSparkProject } from './util'
import { fetchGet } from '@/data/fetchers'
import { PG_META_URL } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'

export type GenerateTypescriptTypesOptions = {
  headers?: HeadersInit
}

type GenerateTypescriptTypesResult = {
  types: string
}

// The template's own output: the same text `supabase gen types typescript` prints, and no formatter to bundle.
const unformatted: Host = { cwd: '.', env: {}, format: (code) => Promise.resolve(code) }

/**
 * TEMPORARY, Spark only. A Spark project has no pg-meta to render types, and typegen's own
 * introspection reads catalogs Spark does not have. The types are rendered here, from Spark's
 * schema description, by the generator pg-meta and `supabase gen types` share.
 *
 * `@supabase/typegen` is pinned to the branch that has `sparkGeneratorMetadata`. Delete this once
 * typegen's `introspect()` runs on Spark; until then, move the pin to a release that has
 * `sparkGeneratorMetadata` when there is one.
 */
async function generateSparkTypescriptTypes(): Promise<GenerateTypescriptTypesResult> {
  const response = await fetch(`${process.env.SUPABASE_URL}/_spark/v1/schema`, {
    headers: { apikey: `${process.env.SUPABASE_SERVICE_KEY}` },
    // fetch would carry the service key to wherever a redirect points.
    redirect: 'error',
  })
  if (!response.ok) {
    throw new Error(`Spark's schema description answered HTTP ${response.status}`)
  }
  const description: SparkSchemaDescription = await response.json()

  const typescript = findLanguage('typescript')
  if (typescript === undefined) {
    throw new Error('@supabase/typegen has no TypeScript generator')
  }
  const schemas = DEFAULT_EXPOSED_SCHEMAS.split(',').map((schema) => schema.trim())
  const types = await typescript.generate(
    sparkGeneratorMetadata(description, { schemas }),
    {},
    unformatted
  )

  return { types }
}

/**
 * Generates TypeScript types for the self-hosted Postgres instance via pg-meta service.
 *
 * _Only call this from server-side self-hosted code._
 */
export async function generateTypescriptTypes({
  headers,
}: GenerateTypescriptTypesOptions): Promise<GenerateTypescriptTypesResult | StudioError> {
  assertSelfHosted()

  if (isSparkProject()) {
    return generateSparkTypescriptTypes()
  }

  // Use the schemas actually exposed via PostgREST (PGRST_DB_SCHEMAS) so generated
  // types match the Data API surface, instead of a hardcoded include/exclude list.
  // Note the param is `included_schemas` (plural) — pg-meta treats a non-empty list
  // as a strict allowlist; the singular spelling is silently ignored (includes all).
  const response = await fetchGet<GenerateTypescriptTypesResult>(
    `${PG_META_URL}/generators/typescript?included_schemas=${DEFAULT_EXPOSED_SCHEMAS}`,
    { headers }
  )

  return response
}
