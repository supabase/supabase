import fs from 'node:fs'
import path from 'node:path'
import { analyzeProjectResources, type ProjectFramework } from 'common/project-resources'

import { starterSources, type StarterSourceSnapshot } from '../config/starter-sources'
import { readRegistryItem } from '../lib/process-registry'
import { getInstalledPath, resolveRegistryItem } from '../lib/registry-resolution'

// Framework conventions belong to the library adapter, not the reusable analyzer.
function registryFramework(name: string): ProjectFramework {
  if (name.endsWith('-nextjs')) return 'nextjs'
  if (name.endsWith('-nuxtjs')) return 'nuxt'
  if (name.endsWith('-react-router')) return 'react-router'
  if (name.endsWith('-tanstack')) return 'tanstack'
  return 'generic'
}

async function generate() {
  const registryDirectory = path.join(process.cwd(), 'public/r')
  const items = fs
    .readdirSync(registryDirectory)
    .filter((file) => file.endsWith('.json') && file !== 'registry.json')
    .sort()
    .map((file) => readRegistryItem(path.join(registryDirectory, file)))
  const manifest: Record<string, unknown> = {}

  for (const item of items) {
    const resolved = resolveRegistryItem({ items }, item.name)
    const files = resolved.files.map((file) => ({
      path: getInstalledPath(file),
      content: file.content,
    }))
    const analysis = await analyzeProjectResources(files, {
      framework: registryFramework(item.name),
    })
    manifest[item.name] = {
      name: item.name,
      title: item.title ?? item.name,
      fileCount: files.length,
      ...analysis,
    }
  }

  for (const source of starterSources) {
    const snapshot = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'registry/starter-sources', `${source.name}.json`),
        'utf8'
      )
    ) as StarterSourceSnapshot
    const expectedSourceUrl = `https://github.com/${source.repository}/tree/${snapshot.source?.revision}${source.root ? `/${source.root}` : ''}`
    if (
      snapshot.name !== source.name ||
      snapshot.framework !== source.framework ||
      snapshot.source?.repository !== source.repository ||
      snapshot.source?.root !== source.root ||
      !/^[a-f0-9]{40}$/.test(snapshot.source?.revision ?? '') ||
      snapshot.source?.treeUrl !== expectedSourceUrl
    ) {
      throw new Error(`Starter source snapshot does not match its descriptor: ${source.name}`)
    }
    const analysis = await analyzeProjectResources(snapshot.files, { framework: source.framework })
    manifest[source.name] = {
      name: source.name,
      title: source.title,
      fileCount: snapshot.files.length,
      source: { url: snapshot.source.treeUrl, revision: snapshot.source.revision },
      ...analysis,
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([left], [right]) => left.localeCompare(right))
  )
  fs.writeFileSync(
    path.join(process.cwd(), '__registry__/resources.json'),
    `${JSON.stringify(sorted, null, 2)}\n`
  )
  console.log(
    `Generated resource inventories for ${Object.keys(sorted).length} blocks and starters`
  )
}

generate().catch((error) => {
  console.error(error)
  process.exit(1)
})
