import { ReferencePageLayout } from '~/features/docs/Reference.layout.new'
import { REFERENCE_DIRECTORY, type GuideFrontmatter } from '~/lib/docs'
import { join } from 'path'
import matter from 'gray-matter'
import { promises as fs } from 'node:fs'
import { AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'

/**
 * Within this file we mimic what would potentially be the folder structure
 * outside the app directory.
 * 
 * For the moment, we only have a distinctive ReferenceNavigation.new file and
 * a ReferencePageLayout element outside of this. With a full migration of all resources, the parts within here would be moved each to its own file.
 */

/**
 * Reference.constants.ts
 */
const libs = {
  javascript: {
    name: 'JavaScript',
    icon: 'reference-javascript',
    isLatestVersion: true,
    currentVersion: 'v2',
  },
  /**
   * In the future we can have other entries like ['javascript-v1']
   * to support older versions.
   */
} as const

export type LibKey = keyof typeof libs

/**
 * Reference.utils.ts
 */
async function getReferenceContent(library: string, version: string | undefined) {
  const libKey = getLibKey(library, version)
  const filePath = join(REFERENCE_DIRECTORY, `${libKey}.mdx`)
  const fileContent = await fs.readFile(filePath, 'utf-8')
  const { data: meta, content } = matter(fileContent)
  return { meta, content } as { content: string, meta: GuideFrontmatter}
}

async function getReferenceSections(library: string, version: string | undefined) {
  const libKey = getLibKey(library, version)
  const filePath = join(REFERENCE_DIRECTORY, `${libKey}.sections.json`)
  const fileContent = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(fileContent) as AbbrevApiReferenceSection[]
}

function getLibKey(library: string, version: string | undefined) {
  return `${library}${version ? `-${version}` : ''}` as LibKey
}


/**
 * app/reference/[library]/[version]/page.tsx
 * 
 * Actual content from file, though it contains logic from a possible
 * separate layout.tsx file.
 * 
 */

/**
 * Ideally both navigation components and these parameters are going to be
 * moved to a layout.tsx file at route level and consume `library` and
 * `version` from the slug to then get content and sections ahead of time.
 * 
 * Version being undefined or null means it's latest.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/layout#params-optional
 */
const params = {
  library: 'javascript',
  version: undefined
}

export default async function ReferencePage() {
  const { library, version } = params
  const libKey = `${library}${version ? `-${version}` : ''}` as LibKey
  const { name, icon, currentVersion, isLatestVersion } = libs[libKey]

  const { meta, content } = await getReferenceContent(library, version)
  const sections = await getReferenceSections(library, version)

  return (
    <ReferencePageLayout
      name={name}
      icon={icon}
      library={library}
      version={currentVersion}
      isLatestVersion={isLatestVersion}
      sections={sections}
      meta={meta}
      content={content}
    />
  )
}
