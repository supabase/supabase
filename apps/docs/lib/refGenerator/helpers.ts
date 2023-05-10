import { TsDoc } from '../../generator/legacy/definitions'

import { values, mapValues } from 'lodash'
import { OpenAPIV3 } from 'openapi-types'
import { flattenSections } from '../helpers'
import { ICommonItem } from '~/components/reference/Reference.types'

export function extractTsDocNode(nodeToFind: string, definition: any) {
  const nodePath = nodeToFind.split('.')
  let i = 0
  let previousNode = definition
  let currentNode = definition
  while (i < nodePath.length) {
    previousNode = currentNode
    currentNode = previousNode.children.find((x) => x.name == nodePath[i]) || null
    if (currentNode == null) {
      console.log(`Cant find ${nodePath[i]} in ${previousNode.children.map((x) => '\n' + x.name)}`)
      break
    }
    i++
  }

  return currentNode
}

export function generateParameters(tsDefinition: any) {
  let functionDeclaration = null
  if (tsDefinition.kindString == 'Method') {
    functionDeclaration = tsDefinition
  } else if (tsDefinition.kindString == 'Constructor') {
    functionDeclaration = tsDefinition
  } else functionDeclaration = tsDefinition?.type?.declaration
  if (!functionDeclaration) return ''

  // Functions can have multiple signatures - select the last one since that
  // tends to be closer to primitive types (citation needed).
  const paramDefinitions: TsDoc.TypeDefinition[] = functionDeclaration.signatures.at(-1).parameters
  if (!paramDefinitions) return ''

  // const paramsComments: TsDoc.CommentTag = tsDefinition.comment?.tags?.filter(x => x.tag == 'param')
  let parameters = paramDefinitions.map((x) => recurseThroughParams(x)) // old join // .join(`\n`)
  return parameters
}

function recurseThroughParams(paramDefinition: any) {
  const param = { ...paramDefinition }
  const labelParams = generateLabelParam(param)

  let children: any[]
  if (param.type?.type === 'literal') {
    // skip: literal types have no children
  } else if (param.type?.type === 'intrinsic') {
    // primitive types
    if (!['string', 'number', 'boolean', 'object', 'unknown'].includes(param.type?.name)) {
      // skip for now
      //throw new Error('unexpected intrinsic type')
    }
  } else if (param.type?.dereferenced) {
    const dereferenced = param.type.dereferenced

    if (dereferenced.children) {
      children = dereferenced.children
    } else if (dereferenced.type?.declaration?.children) {
      children = dereferenced.type.declaration.children
    } else if (dereferenced.type?.type === 'query') {
      // skip: ignore types created from `typeof` for now, like `type Fetch = typeof fetch`
    } else if (dereferenced.type?.type === 'union') {
      // skip: we don't want to show unions as nested parameters
    } else if (Object.keys(dereferenced).length === 0) {
      // skip: {} have no children
    } else {
      throw new Error('unexpected case for dereferenced param type')
    }
  } else if (param.type?.type === 'reflection') {
    const declaration = param.type.declaration

    if (!declaration) {
      throw new Error('reflection must have a declaration')
    }

    if (declaration.children) {
      children = declaration.children
    } else if (declaration.signatures) {
      // skip: functions have no children
    } else if (declaration.name === '__type') {
      // skip: mostly inlined object type
    } else {
      throw new Error('unexpected case for reflection param type')
    }
  } else if (param.type?.type === 'indexedAccess') {
    // skip: too complex, e.g. PromisifyMethods<Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>>
  } else if (param.type?.type === 'reference') {
    // skip: mostly unexported types
  } else if (param.type?.type === 'union') {
    // skip: we don't want to show unions as nested parameters
  } else if (param.type?.type === 'array') {
    // skip: no use for it for now
  } else {
    // skip: no use for now
    //throw new Error(`unexpected param type`)
  }

  if (children) {
    const properties = children
      .sort((a, b) => a.name?.localeCompare(b.name)) // first alphabetical
      .sort((a, b) => (a.flags?.isOptional ? 1 : -1)) // required params first
      .map((x) => recurseThroughParams(x))
    labelParams.subContent = properties
  }
  return labelParams
}

// const isDereferenced = (paramDefinition: TsDoc.TypeDefinition) => {
//   // @ts-ignore
//   return paramDefinition.type?.type == 'reference' && paramDefinition.type?.dereferenced?.id
// }

