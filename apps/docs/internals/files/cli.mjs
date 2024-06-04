import fs from 'fs'
import yaml from 'js-yaml'
import cliCommonSections from '../../spec/common-cli-sections.json' assert { type: 'json' }
import { flattenSections } from '../helpers.mjs'

const flatCLISections = flattenSections(cliCommonSections)

const cliSpec = yaml.load(fs.readFileSync(`spec/cli_v1_commands.yaml`, 'utf8'))

export function generateCLIPages() {
  let cliPages = []

  cliSpec.commands.map((section) => {
    const slug = flatCLISections.find((item) => item.id === section.id)?.slug
    if (slug) cliPages.push(`reference/cli/${slug}`)
  })
  return cliPages
}
