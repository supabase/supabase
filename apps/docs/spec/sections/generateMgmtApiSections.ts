import { OpenAPIV3 } from 'openapi-types'
const fs = require('fs')
const path = require('path')

interface Section {
  type: 'category' | 'markdown' | 'operation'
  title: string
  id?: string
  slug?: string
  items?: Section[]
}

function slugToTitle(slug: string | undefined): string {
  if (!slug) return ''
  // remove version prefix if available
  const prefixRegex = /^v\d+/
  const title = slug.replace(prefixRegex, '').replace(/-/g, ' ').trimStart()
  return title.charAt(0).toUpperCase() + title.slice(1)
}

function isValidSlug(slug: string | undefined): boolean {
  if (!slug) return false
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug)
}

function extractSectionsFromOpenApi(filePath: string, outputPath: string): void {
  fs.readFile(filePath, 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err)
      return
    }

    try {
      const openApiJson = JSON.parse(data) as OpenAPIV3.Document
      const categories: string[] = []
      const sections: Section[] = []

      if (openApiJson.paths) {
        for (const route in openApiJson.paths) {
          const methods = openApiJson.paths[route] as OpenAPIV3.PathItemObject
          for (const method in methods) {
            if (method === 'parameters' || method === 'summary' || method === 'description') continue // Skip non-operation fields
            const operation = methods[method as OpenAPIV3.HttpMethods]
            if (!operation) continue
            const tags = operation.tags
            const operationId = operation.operationId
            // If operationId is not in the form of a slug ignore it.
            // This is intentional because operationId is not defined under the swagger
            // spec and is extracted automatically from the function name.
            if (!tags?.[0] || !isValidSlug(operationId)) continue

            const tag = tags[0]
            if (!categories.includes(tag)) {
              categories.push(tag)
              sections.push({
                type: 'category',
                title: tag,
                items: [] as Section[],
              })
            }

            const sectionCate = sections.find((i) => i.title === tag)
            if (!sectionCate || !sectionCate.items) continue
            sectionCate.items.push({
              id: operationId,
              title: slugToTitle(operationId),
              slug: operationId,
              type: 'operation',
            })
          }
        }
      }

      // finalize sections
      sections.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
      sections.forEach((section) => {
        if (section.items) {
          section.items.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
        }
      })
      sections.unshift({
        title: 'Introduction',
        id: 'introduction',
        slug: 'introduction',
        type: 'markdown',
      })

      fs.writeFile(outputPath, JSON.stringify(sections, null, 2), 'utf8', (err: NodeJS.ErrnoException | null) => {
        if (err) {
          console.error(`Error writing to file ${outputPath}:`, err)
          return
        }
        console.log(`Sections successfully generated!!!`)
      })
    } catch (error: unknown) {
      console.error('Error parsing JSON:', error)
    }
  })
}

// Get file paths from command line arguments
function main(): void {
  const args = process.argv.slice(2)
  if (args.length < 2) {
    console.error('Please provide the openapi file path and output file path as arguments.')
    process.exit(1)
  }

  const inputFilePath = path.resolve(args[0])
  const outputFilePath = path.resolve(args[1])

  extractSectionsFromOpenApi(inputFilePath, outputFilePath)
}

main()
