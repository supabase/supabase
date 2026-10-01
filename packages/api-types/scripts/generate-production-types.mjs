import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateTypes, specifications } from './verify-production-types.mjs'

const packageDirectory = dirname(dirname(fileURLToPath(import.meta.url)))
const typesDirectory = process.env.API_TYPES_DIRECTORY ?? join(packageDirectory, 'types')

// Regenerates the committed API types directly from the production OpenAPI specifications,
// bypassing the need for a running local API (unlike `codegen`, which reads from localhost).
export async function generateProductionTypes() {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'api-types-prod-'))

  try {
    await generateTypes(specifications, {
      temporaryDirectory,
      generatedTypesDirectory: typesDirectory,
    })
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generateProductionTypes()
}
