import { mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'yaml'

import {
  type Menu,
  type ReferenceMenu,
  menus,
} from '../../components/Navigation/NavigationMenu/menus'
import { flattenSections } from '../../lib/helpers'
import commonSections from '../../spec/common-client-libs-sections.json'
import { toRefNavMenu } from './generate-guide-ref-pipeline'

const flatSections = flattenSections(commonSections)

const isClientLibReferenceMenu = (menu: Menu): menu is ReferenceMenu =>
  'commonSectionsFile' in menu && menu.commonSectionsFile === 'common-client-libs-sections.json'

const clientLibraries = menus.filter(isClientLibReferenceMenu)

const main = async () => {
  mkdirSync(join(process.cwd(), 'scripts/pregenerate/generated'), {
    recursive: true,
  })

  const promises = [
    writeFile(
      join(process.cwd(), 'scripts/pregenerate/generated', 'commonClientLibFlat.json'),
      JSON.stringify(flatSections, null, 2),
      { encoding: 'utf-8' }
    ),
  ]

  const pendingSpecs = clientLibraries.map(async (library) => ({
    ...library,
    // TODO: Change this to be more robust with import meta URL
    spec: parse(await readFile(join(process.cwd(), 'spec', library.specFile), 'utf-8')),
  }))

  const specs = await Promise.all(pendingSpecs)

  specs
    .map((spec) => ({
      id: spec.id,
      navData: toRefNavMenu({
        sections: commonSections,
        excludedName: spec.id,
        includeList: {
          tag: 'function',
          list: spec.spec.functions.map((fn) => fn.id).filter(Boolean),
        },
        sectionPath: `/${spec.path.replace(/^\/reference\//, '').replace(/\/v\d+$/, '')}`,
      }),
    }))
    .forEach((navData) => {
      promises.push(
        writeFile(
          join(process.cwd(), 'scripts/pregenerate/generated', `${navData.id}.json`),
          JSON.stringify(navData.navData, null, 2),
          { encoding: 'utf-8' }
        )
      )
      return promises
    })
}

main()
