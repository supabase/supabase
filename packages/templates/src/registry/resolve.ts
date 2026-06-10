import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

import type { Template } from '../schema'
import {
  buildTemplateFromRegistryItem,
  isRegistryItemDocument,
  normalizeRegistryTarget,
  parseRegistryItem,
  parseRegistryManifest,
  type RegistryItem,
  type ResolvedRegistry,
} from './schema'

export async function resolveRegistryManifest(
  manifestPath: string,
  readJson: (filePath: string) => Promise<unknown> = readJsonFile
): Promise<ResolvedRegistry> {
  const raw = await readJson(manifestPath)

  if (isRegistryItemDocument(raw)) {
    return { items: [parseRegistryItem(raw)] }
  }

  const manifest = parseRegistryManifest(raw)
  const manifestDir = path.dirname(manifestPath)
  const items: RegistryItem[] = [...(manifest.items ?? [])]
  const seenNames = new Set<string>()

  for (const item of items) {
    if (seenNames.has(item.name)) {
      throw new Error(`Registry contains duplicate item "${item.name}"`)
    }

    seenNames.add(item.name)
  }

  for (const includePath of manifest.include ?? []) {
    const includedPath = path.resolve(manifestDir, includePath)
    const included = await resolveRegistryManifest(includedPath, readJson)

    for (const item of included.items) {
      if (seenNames.has(item.name)) {
        throw new Error(`Registry contains duplicate item "${item.name}"`)
      }

      seenNames.add(item.name)
      items.push(item)
    }
  }

  return { items }
}

export async function bundleRegistryItem({
  item,
  itemDir,
}: {
  item: RegistryItem
  itemDir: string
}): Promise<Template> {
  const fileRefs = item.files ?? []

  if (fileRefs.length === 0) {
    throw new Error(`Registry item "${item.name}" must declare at least one file`)
  }

  const files = await Promise.all(
    fileRefs.map(async (fileRef) => ({
      path: normalizeRegistryTarget(fileRef.target ?? fileRef.path),
      content: await readFile(path.join(itemDir, fileRef.path), 'utf8'),
    }))
  )

  const readme = item.docs ?? (await readOptionalReadme(itemDir))

  return buildTemplateFromRegistryItem(item, files, readme)
}

async function readOptionalReadme(itemDir: string): Promise<string | undefined> {
  const readmePath = path.join(itemDir, 'readme.md')

  try {
    await access(readmePath)
  } catch {
    return undefined
  }

  const content = (await readFile(readmePath, 'utf8')).trim()
  return content.length > 0 ? content : undefined
}

async function readJsonFile(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, 'utf8')) as unknown
}
