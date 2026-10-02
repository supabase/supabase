// Deliberately plain JavaScript, not TypeScript.
//
// piscina loads this file in a fresh worker thread that does not inherit the
// parent's module transform pipeline -- so under ts-node, and especially under
// vitest (which transforms TypeScript in memory, leaving no .js on disk), a
// .ts worker entry cannot be resolved. Keeping it as real JavaScript means dev,
// tests and the built output all load the exact same file. It is copied to
// dist/ by the build script alongside the .sql files.

import { generateTypescript } from '@supabase/postgrest-typegen'

/**
 * @param {{
 *   metadata: import('@supabase/postgrest-typegen').GeneratorMetadata,
 *   options: import('@supabase/postgrest-typegen').GenerateTypescriptOptions,
 * }} task
 * @returns {Promise<string>}
 */
export default async function generate({ metadata, options }) {
  return generateTypescript(metadata, options)
}
