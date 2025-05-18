const fs = require('fs')
const path = require('path')

function slugToTitle(slug) {
  if (!slug) return ''
  // remove version prefix if available
  const prefixRegex = /^v\d+/
  const title = slug.replace(prefixRegex, '').replace(/-/g, ' ').trimStart()
  return title.charAt(0).toUpperCase() + title.slice(1)
}

function isValidSlug(slug) {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug)
}

function extractSectionsFromOpenApi(filePath, outputPath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err)
      return
    }

    try {
      const openApiJson = JSON.parse(data)
      const categories = []
      const sections = []

      if (openApiJson.paths) {
        for (const route in openApiJson.paths) {
          const methods = openApiJson.paths[route]
          for (const method in methods) {
            const tag = methods[method].tags[0]
            const operationId = methods[method].operationId
            // If operationId is not in the form of a slug ignore it.
            // This is intentional because operationId is not defined under the swagger
            // spec and is extracted automatically from the function name.
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
      sections.sort((a, b) => a.title.localeCompare(b.title))
      sections.forEach((i) => i.items.sort((a, b) => a.title.localeCompare(b.title)))
      sections.unshift({
        title: 'Introduction',
        id: 'introduction',
        slug: 'introduction',
        type: 'markdown',
      })

      fs.writeFile(outputPath, JSON.stringify(sections, null, 2), 'utf8', (err) => {
        if (err) {
          console.error(`Error writing to file ${outputPath}:`, err)
          return
        }
        console.log(`Sections successfully generated!!!`)
      })
    } catch (error) {
      console.error('Error parsing JSON:', error)
    }
  })
}

// Get file paths from command line arguments
const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Please provide the openapi file path and output file path as arguments.')
  process.exit(1)
}

const inputFilePath = path.resolve(args[0])
const outputFilePath = path.resolve(args[1])

;(async () => {
  extractSectionsFromOpenApi(inputFilePath, outputFilePath)
})()
