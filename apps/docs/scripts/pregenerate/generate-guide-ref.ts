import { mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'yaml'

import {
  type Menu,
  type MenuId,
  type ReferenceMenu,
  menus,
} from '../../components/Navigation/NavigationMenu/menus'
import type { ICommonSection } from '../../components/reference/Reference.types'
import { flattenSections } from '../../lib/helpers'
import commonSections from '../../spec/common-client-libs-sections.json'

const REF_IDS = ['Database', 'Auth', 'Edge Functions', 'Realtime', 'Storage']

const isClientLibReferenceMenu = (menu: Menu): menu is ReferenceMenu =>
  'commonSectionsFile' in menu && menu.commonSectionsFile === 'common-client-libs-sections.json'

const attachSpec = async (library: ReferenceMenu) => ({
  ...library,
  spec: parse(await readFile(join(__dirname, '../..', 'spec', library.specFile), 'utf-8')),
})

const getCategory = (category: string) =>
  commonSections.find((section) => section.type === 'category' && section.title === category)
    ?.items ?? []

const saveJson = (refId: string, json: Array<unknown>) =>
  writeFile(
    join(__dirname, 'generated', `commonClientLibFlat-${refId}.json`),
    JSON.stringify(json, null, 2),
    { encoding: 'utf-8' }
  )

const annotateWithLibraries =
  <Library extends { id: MenuId; spec: any }>(clientLibraries: Array<Library>) =>
  async (section: ICommonSection) => {
    const libraries = [] as Array<string>

    await Promise.all(
      clientLibraries.map(
        (library) =>
          library.spec.functions.some((fn) => fn.id === section.id) && libraries.push(library.id)
      )
    )

    return {
      ...section,
      libraries,
    }
  }

const main = async () => {
  mkdirSync(join(__dirname, 'generated'), {
    recursive: true,
  })

  const clientLibraries = await Promise.all(menus.filter(isClientLibReferenceMenu).map(attachSpec))
  const annotateSection = annotateWithLibraries(clientLibraries)

  await Promise.all(
    REF_IDS.map(async (refId) => {
      const sections = getCategory(refId)
      const flatSections = flattenSections(sections)
      const annotatedSections = await Promise.all(flatSections.map(annotateSection))
      return saveJson(refId, annotatedSections)
    })
  )
}

main()
