import { join } from 'node:path'

// MUST be process.cwd() here, not import.meta.url, or files that are added
// with outputFileTracingIncludes (not auto-traced) will not be found at
// runtime.
export const DOCS_DIRECTORY = process.cwd()
export const CONTENT_DIRECTORY = join(DOCS_DIRECTORY, 'content')
export const EXAMPLES_DIRECTORY = join(DOCS_DIRECTORY, 'examples')
export const GUIDES_DIRECTORY = join(CONTENT_DIRECTORY, 'guides')
export const PARTIALS_DIRECTORY = join(CONTENT_DIRECTORY, '_partials')
export const REF_DOCS_DIRECTORY = join(DOCS_DIRECTORY, 'docs/ref')
export const SPEC_DIRECTORY = join(DOCS_DIRECTORY, 'spec')

export type GuideFrontmatter = {
  title: string
  subtitle?: string
  description?: string
  canonical?: string
  hideToc?: boolean
  /** @deprecated */
  hide_table_of_contents?: boolean
  tocVideo?: string
}

/**
 * Validate the frontmatter for guide MDX files.
 *
 * @throws Throws if frontmatter is invalid.
 */
export function isValidGuideFrontmatter(obj: object): obj is GuideFrontmatter {
  if (!('title' in obj) || typeof obj.title !== 'string') {
    throw Error(
      // @ts-expect-error - Getting undefined for unknown property is desired here.
      `Invalid guide frontmatter: Title must exist and be a string. Received: ${obj.title}`
    )
  }
  if ('subtitle' in obj && typeof obj.subtitle !== 'string') {
    throw Error(`Invalid guide frontmatter: Subtitle must be a sring. Received: ${obj.subtitle}`)
  }
  if ('description' in obj && typeof obj.description !== 'string') {
    throw Error(
      `Invalid guide frontmatter: Description must be a string. Received: ${obj.description}`
    )
  }
  if ('canonical' in obj && typeof obj.canonical !== 'string') {
    throw Error(`Invalid guide frontmatter: Canonical must be a string. Received: ${obj.canonical}`)
  }
  if ('hideToc' in obj && typeof obj.hideToc !== 'boolean') {
    throw Error(`Invalid guide frontmatter: hideToc must be a boolean. Received: ${obj.hideToc}`)
  }
  if ('hide_table_of_contents' in obj && typeof obj.hide_table_of_contents !== 'boolean') {
    throw Error(
      `Invalid guide frontmatter: hide_table_of_contents must be a boolean. Received ${obj.hide_table_of_contents}`
    )
  }
  if ('tocVideo' in obj && typeof obj.tocVideo !== 'string') {
    throw Error(`Invalid guide frontmatter: tocVideo must be a string. Received ${obj.tocVideo}`)
  }
  return true
}
