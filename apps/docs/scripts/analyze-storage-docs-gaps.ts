import * as fs from 'fs'
import * as path from 'path'
import { parse as parseYaml } from 'yaml'

// TypeDoc types
interface TypeDocRoot {
  children?: TypeDocModule[]
}

interface TypeDocModule {
  name: string
  children?: TypeDocChild[]
}

interface TypeDocChild {
  name: string
  kind: number
  children?: TypeDocMethod[]
}

interface TypeDocMethod {
  name: string
  kind: number
  signatures?: any[]
}

// YAML types
interface YamlSpec {
  functions: YamlFunction[]
}

interface YamlFunction {
  id: string
  title?: string
  $ref?: string
  notes?: string
}

// Common sections types
interface Section {
  id: string
  title?: string
  type?: string
  isFunc?: boolean
  items?: Section[]
  slug?: string
  product?: string
}

// Report types
interface ExtractedFunction {
  name: string
  className: string
  $ref: string
}

interface Report {
  missingInYaml: ExtractedFunction[]
  staleInYaml: Array<{ id: string; $ref: string; title?: string }>
  missingInCommonSections: Array<{ id: string; $ref: string; title?: string }>
  inCommonSectionsButNotYaml: Array<{ id: string; title: string; slug?: string }>
}

const KIND_MODULE = 2
const KIND_CLASS = 128
const KIND_INTERFACE = 256
const KIND_METHOD = 2048

// Exclusion lists for filtering non-documentable items

// Internal helper classes that are not user-facing
const INTERNAL_CLASSES = [
  'BlobDownloadBuilder', // Internal download helper
  'StreamDownloadBuilder', // Internal streaming helper
]

// Error/utility classes that are not primary API
const UTILITY_CLASSES = [
  'StorageApiError',
  'StorageVectorsApiError',
  'StorageError',
  'StorageUnknownError',
  'StorageVectorsError',
  'StorageVectorsUnknownError',
]

// Internal/framework methods that are not documented
const INTERNAL_METHODS = [
  'toJSON', // Serialization
  'then', // Promise interface
  'catch', // Promise interface
  'finally', // Promise interface
  'throwOnError', // Internal error handling flag
  'constructor', // Constructor methods
]

// Helper function to check if a module/class should be excluded
function isInternalModule(modulePath: string): boolean {
  return INTERNAL_CLASSES.some((internal) => modulePath.includes(internal))
}

function isUtilityClass(className: string): boolean {
  return UTILITY_CLASSES.includes(className)
}

function isInternalMethod(methodName: string): boolean {
  return INTERNAL_METHODS.includes(methodName)
}

// Helper function to extract storage-js functions from TypeDoc
function extractStorageFunctions(typeDocRoot: TypeDocRoot): ExtractedFunction[] {
  const functions: ExtractedFunction[] = []

  for (const module of typeDocRoot.children ?? []) {
    // Only process @supabase/storage-js
    if (!module.name.includes('@supabase/storage-js')) {
      continue
    }

    const packageName = module.name

    // Process children - might be classes directly or nested modules
    for (const child of module.children ?? []) {
      // If it's a nested module (like packages/StorageBucketApi), process its children
      if (child.kind === KIND_MODULE && child.children) {
        const modulePath = child.name

        // Skip internal modules
        if (isInternalModule(modulePath)) {
          continue
        }

        for (const nestedChild of child.children) {
          if (nestedChild.kind === KIND_CLASS || nestedChild.kind === KIND_INTERFACE) {
            const className = nestedChild.name

            // Skip utility classes
            if (isUtilityClass(className)) {
              continue
            }

            for (const method of nestedChild.children ?? []) {
              if (method.kind === KIND_METHOD) {
                // Skip internal methods
                if (isInternalMethod(method.name)) {
                  continue
                }

                functions.push({
                  name: method.name,
                  className: `${modulePath}.${className}`,
                  $ref: `${packageName}.${modulePath}.${className}.${method.name}`,
                })
              }
            }
          }
        }
      }
      // If it's a class/interface directly at the module level (index module)
      else if (child.kind === KIND_CLASS || child.kind === KIND_INTERFACE) {
        const className = child.name

        // Skip utility classes
        if (isUtilityClass(className)) {
          continue
        }

        for (const method of child.children ?? []) {
          if (method.kind === KIND_METHOD) {
            // Skip internal methods
            if (isInternalMethod(method.name)) {
              continue
            }

            functions.push({
              name: method.name,
              className: className,
              $ref: `${packageName}.index.${className}.${method.name}`,
            })
          }
        }
      }
    }
  }

  return functions
}

