import template from './templates/ApiTemplate'
import { slugify, toArrayWithKey } from './helpers'
import { OpenAPIV3, OpenAPIV2 } from 'openapi-types'
const fs = require('fs')
const ejs = require('ejs')
const Helpers = require('./Helpers')
const { writeToDisk } = Helpers

export default async function gen(inputFileName: string, outputDir: string) {
  const specRaw = fs.readFileSync(inputFileName, 'utf8')
  const spec = JSON.parse(specRaw)
  // console.log('spec', spec)

  switch (spec.openapi || spec.swagger) {
    case '3.0.0':
      await gen_v3(spec, outputDir)
      break

    case '2.0':
      await gen_v2(spec, outputDir)
      break

    default:
      console.log('Unrecognized specification version:', spec.openapi)
      break
  }
}

/**
 * Versioned Generator
 */

// OPENAPI-SPEC-VERSION: 3.0.0
async function gen_v3(spec: OpenAPIV3.Document, dest: string) {
  const paths = Object.entries(spec.paths).map(([key, path], i) => {
    return {
      path: key,
      operations: toArrayWithKey(path!, 'operation'),
    }
  })

  const content = ejs.render(template, {
    info: spec.info,
    paths,
  })
  // console.log(content)
  // Write to disk
  await writeToDisk(dest, content)
  console.log('Saved: ', dest)
}

// OPENAPI-SPEC-VERSION: 2.0
async function gen_v2(spec: OpenAPIV2.Document, dest: string) {
  const paths = Object.entries(spec.paths).map(([key, path]) => {
    return {
      path: key,
      operations: toArrayWithKey(path!, 'operation').map((o) => {
        const operation = o as OpenAPIV2.OperationObject & {
          path: string
        }
        return {
          ...operation,
          operationId: slugify(operation.summary!),
          responses: toArrayWithKey(operation.responses!, 'responseCode'),
        }
      }),
    }
  })

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
