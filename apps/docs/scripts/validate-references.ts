/**
 * Cross-check IDs between common-client-libs-sections.json and supabase_js_v2.yml
 *
 * Reports:
 * 1. Functions in sections but NOT in YAML
 * 2. Groups (isFunc: false) in sections but NOT in YAML
 * 3. IDs in YAML but NOT in sections
 *
 * Usage: pnpm tsx scripts/validate-references.ts
 */

import { readFileSync } from 'fs'
import yaml from 'js-yaml'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SPEC_DIR = join(__dirname, '../spec')

interface Section {
  id?: string
  type: string
  isFunc?: boolean
  items?: Section[]
}

interface YamlSpec {
  functions: Array<{ id: string }>
}

// Flatten sections, extracting all function-type entries
function flattenSections(sections: Section[]): { functions: string[]; groups: string[] } {
  const functions: string[] = []
  const groups: string[] = []

  function recurse(items: Section[]) {
    for (const item of items) {
      if (item.type === 'function' && item.id) {
        if (item.isFunc === false) {
          groups.push(item.id)
        } else {
          functions.push(item.id)
        }
      }
      if (item.items) {
        recurse(item.items)
      }
    }
  }

  recurse(sections)
  return { functions, groups }
}

// Main
const sectionsPath = join(SPEC_DIR, 'common-client-libs-sections.json')
const yamlPath = join(SPEC_DIR, 'supabase_js_v2.yml')

const sections: Section[] = JSON.parse(readFileSync(sectionsPath, 'utf8'))
const spec = yaml.load(readFileSync(yamlPath, 'utf8')) as YamlSpec

const { functions: sectionFunctions, groups: sectionGroups } = flattenSections(sections)
const yamlIds = new Set(spec.functions.map((f) => f.id))

const sectionFunctionSet = new Set(sectionFunctions)
const sectionGroupSet = new Set(sectionGroups)
const allSectionIds = new Set([...sectionFunctions, ...sectionGroups])

// Find mismatches
const functionsNotInYaml = sectionFunctions.filter((id) => !yamlIds.has(id))
const groupsNotInYaml = sectionGroups.filter((id) => !yamlIds.has(id))
const yamlNotInSections = [...yamlIds].filter((id) => !allSectionIds.has(id))

// Output
console.log('=== Functions in sections but NOT in YAML ===')
if (functionsNotInYaml.length === 0) {
  console.log('(none)')
} else {
  functionsNotInYaml.forEach((id) => console.log(`- ${id}`))
}

console.log('\n=== Groups (isFunc: false) in sections but NOT in YAML ===')
if (groupsNotInYaml.length === 0) {
  console.log('(none)')
} else {
  groupsNotInYaml.forEach((id) => console.log(`- ${id}`))
}

console.log('\n=== IDs in YAML but NOT in sections ===')
if (yamlNotInSections.length === 0) {
  console.log('(none)')
} else {
  yamlNotInSections.forEach((id) => console.log(`- ${id}`))
}

console.log(
  `\nSummary: ${functionsNotInYaml.length} functions missing, ${groupsNotInYaml.length} groups missing, ${yamlNotInSections.length} orphaned`
)

// Exit with error code if any mismatches
if (functionsNotInYaml.length > 0 || groupsNotInYaml.length > 0 || yamlNotInSections.length > 0) {
  process.exit(1)
}