function generateLabelParam(param: any) {
  let labelParams: any = {}
  if (param.type?.type === 'intrinsic' && param.type?.name === 'unknown') {
    labelParams = {
      name: param.name ?? param.value,
      isOptional: Boolean(param.flags?.isOptional) || 'defaultValue' in param,
      type: 'any',
      description: param.comment ? tsDocCommentToMdComment(param.comment) : null,
    }
  } else if (param.type?.declaration?.signatures) {
    labelParams = {
      name: param.name ?? param.value,
      isOptional: Boolean(param.flags?.isOptional) || 'defaultValue' in param,
      type: 'function',
      description: param.comment ? tsDocCommentToMdComment(param.comment) : null,
    }
  } else if (param.type?.type === 'literal') {
    labelParams = {
      name: param.name ?? param.value,
      isOptional: Boolean(param.flags?.isOptional) || 'defaultValue' in param,
      type: typeof param.type.value === 'string' ? `"${param.type.value}"` : `${param.type.value}`,
      description: param.comment ? tsDocCommentToMdComment(param.comment) : null,
    }
  } else {
    labelParams = {
      name: param.name ?? extractParamTypeAsString(param),
      isOptional: Boolean(param.flags?.isOptional) || 'defaultValue' in param,
      type: extractParamTypeAsString(param),
      description: param.comment ? tsDocCommentToMdComment(param.comment) : null,
    }
  }
  return labelParams
}

function extractParamTypeAsString(paramDefinition) {
  if (paramDefinition.type?.name) {
    // return `<code>${paramDefinition.type.name}</code>` // old
    return paramDefinition.type.name
  } else if (paramDefinition.type?.type === 'union') {
    // only do this for literal/primitive types - for complex objects we just return 'object'
    if (paramDefinition.type.types.every(({ type }) => ['literal', 'intrinsic'].includes(type))) {
      return paramDefinition.type.types
        .map((x) => {
          if (x.type === 'literal') {
            if (typeof x.value === 'string') {
              return `"${x.value}"`
            }
            return `${x.value}`
          } else if (x.type === 'intrinsic') {
            if (x.name === 'unknown') {
              return 'any'
            }
            return x.name
          }
        })
        .join(' | ')
    }
  } else if (paramDefinition.type?.type === 'array') {
    const elementType = paramDefinition.type.elementType

    if (elementType.type === 'intrinsic') {
      if (elementType.name === 'unknown') {
        return 'any[]'
      }
      return `${elementType.name}[]`
    }

    return 'object[]'
  }

  return 'object' // old '<code>object</code>'
}

const tsDocCommentToMdComment = (commentObject: TsDoc.DocComment) =>
  `
${commentObject?.shortText || ''}

${commentObject?.text || ''}

`.trim()

// function generateExamples(id: string, specExamples: any, allLanguages: any) {
//   return specExamples.map((example) => {
//     let allTabs = example.hideCodeBlock ? '' : generateCodeBlocks(allLanguages, example)
//     return Example({
//       name: example.name,
//       description: example.description,
//       tabs: allTabs,
//       note: example.note,
//     })
//   })
// }

// OPENAPI-SPEC-VERSION: 3.0.0
type v3OperationWithPath = OpenAPIV3.OperationObject & {
  path: string
}

export type enrichedOperation = OpenAPIV3.OperationObject & {
  path: string
  fullPath: string
  operationId: string
  operation: string
  responseList: []
  description?: string
  parameters?: []
  responses?: {}
  security?: []
  summary?: string
  tags?: []
}

export function gen_v3(spec: OpenAPIV3.Document, dest: string, { apiUrl }: { apiUrl: string }) {
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
      // @ts-expect-error // missing 'responses', see OpenAPIV3.OperationObject.responses
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

  const content = {
    info: spec.info,
    sections,
    operations,
  }

  return content
}

const slugify = (text: string) => {
  if (!text) return ''
  return text
    .toString()
    .toLowerCase()
    .replace(/[. )(]/g, '-') // Replace spaces and brackets -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

// Uppercase the first letter of a string
const toTitle = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Convert Object to Array of values
 */
export const toArrayWithKey = (obj: object, keyAs: string) =>
  values(
    mapValues(obj, (value: any, key: string) => {
      value[keyAs] = key
      return value
    })
  )

/**
 * Get a list of common section IDs that are available in this spec
 */
export function getAvailableSectionIds(sections: ICommonItem[], spec: any) {
  // Filter parent sections first

  const specIds = spec.functions.map(({ id }) => id)

  const newShape = flattenSections(sections).filter((section) => {
    if (specIds.includes(section.id)) {
      return section
    }
  })

  const final = newShape.map((func) => {
    return func.id
  })

  return final
}
