import React from 'react'
import { TsDoc } from '~/generator/legacy/definitions'

import { uniqBy } from 'lodash'

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
    return methodListItemLabel(labelParams, subContent)
  }
  return methodListItemLabel(labelParams, subContent)
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

const methodListItemLabel = ({ name, isOptional, type, description }, subContent) => {
  return {
    name,
    isOptional,
    type,
    description,
    subContent,
  }
  // `
  // <li className="method-list-item">
  //   <h4 className="method-list-item-label">
  //     <span className="method-list-item-label-name">
  //       ${name}
  //     </span>
  //     <span className="method-list-item-label-badge ${!isOptional && 'required'}">
  //       ${isOptional ? 'optional' : 'required'}
  //     </span>
  //     <span className="method-list-item-validation">
  //       ${type}
  //     </span>
  //   </h4>
  //   <div class="method-list-item-description">

  // ${description ? description : 'No description provided. '}

  //   </div>
  //   ${subContent}
  // </li>
  // `
}

function generateLabelParam(param: any) {
  let labelParams: any = {}
  if (typeof param.type === 'string' && param.type === 'literal') {
    labelParams = {
      name: param.name ?? param.value,
      isOptional: !!param.flags?.isOptional,
      type: param.type,
      description: param.comment ? tsDocCommentToMdComment(param.comment) : null,
    }
  } else {
    labelParams = {
      name: param.name ?? extractParamTypeAsString(param),
      isOptional: !!param.flags?.isOptional,
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
