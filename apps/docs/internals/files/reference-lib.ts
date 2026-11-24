import { REFERENCES } from '../../content/navigation.references'
import {
  getFlattenedSections,
  getReferenceSections,
} from '../../features/docs/Reference.generated.singleton'
import type { AbbrevApiReferenceSection } from '../../features/docs/Reference.utils'

function parentTitlesBySlug(
  sections: Array<AbbrevApiReferenceSection>,
  parentTitle?: string,
  titles = new Map<string, string>()
) {
  for (const section of sections) {
    if (section.slug && parentTitle && !titles.has(section.slug)) {
      titles.set(section.slug, parentTitle)
    }
    if (section.items) parentTitlesBySlug(section.items, section.title, titles)
  }
  return titles
}

export async function generateReferencePages() {
  return (
    await Promise.all(
      Object.keys(REFERENCES)
        .filter((key) => REFERENCES[key].enabled !== false)
        .flatMap((key) => {
          if (REFERENCES[key].versions.length === 0) {
            return [
              {
                sdkId: REFERENCES[key].libPath,
                version: 'latest',
                isLatestVersion: true,
                libPath: REFERENCES[key].libPath,
              },
            ]
          }
          return REFERENCES[key].versions.map((version) => {
            return {
              sdkId: key,
              version: version,
              isLatestVersion: version === REFERENCES[key].versions[0],
              libPath: REFERENCES[key].libPath,
            }
          })
        })
        .map(async ({ sdkId, version, libPath, isLatestVersion }) => {
          const flattenedSections = await getFlattenedSections(sdkId, version)
          const parentTitles = parentTitlesBySlug(
            (await getReferenceSections(sdkId, version)) ?? []
          )
          return (
            flattenedSections
              ?.filter((section) => section.type !== 'category' && !!section.slug)
              .map((section) => {
                const parentTitle = parentTitles.get(section.slug!)
                return {
                  link: isLatestVersion
                    ? `reference/${libPath}/${section.slug}`
                    : `reference/${libPath}/${version}/${section.slug}`,
                  priority: 0.8,
                  title: section.title ?? section.slug!,
                  ...(isLatestVersion ? {} : { version }),
                  ...(parentTitle ? { parentTitle } : {}),
                }
              }) ?? []
          )
        })
    )
  ).flat()
}
