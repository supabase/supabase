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

const REF_IDS = ['Database', 'Auth', 'Edge Functions', 'Realtime', 'Storage']

const isClientLibReferenceMenu = (menu: Menu): menu is ReferenceMenu =>
  'commonSectionsFile' in menu && menu.commonSectionsFile === 'common-client-libs-sections.json'

const main = async () => {
  mkdirSync(join(__dirname, 'generated'), {
    recursive: true,
  })

  const clientLibraries = await Promise.all(menus.filter(isClientLibReferenceMenu).map(async (library) => ({
    ...library,
    spec: parse(await readFile(join(__dirname, '../..', 'spec', library.specFile), 'utf-8'))
  })))

  const promises = []

  REF_IDS.forEach(async (refId) => {
    const sections =
      commonSections.find((section) => section.type === 'category' && section.title === refId)
        ?.items ?? []

    const flatSections = flattenSections(sections)

    const annotatedSections = await Promise.all(flatSections.map(async (section) => {
      const libraries = [] as Array<string>

      await Promise.all(clientLibraries.map(async (library) => {
        if (library.spec.functions.some((fn) => fn.id === section.id)) {
          libraries.push(library.id)
        }
      }))

      return {
        ...section,
        libraries
      }
    }))
    
    promises.push(
      writeFile(
        join(__dirname, 'generated', `commonClientLibFlat-${refId}.json`),
        JSON.stringify(annotatedSections, null, 2),
        { encoding: 'utf-8' }
      )
    )
  })

  await Promise.all(promises)
}

main()
