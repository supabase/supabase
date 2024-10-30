import fs from 'fs'
import yaml from 'js-yaml'

import cliCommonSections from '../../spec/common-cli-sections.json'
import { flattenSections } from '../helpers'

const flatCLISections = flattenSections(cliCommonSections)

const cliSpec = yaml.load(fs.readFileSync(`spec/cli_v1_commands.yaml`, 'utf8')) as any

/**
 * Generates the CLI page links for the CLI reference.
 * @returns {Array<{link: string}>} - An array of CLI page links.
 */
export function generateCLIPages() {
  let cliPages = []

  cliSpec.commands.map((section) => {
    const slug = flatCLISections.find((item) => item.id === section.id)?.slug
    if (slug) cliPages.push({ link: `reference/cli/${slug}` })
  })
  return cliPages
}
