import { REFERENCES } from '../../content/navigation.references'
import { getFlattenedSections } from '../../features/docs/Reference.generated.singleton'

export async function generateReferencePages() {
  return (
    await Promise.all(
      Object.keys(REFERENCES)
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
          return (
            flattenedSections?.map((section) => ({
              link: isLatestVersion
                ? `reference/${libPath}/${section.slug}`
                : `reference/${libPath}/${version}/${section.slug}`,
            })) ?? []
          )
        })
    )
  ).flat()
}
