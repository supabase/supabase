import * as fs from 'fs'
import path from 'node:path'
import { registryItemSchema, type RegistryItem } from 'shadcn/schema'

import {
  getFirstPartyDependencyName,
  getInstalledPath,
  resolveRegistryItem,
  type RegistryFile,
} from './registry-resolution'

export interface RegistryNode {
  name: string
  path: string
  originalPath: string
  type: 'directory' | 'file'
  children?: RegistryNode[]
  content?: string
}

export function readRegistryItem(registryPath: string): RegistryItem {
  try {
    const item = registryItemSchema.parse(JSON.parse(fs.readFileSync(registryPath, 'utf-8')))
    if (item.name !== path.basename(registryPath, '.json')) {
      throw new Error(`Artifact name "${item.name}" does not match its filename`)
    }
    if (!item.files?.length || item.files.some((file) => typeof file.content !== 'string')) {
      throw new Error('Expected generated registry files with source content')
    }
    return item
  } catch (error) {
    throw new Error(`Unable to read required registry artifact "${registryPath}"`, { cause: error })
  }
}

/**
 * Converts a flat registry array into a hierarchical file tree structure
 */
export function generateRegistryTree(registryPath: string): RegistryNode[] {
  const root = readRegistryItem(registryPath)
  const items = new Map<string, RegistryItem>([[root.name, root]])
  const readDependencies = (item: RegistryItem) => {
    for (const dependency of item.registryDependencies ?? []) {
      const name = getFirstPartyDependencyName(dependency)
      if (!name || items.has(name)) continue
      try {
        const dependencyItem = readRegistryItem(
          path.join(path.dirname(registryPath), `${name}.json`)
        )
        items.set(name, dependencyItem)
        readDependencies(dependencyItem)
      } catch (error) {
        throw new Error(`Registry item "${item.name}" requires dependency "${name}"`, {
          cause: error,
        })
      }
    }
  }
  readDependencies(root)
  const resolved = resolveRegistryItem({ items: [...items.values()] }, root.name)
  return registryFilesToTree(resolved.files)
}

function registryFilesToTree(files: RegistryFile[]): RegistryNode[] {
  const tree: RegistryNode[] = []

  const sortedRegistry = [...files].sort((a, b) =>
    getInstalledPath(a).localeCompare(getInstalledPath(b))
  )

  for (const file of sortedRegistry) {
    const itemPath = getInstalledPath(file)
    const pathParts = itemPath.split('/').filter(Boolean)
    let currentLevel = tree

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const isLast = i === pathParts.length - 1
      const path = '/' + pathParts.slice(0, i + 1).join('/')

      let node = currentLevel.find((n) => n.name === part)

      // Remove any paths in the file content that point to the block directory.
      const content = file
        .content!.replaceAll(/@\/registry\/default\/blocks\/.+?\//gi, '@/')
        .replaceAll(/@\/registry\/default\/fixtures\//gi, '@/')
        .replaceAll(/@\/registry\/default\//gi, '@/')
        .replaceAll(/@\/clients\/.+?\//gi, '@/')

      if (!node) {
        node = {
          name: part,
          path,
          originalPath: file.path,
          type: isLast ? 'file' : 'directory',
          ...(isLast ? { content } : { children: [] }),
        }
        currentLevel.push(node)
      }

      if (!isLast) {
        node.children = node.children || []
        currentLevel = node.children
      }
    }
  }

  return tree
}
