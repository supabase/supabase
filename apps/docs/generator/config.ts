import template from './templates/ConfigTemplate'
import type { ConfigSpec } from './types/ConfigSpec'

import * as fs from 'fs'
import * as ejs from 'ejs'
import * as yaml from 'js-yaml'
import { writeToDisk } from './helpers'

type Section = {
  id: string
  title: string
}

export default async function gen(inputFileName: string, outputDir: string) {
  const spec = yaml.load(fs.readFileSync(inputFileName, 'utf8')) as any
  // console.log('spec', spec)

  switch (spec.configspec) {
    case '001':
      await gen_v001(spec, outputDir)
      break

    default:
      console.log('Unrecognized specification version:', spec.configspec)
      break
  }
}

/**
 * Versioned Generator
 */
async function gen_v001(spec: ConfigSpec, dest: string) {
  const specLayout = spec.info.tags
  const sections = specLayout.map((section: Section) => {
    const parameters = spec.parameters.filter((parameter) => parameter.tags[0] === section.id)
    return { ...section, parameters }
  })

  const content = ejs.render(template, { info: spec.info, sections })
  // console.log(content)
  // Write to disk
  await writeToDisk(dest, content)
  console.log('Saved: ', dest)
}
