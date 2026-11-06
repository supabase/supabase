import { existsSync, readdirSync, statSync } from 'fs'
import path from 'path'

/**
 * Get all internal content file paths recursively
 * Returns a Set of paths like '/foundations/realtime', '/foundations/grafana'
 */
export function getInternalContentPaths(): Set<string> {
  const internalDir = path.join(process.cwd(), 'content/internal')
  const paths = new Set<string>()

  if (!existsSync(internalDir)) {
    return paths
  }

  function scanDirectory(dir: string, prefix: string = '') {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = path.join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        scanDirectory(fullPath, prefix ? `${prefix}/${entry}` : entry)
      } else if (entry.endsWith('.mdx') || entry.endsWith('.md')) {
        // Remove file extension to get the path
        const filename = entry.replace(/\.(mdx|md)$/, '')
        const contentPath = prefix ? `/${prefix}/${filename}` : `/${filename}`
        paths.add(contentPath)
      }
    }
  }

  scanDirectory(internalDir)
  return paths
}

/**
 * Check if internal content exists for a given href
 */
export function hasInternalContent(href: string, internalPaths: Set<string>): boolean {
  return internalPaths.has(href)
}