// Helper function to normalize $ref paths for comparison
// Handles cases where YAML might be missing the "index." prefix
function normalize$ref(ref: string): string {
  // If it's already in the format @supabase/storage-js.index.*, return as-is
  if (ref.includes('.index.')) {
    return ref
  }

  // If it's in the format @supabase/storage-js.ClassName.method (missing index.)
  // Add the index. prefix
  const match = ref.match(/^(@supabase\/storage-js)\.([A-Z][a-zA-Z]+)\.(.+)$/)
  if (match) {
    return `${match[1]}.index.${match[2]}.${match[3]}`
  }

  // Otherwise return as-is (probably packages/* path)
  return ref
}

// Helper function to deduplicate functions
// When same method appears in multiple places (e.g., inherited), keep all versions
// since YAML may reference different paths
function deduplicateFunctions(functions: ExtractedFunction[]): ExtractedFunction[] {
  // Don't actually deduplicate - the YAML references specific paths
  // If YAML says packages/StorageBucketApi.default.listBuckets, we need to keep that
  // If YAML says index.StorageClient.listBuckets, we need to keep that too

  // Only remove exact duplicates (same $ref)
  const byRef = new Map<string, ExtractedFunction>()

  for (const fn of functions) {
    if (!byRef.has(fn.$ref)) {
      byRef.set(fn.$ref, fn)
    }
  }

  return Array.from(byRef.values())
}

// Helper function to recursively find all function IDs in common-sections
function extractFunctionIds(sections: Section[], productFilter?: string): Set<string> {
  const ids = new Set<string>()

  function traverse(section: Section) {
    if (section.type === 'function') {
      // Include if no product filter, or if product matches storage
      if (!productFilter || section.product === productFilter) {
        ids.add(section.id)
      }
    }

    if (section.items) {
      section.items.forEach(traverse)
    }
  }

  sections.forEach(traverse)
  return ids
}

// Helper function to recursively find all storage sections with details
function extractStorageSections(sections: Section[]): Array<{ id: string; title: string; slug?: string }> {
  const storageSections: Array<{ id: string; title: string; slug?: string }> = []

  function traverse(section: Section) {
    if (section.type === 'function' && section.product === 'storage') {
      storageSections.push({
        id: section.id,
        title: section.title || section.id,
        slug: section.slug,
      })
    }

    if (section.items) {
      section.items.forEach(traverse)
    }
  }

  sections.forEach(traverse)
  return storageSections
}

async function analyzeStorageDocsGaps(): Promise<Report> {
  const docsRoot = process.cwd()
  const specRoot = path.join(docsRoot, 'spec')

  // 1. Read combined.json
  console.log('📖 Reading TypeDoc combined.json...')
  const combinedJsonPath = path.join(specRoot, 'enrichments/tsdoc_v2/combined.json')
  const combinedJson: TypeDocRoot = JSON.parse(fs.readFileSync(combinedJsonPath, 'utf-8'))

  // 2. Extract storage-js functions from TypeDoc
  console.log('🔍 Extracting storage-js functions from TypeDoc...')
  const allTypeDocFunctions = extractStorageFunctions(combinedJson)
  console.log(`   Extracted ${allTypeDocFunctions.length} functions (before deduplication)`)

  // 2a. Deduplicate functions (only remove exact duplicate $refs)
  const typeDocFunctions = deduplicateFunctions(allTypeDocFunctions)
  console.log(`   Found ${typeDocFunctions.length} unique storage-js functions in TypeDoc`)

  // 3. Read YAML spec
  console.log('📖 Reading supabase_js_v2.yml...')
  const yamlPath = path.join(specRoot, 'supabase_js_v2.yml')
  const yamlContent = fs.readFileSync(yamlPath, 'utf-8')
  const yamlSpec: YamlSpec = parseYaml(yamlContent) as YamlSpec

  // 4. Filter YAML functions that reference storage-js
  const yamlStorageFunctions = yamlSpec.functions.filter(
    (fn) => fn.$ref && fn.$ref.includes('@supabase/storage-js')
  )
  console.log(`   Found ${yamlStorageFunctions.length} storage-js functions in YAML`)

  // 5. Read common-sections
  console.log('📖 Reading common-client-libs-sections.json...')
  const commonSectionsPath = path.join(specRoot, 'common-client-libs-sections.json')
  const commonSections: Section[] = JSON.parse(fs.readFileSync(commonSectionsPath, 'utf-8'))

  // 6. Extract storage-related section IDs
  const storageSectionIds = extractFunctionIds(commonSections, 'storage')
  console.log(`   Found ${storageSectionIds.size} storage functions in common-sections`)

  // Get detailed storage sections for better reporting
  const storageSections = extractStorageSections(commonSections)

  // 7. Build comparison maps with normalized refs
  const typeDocByRef = new Map(
    typeDocFunctions.map((fn) => [normalize$ref(fn.$ref), fn])
  )
  const yamlByRef = new Map(
    yamlStorageFunctions.map((fn) => [normalize$ref(fn.$ref!), fn])
  )
  const yamlById = new Map(yamlStorageFunctions.map((fn) => [fn.id, fn]))

  // 8. Analyze gaps
  const report: Report = {
    missingInYaml: [],
    staleInYaml: [],
    missingInCommonSections: [],
    inCommonSectionsButNotYaml: [],
  }

  // Find functions in TypeDoc but missing in YAML
  for (const fn of typeDocFunctions) {
    const normalizedRef = normalize$ref(fn.$ref)
    if (!yamlByRef.has(normalizedRef)) {
      report.missingInYaml.push(fn)
    }
  }

  // Find functions in YAML but no longer in TypeDoc (stale)
  for (const fn of yamlStorageFunctions) {
    if (fn.$ref) {
      const normalizedRef = normalize$ref(fn.$ref)
      if (!typeDocByRef.has(normalizedRef)) {
        report.staleInYaml.push({
          id: fn.id,
          $ref: fn.$ref,
          title: fn.title,
        })
      }
    }
  }

  // Find functions in YAML but missing in common-sections
  for (const fn of yamlStorageFunctions) {
    if (!storageSectionIds.has(fn.id)) {
      report.missingInCommonSections.push({
        id: fn.id,
        $ref: fn.$ref!,
        title: fn.title,
      })
    }
  }

  // Find functions in common-sections but missing in YAML
  for (const section of storageSections) {
    if (!yamlById.has(section.id)) {
      report.inCommonSectionsButNotYaml.push(section)
    }
  }

  return report
}

