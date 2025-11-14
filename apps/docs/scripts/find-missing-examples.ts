import { readFile } from 'fs/promises'
import { parse } from 'yaml'

interface YamlFunction {
  id: string
  title: string
  $ref: string
  examples?: any[]
}

interface YamlSpec {
  functions: YamlFunction[]
}

async function main() {
  const yamlContent = await readFile('spec/supabase_js_v2.yml', 'utf-8')
  const spec: YamlSpec = parse(yamlContent)

  const missingExamples = spec.functions.filter((fn) => !fn.examples || fn.examples.length === 0)

  console.log(`Total functions: ${spec.functions.length}`)
  console.log(`With examples: ${spec.functions.length - missingExamples.length}`)
  console.log(`Missing examples: ${missingExamples.length}`)
  console.log('\nFunctions missing examples:\n')

  // Group by package
  const byPackage: Record<string, string[]> = {}

  for (const fn of missingExamples) {
    if (!fn.$ref) continue
    const pkg = fn.$ref.split('.')[0]
    if (!byPackage[pkg]) byPackage[pkg] = []
    byPackage[pkg].push(fn.id)
  }

  for (const [pkg, ids] of Object.entries(byPackage)) {
    console.log(`\n${pkg} (${ids.length}):`)
    ids.forEach((id) => console.log(`  - ${id}`))
  }
}

main().catch(console.error)
