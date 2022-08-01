import template from './templates/SdkTemplate'
import type { SdkSpec } from '../types/SdkSpec'

const yaml = require('js-yaml')
const fs = require('fs')
const ejs = require('ejs')
const Helpers = require('./Helpers')
const { writeToDisk } = Helpers

export default async function gen(inputFileName: string, outputDir: string) {
  const spec = yaml.load(fs.readFileSync(inputFileName, 'utf8'))
  // console.log('spec', spec)

  switch (spec.sdkspec) {
    case '001':
      await gen_v001(spec, outputDir)
      break

    default:
      console.log('Unrecognized specification version:', spec.sdkspec)
      break
  }
}

/**
 * Versioned Generator
 */
async function gen_v001(spec: SdkSpec, dest: string) {
  const functions = spec.functions
  const types = spec.types

  const content = ejs.render(template, {
    info: spec.info,
    functions,
    types,
  })
  // console.log(content)
  // Write to disk
  await writeToDisk(dest, content)
  console.log('Saved: ', dest)
}
