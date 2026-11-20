import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  definitionFrontmatterSchema,
  libraryIndexFrontmatterSchema,
} from '~/features/reference-beta/ReferenceBeta.schema'
import { REFERENCE_BETA_DIRECTORY } from '~/lib/docs'
import { z } from 'zod/v4'

/**
 * Writes the JSON Schema form of the reference-beta frontmatter schemas.
 * Library repos fetch these files to check their own definitions, without
 * depending on the docs app:
 *
 *   https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/content/reference-beta/definition.schema.json
 *
 * Validate a definition by parsing its YAML frontmatter and checking it
 * against the schema. `id` must also match the file name, which JSON Schema
 * can't express.
 */
const SCHEMAS = {
  'definition.schema.json': {
    title: 'Reference definition frontmatter',
    schema: definitionFrontmatterSchema,
  },
  'index.schema.json': {
    title: 'Reference library index frontmatter',
    schema: libraryIndexFrontmatterSchema,
  },
}

export function renderSchemas(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(SCHEMAS).map(([file, { title, schema }]) => [
      file,
      // `input` keeps defaulted keys optional: authors may omit them.
      JSON.stringify({ title, ...z.toJSONSchema(schema, { io: 'input' }) }, null, 2) + '\n',
    ])
  )
}

async function main() {
  await mkdir(REFERENCE_BETA_DIRECTORY, { recursive: true })
  await Promise.all(
    Object.entries(renderSchemas()).map(([file, content]) =>
      writeFile(join(REFERENCE_BETA_DIRECTORY, file), content)
    )
  )
  console.log(`Wrote ${Object.keys(SCHEMAS).join(', ')} to content/reference-beta/`)
}

// Only run when invoked directly, so tests can import `renderSchemas`.
if (process.argv[1]?.endsWith('generate-schema.ts')) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
