import fs from 'fs'
import crypto from 'crypto'
import yaml from 'js-yaml'
import { flattenSections } from '../../lib/helpers'
import { nameMap } from '../helpers'

import commonLibSections from '~/../../spec/common-client-libs-sections.json'

const clientLibFiles = [
  { fileName: 'supabase_js_v2', label: 'javascript', version: 'v2', versionSlug: false },
  { fileName: 'supabase_js_v1', label: 'javascript', version: 'v1', versionSlug: true },
  { fileName: 'supabase_dart_v1', label: 'dart', version: 'v1', versionSlug: false },
  { fileName: 'supabase_dart_v0', label: 'dart', version: 'v0', versionSlug: true },
  { fileName: 'supabase_dart_v0', label: 'dart', version: 'v0', versionSlug: true },
]

const flatCommonLibSections = flattenSections(commonLibSections)

export function generateClientLibSearchObjects() {
  // loop through each spec file, find the correspending entry in the common file and grab the title / description / slug
  let clientLibSearchObjects = []

  clientLibFiles.map((file) => {
    const specs = yaml.load(fs.readFileSync(`../../spec/${file.fileName}.yml`, 'utf8'))

    //take each function id, find it in the commonLibSections file and return { id, title, slug, description, }
    //@ts-ignore
    specs.functions.map((fn) => {
      const item = flatCommonLibSections.find((section) => section.id === fn.id)
      if (item) {
        const object = clientLibSearchObjects.push({
          objectID: crypto.randomUUID(),
          id: item.id,
          title: item.title,
          description: item.title,
          url: `/reference/${file.label}/${file.versionSlug ? file.version + '/' : ''}${item.slug}`,
          source: 'reference',
          pageContent: '',
          category: item.product,
          version: file.version,
          type: 'lvl2',
          hierarchy: {
            lvl0: 'References',
            lvl1: `${nameMap[file.label]} ${file.version}`,
            lvl2: item.title,
            lvl3: file.version,
            lvl4: null,
            lvl5: null,
            lvl6: null,
          },
        })
        return object
      }
    })
  })
  return clientLibSearchObjects
}
