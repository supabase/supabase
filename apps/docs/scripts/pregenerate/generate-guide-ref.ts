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
import type {
  ICommonFunction,
  ICommonFunctionGroup,
  ICommonSection,
} from '../../components/reference/Reference.types'
import { flattenSections } from '../../lib/helpers'
import commonSections from '../../spec/common-client-libs-sections.json'

const REF_IDS = ['Database', 'Auth', 'Edge Functions', 'Realtime', 'Storage']

const slugify = (s: string) => s.replace(/\s+/g, '_')

const isClientLibReferenceMenu = (menu: Menu): menu is ReferenceMenu =>
  'commonSectionsFile' in menu && menu.commonSectionsFile === 'common-client-libs-sections.json'

const attachSpec = async (library: ReferenceMenu) => ({
  ...library,
  spec: parse(await readFile(join(__dirname, '../..', 'spec', library.specFile), 'utf-8')),
})

type ICommonFnAll = ICommonFunction | ICommonFunctionGroup

const isICommonFnAll = (section: ICommonSection): section is ICommonFnAll =>
  section.type === 'function'

const getCategory = (category: string) =>
  commonSections
    .find((section) => section.type === 'category' && section.title === category)
    ?.items?.filter(isICommonFnAll) ?? []

const saveJson = (refId: string, json: Array<unknown>) =>
  writeFile(
    join(__dirname, 'generated', `commonClientLibFlat-${slugify(refId)}.json`),
    JSON.stringify(json, null, 2),
    { encoding: 'utf-8' }
  )

type RecObject<RecKey extends string | number | symbol, T extends object> = T & {
  [key in RecKey]: Array<RecObject<RecKey, T>>
}

const mapRecursive = <RecKey extends string | number | symbol, Input extends object, Output>(
  mapFn: (input: RecObject<RecKey, Input>) => Output,
  recKey: RecKey,
  arr: Array<RecObject<RecKey, Input>>
) =>
  arr.map((elem) =>
    recKey in elem
      ? {
          ...mapFn(elem),
          [recKey]: mapRecursive(mapFn, recKey, elem[recKey]),
        }
      : mapFn(elem)
  )

const annotateWithLibraries =
  (clientLibraries: Array<{ id: MenuId; spec: any }>) => (section: ICommonSection) => {
    const libraries = [] as Array<string>

    clientLibraries.map(
      (library) =>
        library.spec.functions.some((fn) => fn.id === section.id) && libraries.push(library.id)
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
      const annotatedSections = mapRecursive<
        'items',
        Omit<ICommonFunctionGroup, 'items'>,
        ReturnType<typeof annotateSection>
      >(annotateSection, 'items', flatSections)
      return saveJson(refId, annotatedSections)
    })
  )
}

main()
