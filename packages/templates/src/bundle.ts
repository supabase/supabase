import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { parseCategoriesManifest, type CategoriesManifest } from './categories'
import { bundleRegistryItem, resolveRegistryManifest } from './registry/resolve'
import type { Template } from './schema'

interface BundleTemplateRepositoryOptions {
  rootDir: string
}

export interface BundledRepository {
  templates: Template[]
  categories: CategoriesManifest
}

export async function bundleTemplateRepository({
  rootDir,
}: BundleTemplateRepositoryOptions): Promise<BundledRepository> {
  const registryPath = path.join(rootDir, 'registry.json')
  const { items } = await resolveRegistryManifest(registryPath)

  const templates = await Promise.all(
    items.map((item) =>
      bundleRegistryItem({
        item,
        itemDir: path.join(rootDir, 'templates', item.name),
      })
    )
  )

  const categories = parseCategoriesManifest(
    JSON.parse(await readFile(path.join(rootDir, 'categories.json'), 'utf8'))
  )

  return { templates, categories }
}
