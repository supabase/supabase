import template from './templates/ConfigTemplate'
import type { ConfigSpec } from '../types/ConfigSpec'

const yaml = require('js-yaml')
const fs = require('fs')
const ejs = require('ejs')
const Helpers = require('./Helpers')
const { writeToDisk } = Helpers

type Section = {
  id: string
  title: string
}

export default async function gen(inputFileName: string, outputDir: string) {
  const spec = yaml.load(fs.readFileSync(inputFileName, 'utf8'))
  // console.log('spec', spec)

  switch (spec.configspec) {
    case '001':
      await gen_v001(spec, outputDir)
      break

    default:
      console.log('Unrecognized specifcation version:', spec.configspec)
      break
  }
}

/**
 * Versioned Generator
 */
async function gen_v001(spec: ConfigSpec, dest: string) {
  const specLayout = spec.info.tags
  const sections = specLayout.map((section: Section) => {
    const parameters = spec.parameters.filter(
      (parameter) => parameter.tags[0] === section.id
    )
    return { ...section, parameters }
  })

  const content = ejs.render(template, { info: spec.info, sections })
  // console.log(content)
  // Write to disk
  await writeToDisk(dest, content)
  console.log('Saved: ', dest)
}