function printReport(report: Report) {
  console.log('\n' + '='.repeat(80))
  console.log('📊 STORAGE-JS DOCUMENTATION GAP ANALYSIS')
  console.log('='.repeat(80) + '\n')

  // Missing in YAML
  if (report.missingInYaml.length > 0) {
    console.log('❌ MISSING IN YAML (exist in TypeDoc, not in supabase_js_v2.yml):')
    console.log(`   ${report.missingInYaml.length} functions need to be added\n`)
    report.missingInYaml.forEach((fn) => {
      console.log(`   - ${fn.className}.${fn.name}`)
      console.log(`     $ref: ${fn.$ref}`)
      console.log(`     Suggested id: ${generateId(fn.name)}\n`)
    })
  } else {
    console.log('✅ ALL TypeDoc functions are documented in YAML\n')
  }

  // Stale in YAML
  if (report.staleInYaml.length > 0) {
    console.log('⚠️  STALE IN YAML (in YAML, but no longer in TypeDoc):')
    console.log(`   ${report.staleInYaml.length} functions should be removed\n`)
    report.staleInYaml.forEach((fn) => {
      console.log(`   - id: ${fn.id}`)
      console.log(`     title: ${fn.title}`)
      console.log(`     $ref: ${fn.$ref}\n`)
    })
  } else {
    console.log('✅ NO stale entries in YAML\n')
  }

  // Missing in common-sections
  if (report.missingInCommonSections.length > 0) {
    console.log("❌ MISSING IN COMMON-SECTIONS (in YAML, not in common-sections - won't show in docs):")
    console.log(`   ${report.missingInCommonSections.length} functions won't appear in navigation\n`)
    report.missingInCommonSections.forEach((fn) => {
      console.log(`   - id: ${fn.id}`)
      console.log(`     title: ${fn.title}`)
      console.log(`     $ref: ${fn.$ref}\n`)
    })
  } else {
    console.log('✅ ALL YAML functions have corresponding common-sections entries\n')
  }

  // In common-sections but not in YAML
  if (report.inCommonSectionsButNotYaml.length > 0) {
    console.log("⚠️  IN COMMON-SECTIONS BUT NOT YAML (won't display - filtered out by build):")
    console.log(`   ${report.inCommonSectionsButNotYaml.length} sections have no content\n`)
    report.inCommonSectionsButNotYaml.forEach((section) => {
      console.log(`   - id: ${section.id}`)
      console.log(`     title: ${section.title}`)
      console.log(`     slug: ${section.slug}\n`)
    })
  } else {
    console.log('✅ ALL common-sections entries have corresponding YAML functions\n')
  }

  // Summary
  console.log('='.repeat(80))
  console.log('📈 SUMMARY:')
  console.log(`   Missing in YAML: ${report.missingInYaml.length}`)
  console.log(`   Stale in YAML: ${report.staleInYaml.length}`)
  console.log(`   Missing in common-sections: ${report.missingInCommonSections.length}`)
  console.log(`   In common-sections but not YAML: ${report.inCommonSectionsButNotYaml.length}`)
  console.log('='.repeat(80) + '\n')
}

// Helper to generate ID from method name (camelCase -> kebab-case)
function generateId(methodName: string): string {
  return methodName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

// Main execution
async function main() {
  try {
    const report = await analyzeStorageDocsGaps()
    printReport(report)
  } catch (error) {
    console.error('❌ Error analyzing storage docs:', error)
    process.exit(1)
  }
}

main()
