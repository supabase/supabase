import * as fs from 'fs'

export interface RegistryNode {
  name: string
  path: string
  originalPath: string
  type: 'directory' | 'file'
  children?: RegistryNode[]
  content?: string
}

interface RegistryFile {
  path: string
  target?: string
  type: string
  content: string
}

const DEFAULT_PATHS = {
  component: '/components',
  hook: '/hooks',
  util: '/lib',
} as const

/**
 * Converts a flat registry array into a hierarchical file tree structure
 */
export function generateRegistryTree(registryPath: string): RegistryNode[] {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as { files: RegistryFile[] }
  const tree: RegistryNode[] = []

  const sortedRegistry = [...registry.files].sort((a, b) => a.path.localeCompare(b.path))

  for (const file of sortedRegistry) {
    const itemPath = file.target || getDefaultPath(file)
    const pathParts = itemPath.split('/').filter(Boolean)
    let currentLevel = tree

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const isLast = i === pathParts.length - 1
      const path = '/' + pathParts.slice(0, i + 1).join('/')

      let node = currentLevel.find((n) => n.name === part)

      // Remove any paths in the file content that point to the block directory.
      const content = file.content
        .replaceAll(/@\/registry\/default\/blocks\/.+?\//gi, '@/')
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

/**
 * Determines the default path for an item based on its type
 */
function getDefaultPath(item: RegistryFile): string {
  const type = item.type.toLowerCase() || ''
  const basePath = DEFAULT_PATHS[type as keyof typeof DEFAULT_PATHS] || ''
  // clean all paths that start with paths specific to this repo organization
  const filePath = item.path
    .replace(/registry\/default\/blocks\/.+?\//, '')
    .replace(/registry\/default\/clients\/.+?\//, '')

  return `${basePath}/${filePath}`
}
