import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { bundleTemplateRepository } from '../src/bundle'
import { syncRegistry } from './sync-registry'

async function main() {
  const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

  await syncRegistry(packageRoot)

  const { templates, categories } = await bundleTemplateRepository({ rootDir: packageRoot })

  const output = `import type { CategoriesManifest } from './categories'
import { createTemplateIndex, type Template } from './schema'

export const templates: Template[] = ${JSON.stringify(templates, null, 2)}

export const templateIndex = createTemplateIndex(templates)

export const categories: CategoriesManifest = ${JSON.stringify(categories, null, 2)}
`

  await writeFile(path.join(packageRoot, 'src', 'generated.ts'), output)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
