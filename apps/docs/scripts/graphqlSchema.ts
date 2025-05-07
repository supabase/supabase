import { printSchema } from 'graphql'
import fs from 'node:fs'
import path from 'node:path'
import { rootGraphQLSchema } from '../resources/rootSchema'

async function generateGraphQLSchema() {
  try {
    const schemaString = printSchema(rootGraphQLSchema)

    const outputDir = path.resolve(__dirname, '../__generated__')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputPath = path.resolve(outputDir, 'schema.graphql')
    fs.writeFileSync(outputPath, schemaString)

    console.log(`✅ Successfully generated GraphQL schema at ${outputPath}`)
  } catch (error) {
    console.error('🚨 Error generating GraphQL schema:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  generateGraphQLSchema()
}
