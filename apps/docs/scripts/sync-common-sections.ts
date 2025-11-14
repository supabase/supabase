import { readFile, writeFile } from 'fs/promises'
import { parse, stringify } from 'yaml'

interface YamlFunction {
  id: string
  title: string
  $ref: string
  description?: string
  notes?: string
}

interface YamlSpec {
  functions: YamlFunction[]
}

interface SectionItem {
  id: string
  title: string
  slug: string
  product?: string
  type: string
  isFunc?: boolean
  parent?: string
  items?: SectionItem[]
}

interface Section {
  title: string
  id?: string
  slug?: string
  type: string
  isFunc?: boolean
  items?: SectionItem[]
  excludes?: string[]
}

type SectionsJson = Section[]

function extractTitleFromDescription(yamlFn: YamlFunction): string {
  if (yamlFn.description && !yamlFn.description.startsWith('TODO:')) {
    // Get first line/sentence
    const firstLine = yamlFn.description.trim().split('\n')[0]
    // Remove trailing period and clean up
    return firstLine.replace(/\.$/, '').trim()
  }

  // Handle common function patterns with sensible defaults
  if (yamlFn.id === 'constructor') {
    if (yamlFn.$ref.includes('SupabaseClient')) return 'Create a Supabase client'
    if (yamlFn.$ref.includes('PostgrestClient')) return 'Create a PostgREST client'
    if (yamlFn.$ref.includes('RealtimeClient')) return 'Create a Realtime client'
    if (yamlFn.$ref.includes('StorageClient')) return 'Create a Storage client'
    if (yamlFn.$ref.includes('AuthClient')) return 'Create an Auth client'
    if (yamlFn.$ref.includes('FunctionsClient')) return 'Create a Functions client'
    return 'Create a new instance'
  }

  // Realtime-specific functions
  if (yamlFn.$ref.includes('Realtime')) {
    if (yamlFn.id === 'presencestate') return 'Get current presence state'
    if (yamlFn.id === 'track') return 'Track user presence'
    if (yamlFn.id === 'untrack') return 'Stop tracking presence'
    if (yamlFn.id === 'updatejoinpayload') return 'Update channel join payload'
    if (yamlFn.id === 'onheartbeat') return 'Handle heartbeat events'
    if (yamlFn.id === 'channel') return 'Create or access a channel'
    if (yamlFn.id === 'send') return 'Send a message'
    if (yamlFn.id === 'close') return 'Close the connection'
    if (yamlFn.id === 'createwebsocket') return 'Create a WebSocket connection'
    if (yamlFn.id === 'getwebsocketconstructor') return 'Get WebSocket constructor'
    if (yamlFn.id === 'iswebsocketsupported') return 'Check WebSocket support'
    if (yamlFn.id === 'addeventlistener') return 'Add an event listener'
    if (yamlFn.id === 'removeeventlistener') return 'Remove an event listener'
  }

  // Storage-specific functions
  if (yamlFn.$ref.includes('storage')) {
    if (yamlFn.id === 'tobase64') return 'Convert file to Base64'
  }

  // Fallback: transform title (e.g., "putVectors()" -> "Put Vectors")
  return yamlFn.title
    .replace(/\(\)$/, '') // Remove ()
    .replace(/^([a-z])/, (_, c) => c.toUpperCase()) // Capitalize first letter
    .replace(/([A-Z])/g, ' $1') // Add spaces before capitals
    .trim()
}

function inferCategory(ref: string): { category: string; subcategory?: string; product: string } {
  if (ref.includes('@supabase/storage-js')) {
    return { category: 'Storage', product: 'storage' }
  }

  if (ref.includes('GoTrueAdminMFAApi')) {
    return { category: 'Auth', subcategory: 'admin-api-mfa', product: 'auth-admin' }
  }

  if (ref.includes('GoTrueAdmin')) {
    return { category: 'Auth', subcategory: 'admin-api', product: 'auth-admin' }
  }

  if (ref.includes('GoTrueMFAApi')) {
    return { category: 'Auth', subcategory: 'auth-mfa-api', product: 'auth' }
  }

  if (ref.includes('@supabase/auth-js')) {
    return { category: 'Auth', product: 'auth' }
  }

  if (ref.includes('PostgrestFilterBuilder') || ref.includes('PostgrestTransformBuilder')) {
    // These go under "using-filters" or "using-modifiers"
    if (ref.includes('FilterBuilder')) {
      return { category: 'Database', subcategory: 'using-filters', product: 'database' }
    }
    return { category: 'Database', subcategory: 'using-modifiers', product: 'database' }
  }

  if (ref.includes('@supabase/postgrest-js')) {
    return { category: 'Database', product: 'database' }
  }

  if (ref.includes('@supabase/realtime-js')) {
    return { category: 'Realtime', product: 'realtime' }
  }

  if (ref.includes('@supabase/functions-js')) {
    return { category: 'Edge Functions', product: 'functions' }
  }

  return { category: 'Misc', product: 'misc' }
}

function generateSlug(id: string, product: string): string {
  // Follow existing patterns
  if (product === 'storage') {
    if (id.startsWith('from-')) {
      return id // Keep as-is for from-* functions
    }
    return `storage-${id}`
  }

  if (product === 'auth' || product === 'auth-admin') {
    return `auth-${id.replace(/^mfa-/, 'mfa-')}`
  }

  if (product === 'database') {
    return id // Database functions typically use bare ID
  }

  if (product === 'realtime') {
    return id
  }

  if (product === 'functions') {
    return `functions-${id}`
  }

  return id
}

