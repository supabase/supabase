/**
 * Usage:
 *    ts-node ReferenceGenerator.ts -o {output_dir} {input}.yml
 *
 * Example:
 *    ts-node ReferenceGenerator.ts -o docs/client spec/supabase.yml
 */

import Example from './spec/gen/components/Example'
import Page from './spec/gen/components/Page'
import Sidebar from './spec/gen/components/Sidebar'
import SidebarCategory from './spec/gen/components/SidebarCategory'
import Tab from './spec/gen/components/Tab'
import { slugify, tsDocCommentToMdComment, writeToDisk } from './spec/gen/lib/helpers'
import { TsDoc, OpenRef } from './spec/gen/definitions'

const yaml = require('js-yaml')
const fs = require('fs')

const main = (fileNames, options) => {
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

async function gen(inputFileName, outputDir) {
  const docSpec = yaml.safeLoad(fs.readFileSync(inputFileName, 'utf8'))
  const defRef = docSpec.info.definition ? fs.readFileSync(docSpec.info.definition, 'utf8') : '{}'

  const definition = JSON.parse(defRef)
  const id = docSpec.info.id
  const allLanguages = docSpec.info.libraries
  const pages = Object.entries(docSpec.pages).map(([name, x]: [string, OpenRef.Page]) => ({
    ...x,
    pageName: name,
  }))

  // Sidebar
  const inputFileNameToSnakeCase = inputFileName.replace('/', '_').replace('.yml', '')
  const sidebarFileName = `sidebar_${inputFileNameToSnakeCase}.js`
  const sidebar = generateSidebar(docSpec)
  await writeToDisk(sidebarFileName, sidebar)
  console.log('Sidebar created: ', sidebarFileName)

  // Index Page
  const indexFilename = outputDir + `/index.mdx`
  const index = generateDocsIndexPage(docSpec, inputFileName)
  await writeToDisk(indexFilename, index)
  console.log('The index was saved: ', indexFilename)

  // Generate Pages
  pages.forEach(async (pageSpec: OpenRef.Page) => {
    try {
      const slug = slugify(pageSpec.pageName)
      const hasTsRef = pageSpec['$ref'] || null
      const tsDefinition = hasTsRef && extractTsDocNode(hasTsRef, definition)
      if (hasTsRef && !tsDefinition) throw new Error('Definition not found: ' + hasTsRef)

      const description =
        pageSpec.description || tsDocCommentToMdComment(getDescriptionFromDefintion(tsDefinition))

      // Create page
      const content = Page({
        slug: (docSpec.info.slugPrefix || '') + slug,
        id: slug,
        specFileName: inputFileName,
        title: pageSpec.title || pageSpec.pageName,
        description,
        parameters: hasTsRef ? generateParameters(tsDefinition) : '',
        spotlight: generateSpotlight(id, pageSpec['examples'] || [], allLanguages),
        examples: generateExamples(id, pageSpec['examples'] || [], allLanguages),
        notes: pageSpec.notes,
      })

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

function getDescriptionFromDefintion(tsDefinition) {
  if (!tsDefinition) return null
  if (['Method', 'Constructor', 'Constructor signature'].includes(tsDefinition.kindString))
    return tsDefinition?.signatures[0].comment
  else return tsDefinition?.comment || ''
}

function recurseThroughParams(paramDefinition: TsDoc.TypeDefinition) {
  let children = paramDefinition.type?.declaration?.children
  const labelParams = {
    name: paramDefinition.name,
    isOptional: !!paramDefinition.flags.isOptional,
    type: extractParamTypeAsString(paramDefinition),
    description: paramDefinition.comment ? tsDocCommentToMdComment(paramDefinition.comment) : null,
  }
  let subContent = ''

  if (!!children) {
    let properties = children
      .sort((a, b) => a.name.localeCompare(b.name)) // first alphabetical
      .sort((a, b) => (a.flags?.isOptional ? 1 : -1)) // required params first
      .map((x) => recurseThroughParams(x))
    let heading = `<h5 class="method-list-title method-list-title-isChild expanded">Properties</h5>`
    subContent = methodListGroup([heading].concat(properties).join('\n'))
  }

  return methodListItemLabel(labelParams, subContent)
}

const methodListGroup = (items) => `
<ul className="method-list-group">
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

function extractParamTypeAsString(paramDefinition) {
  if (paramDefinition.type?.name) {
    return `<code>${paramDefinition.type.name}</code>`
  }
  if (paramDefinition.type?.type == 'union') {
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
  } else {
    return '<code>object</code>'
  }
}

/**
 * Iterates through the definition to find the correct definition.
 * You can pass it a deeply nested node using dot notation. eg: 'LoggedInUser.data.email'
 */
function extractTsDocNode(nodeToFind: string, definition: any) {
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

function generateSidebar(docSpec: any) {
  let path = docSpec.info.docs.path || ''
  let categories = docSpec.info.docs.sidebar.map((x) => {
    const items = x.items.map((item) => {
      let slug = slugify(item)
      return `'${path}${slug}'`
    })
    return SidebarCategory(x.name, items)
  })
  return Sidebar(categories)
}

function generateDocsIndexPage(docSpec: any, inputFileName: string) {
  return Page({
    slug: slugify(docSpec.info.title),
    id: 'index',
    title: docSpec.info.title,
    specFileName: inputFileName,
    description: docSpec.info.description,
  })
}

// Run everything
const argv = require('minimist')(process.argv.slice(2))
main(argv['_'], argv)
