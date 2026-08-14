import { safeFileSegment, sanitizeIdentifier, toPascalCase } from '../utils'

// Generate page.tsx content
export function generatePageContent(tableName: string): string {
  const safeTableId = sanitizeIdentifier(tableName)
  const pascalName = toPascalCase(safeTableId)
  const listComponentName = `${pascalName}List`
  const safeTable = safeFileSegment(tableName)

  return `import { ${listComponentName} } from './${safeTable}-list'

export default async function ${pascalName}Page() {

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <${listComponentName} />
    </div>
  )
}
`
}
