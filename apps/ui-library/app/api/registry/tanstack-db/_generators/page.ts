import { toCamelCase, toPascalCase } from '../utils'

// Generate page.tsx content
export function generatePageContent(tableName: string): string {
  const pascalName = toPascalCase(tableName)
  const camelName = toCamelCase(tableName)
  const collectionName = `${camelName}Collection`
  const listComponentName = `${pascalName}List`

  return `import { ${collectionName} } from '@/lib/db'

import { ${listComponentName} } from './${tableName}-list'

export default async function ${pascalName}Page() {

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <${listComponentName} />
    </div>
  )
}
`
}
