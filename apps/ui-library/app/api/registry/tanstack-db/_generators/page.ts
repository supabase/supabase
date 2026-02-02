import { toCamelCase, toPascalCase } from '../utils'

// Generate page.tsx content
export function generatePageContent(tableName: string): string {
  const pascalName = toPascalCase(tableName)
  const camelName = toCamelCase(tableName)
  const collectionName = `${camelName}Collection`
  const listComponentName = `${pascalName}List`

  return `import { HydrationBoundary, dehydrate } from '@tanstack/react-query'

import { ${collectionName} } from '@/lib/db'
import { getQueryClient } from '@/lib/query-client'

import { ${listComponentName} } from './${tableName}-list'

export default async function ${pascalName}Page() {
  const queryClient = getQueryClient()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto max-w-4xl py-8">
        <${listComponentName} />
      </div>
    </HydrationBoundary>
  )
}
`
}
