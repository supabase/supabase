import template from './templates/ApiTemplate'
import { slugify, toArrayWithKey, toTitle, writeToDisk } from './helpers'
import { OpenAPIV3, OpenAPIV2 } from 'openapi-types'
import * as fs from 'fs'
import * as ejs from 'ejs'

export default async function gen(inputFileName: string, outputDir: string, apiUrl: string) {
  const specRaw = fs.readFileSync(inputFileName, 'utf8')
  const spec = JSON.parse(specRaw) as any
  switch (spec.openapi || spec.swagger) {
    case '3.0.0':
    case '3.0.3':
      await gen_v3(spec, outputDir, { apiUrl })
      break

    case '2.0':
      await gen_v2(spec, outputDir, { apiUrl })
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
type v3OperationWithPath = OpenAPIV3.OperationObject & {
  path: string
}
export type enrichedOperation = OpenAPIV3.OperationObject & {
  path: string
  fullPath: string
  operationId: string
}
async function gen_v3(spec: OpenAPIV3.Document, dest: string, { apiUrl }: { apiUrl: string }) {
  const specLayout = spec.tags || []
  const operations: enrichedOperation[] = []
  Object.entries(spec.paths).forEach(([key, val]) => {
    const fullPath = `${apiUrl}${key}`

    toArrayWithKey(val!, 'operation').forEach((o) => {
      const operation = o as v3OperationWithPath
      const enriched = {
        ...operation,
        path: key,
        fullPath,
        operationId: slugify(operation.summary!),
        responseList: toArrayWithKey(operation.responses!, 'responseCode') || [],
      }
      operations.push(enriched)
    })
  })

  const sections = specLayout.map((section) => {
    return {
      ...section,
      title: toTitle(section.name),
      id: slugify(section.name),
      operations: operations.filter((operation) => operation.tags?.includes(section.name)),
    }
  })

  const content = ejs.render(template, {
    info: spec.info,
    sections,
    operations,
  })
  // Write to disk
  await writeToDisk(dest, content)
  console.log('Saved: ', dest)
}

// OPENAPI-SPEC-VERSION: 2.0
async function gen_v2(spec: OpenAPIV2.Document, dest: string, { apiUrl }: { apiUrl: string }) {
  const specLayout = spec.tags || []
  const operations: enrichedOperation[] = []
  Object.entries(spec.paths).forEach(([key, val]) => {
    const fullPath = `${apiUrl}${key}`

    toArrayWithKey(val!, 'operation').forEach((o) => {
      const operation = o as v3OperationWithPath
      const enriched = {
        ...operation,
        path: key,
        fullPath,
        operationId: slugify(operation.summary!),
        responseList: toArrayWithKey(operation.responses!, 'responseCode') || [],
      }
      operations.push(enriched)
    })
  })

  const sections = specLayout.map((section) => {
    return {
      ...section,
      title: toTitle(section.name),
      id: slugify(section.name),
      operations: operations.filter((operation) => operation.tags?.includes(section.name)),
    }
  })

  const content = ejs.render(template, {
    info: spec.info,
    sections,
    operations,
  })
  // Write to disk
  await writeToDisk(dest, content)
  console.log('Saved: ', dest)
}
