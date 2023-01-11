import crypto from 'crypto'
import { flattenSections } from '../../lib/helpers'

import apiCommonSections from '~/../../spec/common-api-sections.json'
import specFile from '~/../../spec/transforms/api_v0_openapi_deparsed.json'
import { gen_v3 } from '../../lib/refGenerator/helpers'

// @ts-ignore
const generatedSpec = gen_v3(specFile, 'wat', { apiUrl: 'apiv0' })
const sections = flattenSections(apiCommonSections)

export function generateAPISearchObjects() {
  let searchObjects = []

  //@ts-ignore
  sections.map((section) => {
    const object = searchObjects.push({
      objectID: crypto.randomUUID(),
      id: section.id,
      title: section.title,
      // @ts-ignore
      description: generatedSpec.operations.find((item) => item.operationId === section.id)
        ?.summary,
      url: `/reference/api/${section.slug}`,
      source: 'reference',
      pageContent: '',
      category: section.product,
      version: '',
      type: 'lvl2',
      hierarchy: {
        lvl0: 'References',
        lvl1: 'Management API',
        lvl2: section.title,
        lvl3: null,
        lvl4: null,
        lvl5: null,
        lvl6: null,
      },
    })
    return object
  })
  return searchObjects
}
