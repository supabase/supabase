import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DOCS_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), '..')
export const GUIDES_DIRECTORY = join(DOCS_DIRECTORY, 'content/guides')

type GuideFrontmatter = {
  title: string
  description?: string
  hideToc?: boolean
}

export function isValidGuideFrontmatter(obj: object): obj is GuideFrontmatter {
  if (!('title' in obj) || typeof obj.title !== 'string') return false
  if ('description' in obj && typeof obj.description !== 'string') return false
  return true
}
