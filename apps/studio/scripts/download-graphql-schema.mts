import { stripIndent } from 'common-tags'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Note: This is a build-time script, so we use the fallback URL directly
const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'https://supabase.com/docs'

async function downloadGraphQLSchema() {
  const schemaEndpoint = `${DOCS_URL}/api/graphql`
  const outputPath = path.join(__dirname, './schema.graphql')

  const schemaQuery = stripIndent`
	query SchemaQuery {
		schema
	}
  `

  try {
    const response = await fetch(schemaEndpoint, {
      method: 'POST',
      body: JSON.stringify({
        query: schemaQuery.trim(),
      }),
    })
    const { data, errors } = await response.json()

    if (errors) {
      throw errors
    }

    writeFileSync(outputPath, data.schema, 'utf8')

    console.log(`✅ Successfully downloaded GraphQL schema to ${outputPath}`)
  } catch (error) {
    console.error('🚨 Error generating GraphQL schema:', error)
    process.exit(1)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  downloadGraphQLSchema()
}
