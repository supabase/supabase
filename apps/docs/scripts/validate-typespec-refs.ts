/**
 * Validate that YAML $ref values exist in typeSpec.json
 *
 * Checks: supabase_js_v2.yml $ref → typeSpec.json (generated from combined.json)
 *
 * Usage: pnpm tsx scripts/validate-typespec-refs.ts
 *
 * Note: Run `pnpm prebuild` first to generate typeSpec.json
 */

import { existsSync, readFileSync } from 'fs'
import yaml from 'js-yaml'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SPEC_DIR = join(__dirname, '../spec')
const GENERATED_DIR = join(__dirname, '../features/docs/generated')

interface YamlFunction {
  id: string
  $ref?: string
}

interface YamlSpec {
  functions: YamlFunction[]
}

interface TypeSpecModule {
  name: string
  methods: Record<string, unknown>
}

// Same normalization as Reference.typeSpec.ts
function normalizeRefPath(path: string) {
  return path.replace(/\.index(?=\.|$)/g, '').replace(/\.+/g, '.')
}

// Check if typeSpec.json exists
const typeSpecPath = join(GENERATED_DIR, 'typeSpec.json')
if (!existsSync(typeSpecPath)) {
  console.error('ERROR: typeSpec.json not found!')
  console.error('Run `pnpm prebuild` first to generate it.')
  process.exit(1)
}

// Load typeSpec.json and extract all valid method paths
const typeSpecModules: TypeSpecModule[] = JSON.parse(readFileSync(typeSpecPath, 'utf8'))
const validRefs = new Set<string>()

for (const mod of typeSpecModules) {
  for (const methodPath of Object.keys(mod.methods)) {
    validRefs.add(methodPath)
  }
}

// Load YAML and extract $ref values
const yamlPath = join(SPEC_DIR, 'supabase_js_v2.yml')
const spec = yaml.load(readFileSync(yamlPath, 'utf8')) as YamlSpec

const yamlRefs: Array<{ id: string; ref: string }> = []
for (const fn of spec.functions) {
  if (fn.$ref) {
    yamlRefs.push({ id: fn.id, ref: fn.$ref })
  }
}

// Find invalid refs - check both raw and normalized (matches runtime behavior)
const invalidRefs = yamlRefs.filter(
  ({ ref }) => !validRefs.has(ref) && !validRefs.has(normalizeRefPath(ref))
)
const validCount = yamlRefs.length - invalidRefs.length

// Output
console.log('=== YAML $ref NOT found in TypeSpec ===')
if (invalidRefs.length === 0) {
  console.log('(none)')
} else {
  invalidRefs.forEach(({ id, ref }) => console.log(`- ${ref} (id: ${id})`))
}

console.log(`\n=== Valid refs: ${validCount} | Invalid refs: ${invalidRefs.length} ===`)

// Exit with error code if any invalid refs
if (invalidRefs.length > 0) {
  process.exit(1)
}
