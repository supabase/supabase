import sections from '../../spec/common-api-sections.json'
import { flattenSections } from '../helpers'

const flatSections = flattenSections(sections)

/**
 * Generates the API page links for the management API reference.
 * @returns {Array<{link: string}>} - An array of API page links.
 */
export function generateAPIPages() {
  let apiPages = []

  flatSections.map((section) => {
    apiPages.push({ link: `reference/api/${section.slug}` })
  })
  return apiPages
}
