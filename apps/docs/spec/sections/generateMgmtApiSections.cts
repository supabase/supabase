import fs from 'fs'
import path from 'path'

function slugToTitle(slug) {
  if (!slug) return ''
  const prefixRegex = /^v\d+/
  const title = slug.replace(prefixRegex, '').replace(/-/g, ' ').trimStart()
  return title.charAt(0).toUpperCase() + title.slice(1)
}

function isValidSlug(slug) {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug)
}

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function extractSectionsFromOpenApi(filePaths: string[], outputPath: string) {
  try {
    // Merge paths from all specs, later specs override earlier ones on conflict
    const mergedPaths = Object.assign({}, ...filePaths.map((p) => readJson(p).paths ?? {}))

    const categories: string[] = []
    const sections: Array<{
      type: string
      title: string
      id?: string
      slug?: string
      items: Array<{
        type: string
        title: string
        id: string
        slug: string
      }>
    }> = []

    for (const route in mergedPaths) {
      const methods = mergedPaths[route]
      for (const method in methods) {
        if (methods[method]['x-internal']) {
          continue
        }
        const tag = methods[method].tags?.[0]
        const operationId = methods[method].operationId
        if (!tag || !isValidSlug(operationId)) continue
        if (!categories.includes(tag)) {
          categories.push(tag)
          sections.push({
            type: 'category',
            title: tag,
            items: [],
          })
        }
        const sectionCate = sections.find((i) => i.title === tag)
        sectionCate?.items.push({
          id: operationId,
          title: slugToTitle(operationId),
          slug: operationId,
          type: 'operation',
        })
      }
    }

    sections.sort((a, b) => a.title.localeCompare(b.title))
    sections.forEach((i) => i.items.sort((a, b) => a.title.localeCompare(b.title)))
    sections.unshift({
      title: 'Introduction',
      id: 'introduction',
      slug: 'introduction',
      type: 'markdown',
      items: [],
    })

    fs.writeFileSync(outputPath, JSON.stringify(sections, null, 2), 'utf8')
    console.log(`Sections successfully generated!!!`)
  } catch (error) {
    console.error('Error:', error)
  }
}

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error(
    'Please provide at least one openapi file path and an output file path as arguments.'
  )
  process.exit(1)
}

// Last arg is output, everything before is input files
const outputFilePath = path.resolve(args[args.length - 1])
const inputFilePaths = args.slice(0, -1).map((p) => path.resolve(p))

extractSectionsFromOpenApi(inputFilePaths, outputFilePath)
