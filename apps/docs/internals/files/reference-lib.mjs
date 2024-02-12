import fs from 'fs'

import yaml from 'js-yaml'
import commonLibSections from '../../spec/common-client-libs-sections.json' assert { type: 'json' }
import { flattenSections } from '../helpers.mjs'

const flatCommonLibSections = flattenSections(commonLibSections)

const clientLibFiles = [
  { fileName: 'supabase_js_v2', label: 'javascript', version: 'v2', versionSlug: false },
  { fileName: 'supabase_dart_v2', label: 'dart', version: 'v2', versionSlug: false },
  { fileName: 'supabase_py_v2', label: 'python', version: 'v2', versionSlug: false },
  { fileName: 'supabase_csharp_v0', label: 'csharp', version: 'v0', versionSlug: false },
  { fileName: 'supabase_swift_v1', label: 'swift', version: 'v1', versionSlug: false },
  { fileName: 'supabase_kt_v2', label: 'kotlin', version: 'v2', versionSlug: false },
]

export function generateReferencePages() {
  let refPages = []
  clientLibFiles.map((file) => {
    const spec = yaml.load(fs.readFileSync(`spec/${file.fileName}.yml`, 'utf8'))
    spec.functions.map((fn) => {
      const slug = flatCommonLibSections.find((item) => item.id === fn.id)?.slug
      refPages.push(`reference/${file.label}/${file.versionSlug ? file.version + '/' : ''}${slug}`)
    })
  })
  return refPages
}
