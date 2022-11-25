import { TsDoc } from '~/generator/legacy/definitions'

import { uniqBy, values, mapValues } from 'lodash'
import { OpenAPIV3 } from 'openapi-types'

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

  const paramDefinitions: TsDoc.TypeDefinition[] = functionDeclaration.signatures[0].parameters // PMC: seems flaky.. why the [0]?
  if (!paramDefinitions) return ''

  // const paramsComments: TsDoc.CommentTag = tsDefinition.comment?.tags?.filter(x => x.tag == 'param')
  let parameters = paramDefinitions.map((x) => recurseThroughParams(x)) // old join // .join(`\n`)
  return methodListGroup(parameters)
}

function recurseThroughParams(paramDefinition: TsDoc.TypeDefinition) {
  // If this is a reference to another Param, let's use the reference instead
  // @ts-ignore
  let param = isDereferenced(paramDefinition) ? paramDefinition.type?.dereferenced : paramDefinition
  const labelParams = generateLabelParam(param)
  let subContent = ''

  let children = param?.children
  if (param.type?.declaration?.children) {
    children = param.type?.declaration?.children
  } else if (isUnion(param)) {
    // We don't want to show the union types if it's a literal
    const nonLiteralVariants = param.type.types.filter(({ type }) => type !== 'literal')

    if (nonLiteralVariants.length === 0) {
      children = null
    } else {
      children = nonLiteralVariants
    }
  } else if (param.type === 'reflection') {
    children = param.declaration.children
  }

  if (!!children) {
    let properties = children
      .sort((a, b) => a.name?.localeCompare(b.name)) // first alphabetical
      .sort((a, b) => (a.flags?.isOptional ? 1 : -1)) // required params first
      .map((x) => recurseThroughParams(x))

    let heading = 'Properties' // old `<h5 class="method-list-title method-list-title-isChild expanded">Properties</h5>`
    subContent = methodListGroup([heading].concat(properties)) // old join // .join('\n'))
    return { ...labelParams, subContent }
  }
  return { ...labelParams, subContent }
}

const isDereferenced = (paramDefinition: TsDoc.TypeDefinition) => {
  // @ts-ignore
  return paramDefinition.type?.type == 'reference' && paramDefinition.type?.dereferenced?.id
}

const isUnion = (paramDefinition: TsDoc.TypeDefinition) => {
  return paramDefinition.type?.type == 'union'
}

const mergeUnion = (paramDefinition: TsDoc.TypeDefinition) => {
  // @ts-ignore
  const joined = paramDefinition.type.types.reduce((acc, x) => {
    acc.push(...(x.declaration?.children || []))
    return acc
  }, [])

  return uniqBy(joined, 'name')
}

const methodListGroup = (items) => {
  return items
  // old
  // `
  // <ul className="method-list-group">
  //   ${items}
  // </ul>
  // `
}

function generateLabelParam(param: any) {
  let labelParams: any = {}
  if (typeof param.type === 'string' && param.type === 'literal') {
    labelParams = {
      name: param.name ?? param.value,
      isOptional: Boolean(param.flags?.isOptional) || 'defaultValue' in param,
      type: param.type,
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
  } else if (paramDefinition.type?.type == 'union') {
    return paramDefinition.type.types.map((x) =>
      x.value
        ? x.value // old `<code>${x.value}</code>`
        : x.name
        ? x.name // `<code>${x.name}</code>`
        : x.type
        ? x.type // `<code>${x.type}</code>`
        : ''
    )
    // .join(' | ') // dont need to join now
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
type enrichedOperation = OpenAPIV3.OperationObject & {
  path: string
  fullPath: string
  operationId: string
}
export function gen_v3(spec: OpenAPIV3.Document, dest: string, { apiUrl }: { apiUrl: string }) {
  const specLayout = spec.tags || []
  const operations: enrichedOperation[] = []
  console.log('im v3ing')
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

  const content = {
    info: spec.info,
    sections,
    operations,
  }

  return content
}

const slugify = (text: string) => {
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
