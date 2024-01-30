// @ts-nocheck

/**
 * Usage:
 *    tsx ReferenceGenerator.ts -o {output_dir} {input}.yml
 *
 * Example:
 *    tsx ReferenceGenerator.ts -o docs/client spec/supabase.yml
 */

import Example from './legacy/components/Example'
import Page from './legacy/components/Page'
import Tab from './legacy/components/Tab'
import { slugify, tsDocCommentToMdComment, writeToDisk } from './legacy/lib/helpers'
import { TsDoc, OpenRef } from './legacy/definitions'
import { uniqBy } from 'lodash'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { flattenSections } from '../lib/helpers'

const commonDocSpecJson = JSON.parse(
  fs.readFileSync('spec/common-client-libs-sections.json', 'utf8')
)

const flattenedCommonDocSpecJson = flattenSections(commonDocSpecJson)

export default async function gen(inputFileName: string, outputDir: string) {
  const docSpec = yaml.load(fs.readFileSync(inputFileName, 'utf8'))
  const defRef = docSpec.info.definition ? fs.readFileSync(docSpec.info.definition, 'utf8') : '{}'

  const definition = JSON.parse(defRef)
  const id = docSpec.info.id
  const allLanguages = docSpec.info.libraries
  const pages = Object.entries(docSpec.functions).map(([name, x]: [string, OpenRef.Page]) => ({
    ...x,
    pageName: name,
  }))

  // Index Page
  const indexFilename = outputDir + `/index.mdx`
  const index = generateDocsIndexPage(docSpec, inputFileName)
  await writeToDisk(indexFilename, index)
  console.log('The index was saved: ', indexFilename)

  // Generate Pages
  pages.forEach(async (pageSpec: OpenRef.Page) => {
    try {
      // get the slug from common-client-libs.yml
      const slug = flattenedCommonDocSpecJson.find((item) => item.id === pageSpec.id).slug

      const hasTsRef = pageSpec['$ref'] || null
      const tsDefinition = hasTsRef && extractTsDocNode(hasTsRef, definition)
      if (hasTsRef && !tsDefinition) throw new Error('Definition not found: ' + hasTsRef)

      const description =
        pageSpec.description || tsDocCommentToMdComment(getDescriptionFromDefinition(tsDefinition))

      // Create page
      const content = Page({
        slug: slug,
        id: pageSpec.id,
        specFileName: docSpec.info.specUrl || inputFileName,
        title: pageSpec.title || pageSpec.pageName,
        description,
        parameters: hasTsRef ? generateParameters(tsDefinition) : '',
        spotlight: generateSpotlight(id, pageSpec['examples'] || [], allLanguages),
        examples: generateExamples(id, pageSpec['examples'] || [], allLanguages),
        notes: pageSpec.notes,
      })
      //console.log({ slug })
      // Write to disk
      const dest = outputDir + `/${slug}.mdx`
      await writeToDisk(dest, content)
      console.log('Saved: ', dest)
    } catch (error) {
      console.error(error)
    }
  })
}

function generateParameters(tsDefinition: any) {
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
  let parameters = paramDefinitions.map((x) => recurseThroughParams(x)).join(`\n`)
  return methodListGroup(parameters)
}

function getDescriptionFromDefinition(tsDefinition) {
  if (!tsDefinition) return null
  if (['Method', 'Constructor', 'Constructor signature'].includes(tsDefinition.kindString))
    return tsDefinition?.signatures[0].comment
  else return tsDefinition?.comment || ''
}

function recurseThroughParams(paramDefinition: TsDoc.TypeDefinition) {
  // If this is a reference to another Param, let's use the reference instead
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

    let heading = `<h5 class="method-list-title method-list-title-isChild expanded">Properties</h5>`
    subContent = methodListGroup([heading].concat(properties).join('\n'))
    return methodListItemLabel(labelParams, subContent)
  }
  return methodListItemLabel(labelParams, subContent)
}

const isDereferenced = (paramDefinition: TsDoc.TypeDefinition) => {
  return paramDefinition.type?.type == 'reference' && paramDefinition.type?.dereferenced?.id
}

const isUnion = (paramDefinition: TsDoc.TypeDefinition) => {
  return paramDefinition.type?.type == 'union'
}

const mergeUnion = (paramDefinition: TsDoc.TypeDefinition) => {
  const joined = paramDefinition.type.types.reduce((acc, x) => {
    acc.push(...(x.declaration?.children || []))
    return acc
  }, [])

  return uniqBy(joined, 'name')
}

const methodListGroup = (items) => `
<ul className="method-list-group not-prose">
  ${items}
</ul>
`

const methodListItemLabel = ({ name, isOptional, type, description }, subContent) => `
<li className="method-list-item">
  <h4 className="method-list-item-label">
    <span className="method-list-item-label-name">
      ${name}
    </span>
    <span className="method-list-item-label-badge ${!isOptional && 'required'}">
      ${isOptional ? 'optional' : 'required'}
    </span>
    <span className="method-list-item-validation">
      ${type}
    </span>
  </h4>
  <div class="method-list-item-description">

${description ? description : 'No description provided. '}

  </div>
  ${subContent}
</li>
`

function generateExamples(id: string, specExamples: any, allLanguages: any) {
  return specExamples.map((example) => {
    let allTabs = example.hideCodeBlock ? '' : generateCodeBlocks(allLanguages, example)
    return Example({
      name: example.name,
      description: example.description,
      tabs: allTabs,
      note: example.note,
    })
  })
}

/**
 * A spotlight is an example which appears at the top of the page.
 */
function generateSpotlight(id: string, specExamples: any | any[], allLanguages: any) {
  if (!Array.isArray(specExamples)) {
    throw new Error(`Examples for each spec should be an array, received: \n${specExamples}`)
  }
  const spotlight = (specExamples && specExamples.find((x) => x.isSpotlight)) || null
  const spotlightContent = !spotlight ? '' : generateCodeBlocks(allLanguages, spotlight)
  return spotlightContent
}

function generateTabs(allLanguages: any, example: any) {
  return allLanguages
    .map((library) => {
      let content = example[library.id] || notImplemented
      return Tab(library.id, content)
    })
    .join('\n')
}

function generateCodeBlocks(allLanguages: any, example: any) {
  return allLanguages
    .map((library) => {
      let content = example[library.id] || notImplemented
      return content
    })
    .join('\n')
}

const notImplemented = `
\`\`\`
Not yet implemented
\`\`\`
`

function generateLabelParam(param: any) {
  let labelParams = {}
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
    return `<code>${paramDefinition.type.name}</code>`
  } else if (paramDefinition.type?.type == 'union') {
    return paramDefinition.type.types
      .map((x) =>
        x.value
          ? `<code>${x.value}</code>`
          : x.name
            ? `<code>${x.name}</code>`
            : x.type
              ? `<code>${x.type}</code>`
              : ''
      )
      .join(' | ')
  }

  return '<code>object</code>'
}

/**
 * Iterates through the definition to find the correct definition.
 * You can pass it a deeply nested node using dot notation. eg: 'LoggedInUser.data.email'
 */
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

function generateDocsIndexPage(docSpec: any, inputFileName: string) {
  return Page({
    slug: (docSpec.info.slugPrefix || '') + slugify(docSpec.info.title),
    id: 'index',
    title: docSpec.info.title,
    specFileName: inputFileName,
    description: docSpec.info.description,
  })
}
