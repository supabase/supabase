import template from '../templates/ConfigTemplate'
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
type Layout = 'cli' | 'gotrue'
const layout: { cli: Section[]; gotrue: [] } = {
  cli: [
    { id: 'general', title: 'General' },
    { id: 'api', title: 'API' },
    { id: 'database', title: 'Database' },
    { id: 'dashboard', title: 'Dashboard' },
    { id: 'local', title: 'Local Development' },
    { id: 'auth', title: 'Auth' },
  ],
  gotrue: [],
}

const main = (fileNames: string[], options: any) => {
  try {
    const outputDir = options.o || options.output || ''
    fileNames.forEach((inputFileName) => {
      gen(inputFileName, outputDir)
    })
    return
  } catch (e) {
    console.log(e)
  }
}

async function gen(inputFileName: string, outputDir: string) {
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

// Run everything
const argv = require('minimist')(process.argv.slice(2))
main(argv['_'], argv)

/**
 * Versioned Generator
 */
async function gen_v001(spec: ConfigSpec, dest: string) {
  const layoutId: Layout = spec.info.id as Layout
  const specLayout = layout[layoutId]
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
