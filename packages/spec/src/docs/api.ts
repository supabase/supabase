import template from './templates/ApiTemplate'
import { toArrayWithKey } from './helpers'
import { OpenAPIV3 } from 'openapi-types'
const fs = require('fs')
const ejs = require('ejs')
const Helpers = require('./Helpers')
const { writeToDisk } = Helpers

export default async function gen(inputFileName: string, outputDir: string) {
  const specRaw = fs.readFileSync(inputFileName, 'utf8')
  const spec = JSON.parse(specRaw)
  // console.log('spec', spec.openapi)

  switch (spec.openapi) {
    case '3.0.0':
      await gen_v3(spec, outputDir)
      break

    default:
      console.log('Unrecognized specification version:', spec.clispec)
      break
  }
}

/**
 * Versioned Generator
 */
async function gen_v3(spec: OpenAPIV3.Document, dest: string) {
  const paths = Object.entries(spec.paths)
    .map(([key, path], i) => {
      return {
        path: key,
        operations: toArrayWithKey(path!, 'operation'),
      }
    })
    .filter((x) => x.path.indexOf('/v1') === 0)

  const content = ejs.render(template, {
    info: spec.info,
    paths,
  })
  // console.log(content)
  // Write to disk
  await writeToDisk(dest, content)
  console.log('Saved: ', dest)
}

// const pathsToArrays = (pathObject: {
//   path: string
//   get?: object
//   post?: object
//   patch?: object
//   delete?: object
// }) => {
//   return {
//     path: pathObject.path,

//   }
// }