function getAllFunctionIds(sections: SectionsJson): Set<string> {
  const ids = new Set<string>()

  function traverse(items: (Section | SectionItem)[]) {
    for (const item of items) {
      if ('id' in item && item.id && item.type === 'function') {
        ids.add(item.id)
      }
      if (item.items) {
        traverse(item.items)
      }
    }
  }

  traverse(sections)
  return ids
}

function findCategorySection(sections: SectionsJson, category: string): Section | undefined {
  return sections.find((s) => s.title === category && s.type === 'category')
}

function findSubcategorySection(
  categorySection: Section,
  subcategory: string
): SectionItem | undefined {
  return categorySection.items?.find((item) => item.id === subcategory)
}

function removeFunctionFromSections(sections: SectionsJson, id: string): boolean {
  let removed = false

  function traverse(items: (Section | SectionItem)[]): (Section | SectionItem)[] {
    return items.filter((item) => {
      if ('id' in item && item.id === id && item.type === 'function') {
        removed = true
        return false
      }
      if (item.items) {
        item.items = traverse(item.items) as SectionItem[]
      }
      return true
    })
  }

  sections.forEach((section) => {
    if (section.items) {
      section.items = traverse(section.items) as SectionItem[]
    }
  })

  return removed
}

async function main() {
  console.log('Reading files...')

  const yamlPath = 'spec/supabase_js_v2.yml'
  const sectionsPath = 'spec/common-client-libs-sections.json'

  const yamlContent = await readFile(yamlPath, 'utf-8')
  const sectionsContent = await readFile(sectionsPath, 'utf-8')

  const yamlSpec: YamlSpec = parse(yamlContent)
  const sections: SectionsJson = JSON.parse(sectionsContent)

  console.log(`Found ${yamlSpec.functions.length} functions in YAML`)

  // Get all current function IDs in sections
  const existingIds = getAllFunctionIds(sections)
  console.log(`Found ${existingIds.size} functions in sections JSON`)

  // Find missing functions (in YAML but not in sections)
  const missingFunctions = yamlSpec.functions.filter((fn) => !existingIds.has(fn.id))
  console.log(`\nMissing functions: ${missingFunctions.length}`)

  // Find obsolete functions (in sections but not in YAML)
  const yamlIds = new Set(yamlSpec.functions.map((fn) => fn.id))
  const obsoleteFunctions = Array.from(existingIds).filter((id) => !yamlIds.has(id))
  console.log(`Obsolete functions: ${obsoleteFunctions.length}`)

  // Remove obsolete functions
  let removedCount = 0
  for (const id of obsoleteFunctions) {
    if (removeFunctionFromSections(sections, id)) {
      console.log(`  - Removed: ${id}`)
      removedCount++
    }
  }

  // Add missing functions
  let addedCount = 0
  for (const yamlFn of missingFunctions) {
    const title = extractTitleFromDescription(yamlFn)
    const { category, subcategory, product } = inferCategory(yamlFn.$ref)
    const slug = generateSlug(yamlFn.id, product)

    const newItem: SectionItem = {
      id: yamlFn.id,
      title,
      slug,
      product,
      type: 'function',
    }

    // Add parent field if it's a subcategory item
    if (subcategory === 'using-filters') {
      newItem.parent = 'filters'
    } else if (subcategory === 'using-modifiers') {
      newItem.parent = 'modifiers'
    }

    // Find the category section
    const categorySection = findCategorySection(sections, category)
    if (!categorySection) {
      console.log(`  ! Warning: Category "${category}" not found for ${yamlFn.id}`)
      continue
    }

    // If there's a subcategory, find it
    if (subcategory) {
      const subcategorySection = findSubcategorySection(categorySection, subcategory)
      if (subcategorySection) {
        if (!subcategorySection.items) {
          subcategorySection.items = []
        }
        subcategorySection.items.push(newItem)
        console.log(`  + Added: ${yamlFn.id} to ${category} > ${subcategory}`)
        addedCount++
      } else {
        // If subcategory doesn't exist, add to main category
        if (!categorySection.items) {
          categorySection.items = []
        }
        categorySection.items.push(newItem)
        console.log(`  + Added: ${yamlFn.id} to ${category} (subcategory ${subcategory} not found)`)
        addedCount++
      }
    } else {
      // Add directly to category
      if (!categorySection.items) {
        categorySection.items = []
      }
      categorySection.items.push(newItem)
      console.log(`  + Added: ${yamlFn.id} to ${category}`)
      addedCount++
    }
  }

  // Update existing entries with TODO titles
  console.log(`\nUpdating TODO titles...`)
  let updatedCount = 0
  const yamlFunctionsMap = new Map(yamlSpec.functions.map((fn) => [fn.id, fn]))

  function updateTodoTitles(items: (Section | SectionItem)[]) {
    for (const item of items) {
      if ('id' in item && item.id && item.title?.startsWith('TODO:') && item.type === 'function') {
        const yamlFn = yamlFunctionsMap.get(item.id)
        if (yamlFn) {
          const newTitle = extractTitleFromDescription(yamlFn)
          if (newTitle !== item.title) {
            console.log(`  ~ Updated: ${item.id} -> "${newTitle}"`)
            item.title = newTitle
            updatedCount++
          }
        }
      }
      if (item.items) {
        updateTodoTitles(item.items)
      }
    }
  }

  updateTodoTitles(sections)

  // Write back
  console.log(`\nWriting updated sections JSON...`)
  await writeFile(sectionsPath, JSON.stringify(sections, null, 2) + '\n', 'utf-8')

  console.log(`\n✅ Done!`)
  console.log(`   Added: ${addedCount}`)
  console.log(`   Removed: ${removedCount}`)
  console.log(`   Updated: ${updatedCount}`)
  console.log(`   Total functions now: ${getAllFunctionIds(sections).size}`)
}

main().catch(console.error)
