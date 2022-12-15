import fs from 'fs'

import yaml from 'js-yaml'
import commonLibSections from '../../../../spec/common-client-libs-sections.json' assert { type: 'json' }

function flattenSections(sections) {
  var a = []
  for (var i = 0; i < sections.length; i++) {
    if (sections[i].id) {
      // only push a section that has an id
      // these are reserved for sidebar subtitles
      a.push(sections[i])
    }
    if (sections[i].items) {
      // if there are subitems, loop through
      a = a.concat(flattenSections(sections[i].items))
    }
  }
  return a
}

const flatCommonLibSections = flattenSections(commonLibSections)

const clientLibFiles = [
  { fileName: 'supabase_js_v2', label: 'javascript', version: 'v2', versionSlug: false },
  { fileName: 'supabase_js_v1', label: 'javascript', version: 'v1', versionSlug: true },
  { fileName: 'supabase_dart_v1', label: 'dart', version: 'v1', versionSlug: false },
  { fileName: 'supabase_dart_v0', label: 'dart', version: 'v0', versionSlug: true },
  { fileName: 'supabase_dart_v0', label: 'dart', version: 'v0', versionSlug: true },
]

export function generateReferencePages() {
  let refPages = []
  clientLibFiles.map((file) => {
    const spec = yaml.load(fs.readFileSync(`../../spec/${file.fileName}.yml`, 'utf8'))
    spec.functions.map((fn) => {
      const slug = flatCommonLibSections.find((item) => item.id === fn.id)?.slug
      refPages.push(`reference/${file.label}/${file.versionSlug ? file.version + '/' : ''}${slug}`)
    })
  })
  return refPages
}
