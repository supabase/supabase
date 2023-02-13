import crypto from 'crypto'
import fs from 'fs'
import { flattenSections } from '../../lib/helpers'
import cliCommonSections from '~/../../spec/common-cli-sections.json'
import yaml from 'js-yaml'

// @ts-ignore

const spec = yaml.load(fs.readFileSync(`../../spec/cli_v1_commands.yaml`, 'utf8'))

const commonSections = flattenSections(cliCommonSections)

export function generateCLISearchObjects() {
  let searchObjects = []

  //@ts-ignore
  spec.commands.map((section) => {
    const object = searchObjects.push({
      objectID: crypto.randomUUID(),
      id: section.id,
      title: section.title,
      // @ts-ignore
      description: section.description?.substr(0, section.description.indexOf('\n')),
      url: `/reference/cli/${commonSections.find((item) => item.id === section.id)?.slug}`,
      source: 'reference',
      pageContent: '',
      category: section.product,
      version: '',
      type: 'lvl2',
      hierarchy: {
        lvl0: 'References',
        lvl1: 'Supabase CLI',
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
