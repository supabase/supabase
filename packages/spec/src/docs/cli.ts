import template from './templates/CliTemplate'
import type { CliSpec } from '../types/CliSpec'

const yaml = require('js-yaml')
const fs = require('fs')
const ejs = require('ejs')
const Helpers = require('./Helpers')
const { writeToDisk } = Helpers

export default async function gen(inputFileName: string, outputDir: string) {
  const spec = yaml.load(fs.readFileSync(inputFileName, 'utf8'))
  // console.log('spec', spec)

  switch (spec.clispec) {
    case '001':
      await gen_v001(spec, outputDir)
      break

    default:
      console.log('Unrecognized specification version:', spec.clispec)
      break
  }
}

/**
 * Versioned Generator
 */
async function gen_v001(spec: CliSpec, dest: string) {
  const commands = spec.commands

  const content = ejs.render(template, {
    info: spec.info,
    commands,
  })
  // console.log(content)
  // Write to disk
  await writeToDisk(dest, content)
  console.log('Saved: ', dest)
}
