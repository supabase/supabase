import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { menus } from '../../../../features/Navigation/NavigationMenu/menus'
import { flattenSections } from '../../../../lib/helpers'
import commonSections from '../../../../spec/common-client-libs-sections.json' assert { type: 'json' }
import { toRefNavMenu } from './pipeline'

const flatSections = flattenSections(commonSections)

const clientLibraries = menus.filter(
  (menu) => menu.commonSectionsFile === 'common-client-libs-sections.json'
)

const main = async () => {
  mkdirSync(join(process.cwd(), 'apps/docs/features/Navigation/refNavigation/generated'), {
    recursive: true,
  })

  const specs = clientLibraries
    .map((library) => ({
      id: library.id,
      // TODO: Change this to be more robust with import meta URL
      spec: require(join(process.cwd(), 'apps/docs/spec', library.commonSectionsFile)),
    }))
    .map((spec) => ({
      id: spec.id,
      navData: toRefNavMenu({
        sections: commonSections,
        excludedName: spec.id,
        includeList: {
          tag: 'function',
          list: flatSections.map((section) => section.id).filter(Boolean),
        },
        sectionPath: '/csharp',
      }),
    }))
    .reduce(
      (promises, navData) => {
        promises.push(
          writeFile(
            join(
              process.cwd(),
              'apps/docs/features/Navigation/refNavigation/generated',
              `${navData.id}.json`
            ),
            JSON.stringify(navData.navData, null, 2),
            { encoding: 'utf-8' }
          )
        )
        return promises
      },
      [
        writeFile(
          join(
            process.cwd(),
            'apps/docs/features/Navigation/refNavigation/generated',
            'commonClientLibFlat.json'
          ),
          JSON.stringify(flatSections, null, 2),
          { encoding: 'utf-8' }
        ),
      ]
    )

  await Promise.all(specs).catch((err) => {
    console.error(err)
  })
}

main()
