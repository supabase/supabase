import { REFERENCES } from '~/content/navigation.references'
import { isFeatureEnabled } from 'common/enabled-features'

export type CatalogEntry = {
  libraryId: string
  libPath: string
  version: string
  isLatestVersion: boolean
  slug: string
  sourceId: string
  title?: string
  type: SectionType
  shared?: boolean
  artifact: string
}

type SectionType = 'markdown' | 'function' | 'cli-command' | 'operation' | 'self-hosted-operation'

const CONCRETE_TYPES = new Set<SectionType>([
  'markdown',
  'function',
  'cli-command',
  'operation',
  'self-hosted-operation',
])

const isConcreteType = (type: string): type is SectionType =>
  CONCRETE_TYPES.has(type as SectionType)

export type BySlugSection = {
  id?: string
  slug?: string
  title?: string
  type?: string
  product?: string
  meta?: { shared?: boolean }
}

const UNVERSIONED = 'latest'

// Artifact name for a generated list of links. The underscore keeps it from
// ever matching a section slug.
export const INDEX_ARTIFACT = '_index'

type LoadSectionsBySlug = (
  libraryId: string,
  version: string
) => Promise<Map<string, BySlugSection> | undefined>

export type FamilyRegistry = Record<
  string,
  { libPath: string; versions: readonly string[]; type?: string; enabled?: boolean }
>

const isAuthSectionHidden = (family: FamilyRegistry[string], section: BySlugSection): boolean => {
  if (isFeatureEnabled('sdk:auth')) return false
  if (family.type !== 'sdk') return false
  return section.product === 'auth' || section.product === 'auth-admin'
}

const versionsFor = (family: FamilyRegistry[string]): string[] =>
  family.versions.length > 0 ? [...family.versions] : [UNVERSIONED]

const publicPathsFor = (entry: CatalogEntry, slug: string): string[] => {
  const unversioned = `${entry.libPath}/${slug}`
  const versioned = `${entry.libPath}/${entry.version}/${slug}`
  if (!entry.isLatestVersion) return [versioned]
  if (entry.version === UNVERSIONED) return [unversioned]
  return [unversioned, versioned]
}

type Catalog = {
  entries: CatalogEntry[]
  manifest: Record<string, string>
}

export const buildCatalog = async ({
  loadSectionsBySlug,
  references = REFERENCES as unknown as FamilyRegistry,
  libraryIds = Object.keys(references),
}: {
  loadSectionsBySlug: LoadSectionsBySlug
  references?: FamilyRegistry
  libraryIds?: string[]
}): Promise<Catalog> => {
  const entries: CatalogEntry[] = []
  const manifest: Record<string, string> = {}
  const claimedBy = new Map<string, string>()

  const claim = (publicPath: string, artifact: string, identity: string) => {
    const existing = claimedBy.get(publicPath)
    if (existing && existing !== identity) {
      throw new Error(
        `Conflicting reference sections for /${publicPath}: "${existing}" and "${identity}"`
      )
    }
    claimedBy.set(publicPath, identity)
    manifest[publicPath] = artifact
  }

  for (const libraryId of libraryIds) {
    const family = references[libraryId]
    if (!family || family.enabled === false) continue
    const { libPath } = family
    const versions = versionsFor(family)

    for (const [index, version] of versions.entries()) {
      const sections = await loadSectionsBySlug(libraryId, version)
      if (!sections) continue

      const isLatestVersion = index === 0
      const eligible = new Map<string, CatalogEntry>()

      for (const [slug, section] of sections) {
        if (!section.slug || !section.type) continue
        if (!isConcreteType(section.type)) continue
        if (isAuthSectionHidden(family, section)) continue

        const entry: CatalogEntry = {
          libraryId,
          libPath,
          version,
          isLatestVersion,
          slug,
          sourceId: section.id ?? slug,
          title: section.title,
          type: section.type,
          shared: section.meta?.shared,
          artifact: `${libPath}/${version}/${slug}`,
        }
        eligible.set(slug, entry)
      }

      for (const entry of eligible.values()) {
        entries.push(entry)
        const identity = `${libraryId}@${version}:${entry.slug}`
        for (const publicPath of publicPathsFor(entry, entry.slug)) {
          claim(publicPath, entry.artifact, identity)
        }
      }

      if (eligible.size > 0) {
        const paths =
          version === UNVERSIONED
            ? [libPath]
            : isLatestVersion
              ? [libPath, `${libPath}/${version}`]
              : [`${libPath}/${version}`]
        for (const publicPath of paths) {
          claim(publicPath, `${libPath}/${version}/${INDEX_ARTIFACT}`, `${libraryId}@${version}`)
        }
      }

      const introduction = eligible.get('introduction')
      if (introduction && !eligible.has('start')) {
        const identity = `${libraryId}@${version}:introduction`
        for (const publicPath of publicPathsFor(introduction, 'start')) {
          claim(publicPath, introduction.artifact, identity)
        }
      }
    }
  }

  // Middleware sends a bare `/reference.md` here as `index`.
  if (entries.length > 0) claim('index', INDEX_ARTIFACT, 'root')

  return { entries, manifest }
}
