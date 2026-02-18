/**
 * Find methods in typeSpec.json that are NOT documented in supabase_js_v2.yml
 *
 * Usage: pnpm tsx scripts/find-undocumented.ts
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

// Categorize a method path
function categorizeMethod(methodPath: string): 'public' | 'constructor' | 'error' | 'internal' {
  const parts = methodPath.split('.')
  const methodName = parts[parts.length - 1]
  const className = parts[parts.length - 2]

  // Internal/private methods start with _
  if (methodName.startsWith('_')) {
    return 'internal'
  }

  // Error class constructors
  if (className?.endsWith('Error') && methodName === 'constructor') {
    return 'error'
  }

  // Other constructors
  if (methodName === 'constructor') {
    return 'constructor'
  }

  return 'public'
}

// Dynamically detect re-exports from typeSpec data
// If a class exists in both @supabase/supabase-js and another @supabase/* package,
// prefer the other package (which is the original source)
function buildReexportMap(typeSpecModules: TypeSpecModule[]): Map<string, string> {
  const classToPackages = new Map<string, Set<string>>()

  for (const mod of typeSpecModules) {
    for (const methodPath of Object.keys(mod.methods)) {
      const parts = methodPath.split('.')
      const pkg = parts[0]
      const className = parts[1]
      if (pkg?.startsWith('@supabase/') && className) {
        if (!classToPackages.has(className)) {
          classToPackages.set(className, new Set())
        }
        classToPackages.get(className)!.add(pkg)
      }
    }
  }

  // For classes in multiple packages, map supabase-js to the original package
  const reexportMap = new Map<string, string>()
  for (const [className, packages] of classToPackages) {
    if (packages.has('@supabase/supabase-js') && packages.size > 1) {
      // Find the original package (not supabase-js)
      for (const pkg of packages) {
        if (pkg !== '@supabase/supabase-js') {
          reexportMap.set(className, pkg)
          break
        }
      }
    }
  }
  return reexportMap
}

// Get the "canonical" path (prefer original package over supabase-js re-exports)
function getCanonicalPath(methodPath: string, reexportMap: Map<string, string>): string {
  if (methodPath.startsWith('@supabase/supabase-js.')) {
    const parts = methodPath.split('.')
    const className = parts[1]
    const originalPkg = reexportMap.get(className)
    if (originalPkg) {
      return methodPath.replace('@supabase/supabase-js', originalPkg)
    }
  }
  return methodPath
}

// Check if typeSpec.json exists
const typeSpecPath = join(GENERATED_DIR, 'typeSpec.json')
if (!existsSync(typeSpecPath)) {
  console.error('ERROR: typeSpec.json not found!')
  console.error('Run `pnpm prebuild` first to generate it.')
  process.exit(1)
}

// Load typeSpec.json and get all method paths
const typeSpecModules: TypeSpecModule[] = JSON.parse(readFileSync(typeSpecPath, 'utf8'))
const allMethods: string[] = []

for (const mod of typeSpecModules) {
  for (const methodPath of Object.keys(mod.methods)) {
    allMethods.push(methodPath)
  }
}

// Build re-export map dynamically from typeSpec data
const reexportMap = buildReexportMap(typeSpecModules)

// Load YAML and get all documented $ref values (normalized)
const yamlPath = join(SPEC_DIR, 'supabase_js_v2.yml')
const spec = yaml.load(readFileSync(yamlPath, 'utf8')) as YamlSpec

const documentedRefs = new Set<string>()
for (const fn of spec.functions) {
  if (fn.$ref) {
    // Store both raw and normalized versions
    documentedRefs.add(fn.$ref)
    documentedRefs.add(normalizeRefPath(fn.$ref))
  }
}

// Find undocumented methods and deduplicate
const seenCanonical = new Set<string>()
const undocumented: string[] = []

for (const method of allMethods) {
  // Get canonical path first (prefer original packages over supabase-js re-exports)
  const canonical = getCanonicalPath(method, reexportMap)

  // Skip if already processed this canonical path
  if (seenCanonical.has(canonical)) {
    continue
  }
  seenCanonical.add(canonical)

  // Check if documented - check both raw path AND canonical path
  if (
    documentedRefs.has(method) ||
    documentedRefs.has(normalizeRefPath(method)) ||
    documentedRefs.has(canonical) ||
    documentedRefs.has(normalizeRefPath(canonical))
  ) {
    continue
  }

  // Use canonical path for output
  undocumented.push(canonical)
}

// Categorize
const publicMethods: string[] = []
const constructors: string[] = []
const errorConstructors: string[] = []
const internalMethods: string[] = []

for (const method of undocumented) {
  switch (categorizeMethod(method)) {
    case 'public':
      publicMethods.push(method)
      break
    case 'constructor':
      constructors.push(method)
      break
    case 'error':
      errorConstructors.push(method)
      break
    case 'internal':
      internalMethods.push(method)
      break
  }
}

// Group public methods by package
const publicByPackage = new Map<string, string[]>()
for (const method of publicMethods) {
  const pkg = method.split('.')[0]
  if (!publicByPackage.has(pkg)) {
    publicByPackage.set(pkg, [])
  }
  publicByPackage.get(pkg)!.push(method)
}

// Output public methods (the interesting ones)
console.log('╔═══════════════════════════════════════════════════════════════╗')
console.log('║              UNDOCUMENTED PUBLIC METHODS                      ║')
console.log('╚═══════════════════════════════════════════════════════════════╝')

for (const [pkg, methods] of publicByPackage) {
  console.log(`\n=== ${pkg} ===`)
  methods.sort().forEach((m) => {
    const shortName = m.replace(pkg + '.', '')
    console.log(`  - ${shortName}`)
  })
}

// Summary sections for other categories
console.log('\n╔═══════════════════════════════════════════════════════════════╗')
console.log('║                    SKIPPED CATEGORIES                         ║')
console.log('╚═══════════════════════════════════════════════════════════════╝')

console.log(`\n[Constructors] (${constructors.length} items)`)
constructors
  .sort()
  .slice(0, 5)
  .forEach((m) => console.log(`  - ${m}`))
if (constructors.length > 5) console.log(`  ... and ${constructors.length - 5} more`)

console.log(`\n[Error Constructors] (${errorConstructors.length} items)`)
errorConstructors
  .sort()
  .slice(0, 5)
  .forEach((m) => console.log(`  - ${m}`))
if (errorConstructors.length > 5) console.log(`  ... and ${errorConstructors.length - 5} more`)

console.log(`\n[Internal/Private Methods] (${internalMethods.length} items)`)
internalMethods
  .sort()
  .slice(0, 5)
  .forEach((m) => console.log(`  - ${m}`))
if (internalMethods.length > 5) console.log(`  ... and ${internalMethods.length - 5} more`)

// Final summary
const totalUndocumented = undocumented.length
const documentedCount = allMethods.length - totalUndocumented
const percentage = ((documentedCount / allMethods.length) * 100).toFixed(1)

console.log('\n╔═══════════════════════════════════════════════════════════════╗')
console.log('║                         SUMMARY                               ║')
console.log('╚═══════════════════════════════════════════════════════════════╝')
console.log(`  Total methods in TypeSpec:    ${allMethods.length}`)
console.log(`  Documented in YAML:           ${documentedCount}`)
console.log(`  Undocumented (deduplicated):  ${totalUndocumented}`)
console.log(`    - Public methods:           ${publicMethods.length} ← focus here`)
console.log(`    - Constructors:             ${constructors.length}`)
console.log(`    - Error constructors:       ${errorConstructors.length}`)
console.log(`    - Internal methods:         ${internalMethods.length}`)
console.log(`  Coverage: ${percentage}%`)
