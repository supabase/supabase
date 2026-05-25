import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { bundleTemplateRepository } from '../src/bundle'

async function main() {
  const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
  const templates = await bundleTemplateRepository({ rootDir: packageRoot })

  const output = `import { createTemplateIndex, type ProjectComposerTemplate } from './schema'

export const projectComposerTemplates: ProjectComposerTemplate[] = ${JSON.stringify(templates, null, 2)}

export const projectComposerTemplateIndex = createTemplateIndex(projectComposerTemplates)
`

  await writeFile(path.join(packageRoot, 'src', 'generated.ts'), output)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
