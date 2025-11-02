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
  let cliPages: Array<{ link: string; priority: number }> = []

  cliSpec.commands.map((section: any) => {
    const slug = (flatCLISections as any[]).find((item: any) => item.id === section.id)?.slug
    if (slug) cliPages.push({ link: `reference/cli/${slug}`, priority: 0.8 })
  })
  return cliPages
}
