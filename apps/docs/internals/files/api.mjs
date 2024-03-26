import sections from '../../spec/common-api-sections.json' assert { type: 'json' }
import { flattenSections } from '../helpers.mjs'

const flatSections = flattenSections(sections)

export function generateAPIPages() {
  let apiPages = []

  flatSections.map((section) => {
    apiPages.push(`reference/api/${section.slug}`)
  })
  return apiPages
}
