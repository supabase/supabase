#!/usr/bin/env node
/**
 * Validates conversion-manifest.yaml against listings registry and MDX usage.
 * Run from repo root:
 *   node .cursor/skills/audit-content-listings/scripts/validate-conversion-manifest.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../../../..')

const MANIFEST_PATH = path.join(
  REPO_ROOT,
  'apps/docs/components/listings/conversion-manifest.yaml'
)
const REGISTRY_PATH = path.join(
  REPO_ROOT,
  'apps/docs/components/listings/listings-markdown-registry.ts'
)
const MDX_ROOT = path.join(REPO_ROOT, 'apps/docs/content/guides')

function parseSimpleYaml(content) {
  const pages = []
  let currentPage = null
  let currentSection = null

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    if (trimmed.startsWith('- mdx:')) {
      currentPage = { mdx: trimmed.replace('- mdx:', '').trim(), sections: [] }
      pages.push(currentPage)
      currentSection = null
      continue
    }

    if (!currentPage) continue

    const pageField = trimmed.match(/^(\w+):\s*(.*)$/)
    if (pageField && !line.startsWith('      ')) {
      const [, key, value] = pageField
      if (key === 'sections') continue
      if (value === 'null') {
        currentPage[key] = null
      } else if (value === 'true' || value === 'false') {
        currentPage[key] = value === 'true'
      } else {
        currentPage[key] = value.replace(/^['"]|['"]$/g, '')
      }
      continue
    }

    if (trimmed.startsWith('- id:')) {
      currentSection = { id: trimmed.replace('- id:', '').trim() }
      currentPage.sections.push(currentSection)
      continue
    }

    if (currentSection && line.startsWith('      ')) {
      const sectionField = trimmed.match(/^(\w+):\s*(.*)$/)
      if (sectionField) {
        const [, key, value] = sectionField
        currentSection[key] = value.replace(/^['"]|['"]$/g, '')
      }
    }
  }

  return pages
}

function loadRegistryComponentNames() {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf8')
  const names = []
  for (const match of content.matchAll(/^\s+(\w+Listings):/gm)) {
    names.push(match[1])
  }
  return new Set(names)
}

function mdxContainsComponent(mdxPath, componentName) {
  const fullPath = path.join(REPO_ROOT, 'apps/docs/content/guides', mdxPath.replace(/^content\/guides\//, ''))
  if (!fs.existsSync(fullPath)) {
    return { exists: false, hasComponent: false }
  }
  const content = fs.readFileSync(fullPath, 'utf8')
  return {
    exists: true,
    hasComponent: content.includes(`<${componentName} />`),
  }
}

function main() {
  const errors = []
  const warnings = []

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`Missing manifest: ${MANIFEST_PATH}`)
    process.exit(1)
  }

  const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf8')
  const pages = parseSimpleYaml(manifestContent)
  const registryNames = loadRegistryComponentNames()

  for (const page of pages) {
    if (!page.mdx) continue

    for (const section of page.sections ?? []) {
      const { status, component, export: exportName } = section

      if (status === 'converted') {
        if (!component) {
          errors.push(`${page.mdx} § ${section.id}: converted but missing component`)
          continue
        }
        if (!registryNames.has(component)) {
          errors.push(`${page.mdx} § ${section.id}: ${component} not in listings-markdown-registry.ts`)
        }
        const { exists, hasComponent } = mdxContainsComponent(page.mdx, component)
        if (!exists) {
          errors.push(`${page.mdx}: MDX file not found`)
        } else if (!hasComponent) {
          errors.push(`${page.mdx} § ${section.id}: missing <${component} /> in MDX`)
        }
        if (exportName && page.data) {
          const dataPath = path.join(REPO_ROOT, 'apps/docs/components/listings', page.data)
          if (fs.existsSync(dataPath)) {
            const dataContent = fs.readFileSync(dataPath, 'utf8')
            if (!dataContent.includes(`export const ${exportName}`)) {
              errors.push(`${page.data}: missing export ${exportName}`)
            }
          }
        }
      }

      if (status === 'unconverted' || status === 'deferred') {
        if (component && registryNames.has(component)) {
          warnings.push(
            `${page.mdx} § ${section.id}: status ${status} but ${component} already in registry`
          )
        }
      }
    }
  }

  if (warnings.length) {
    console.warn('Warnings:')
    for (const w of warnings) console.warn(`  - ${w}`)
  }

  if (errors.length) {
    console.error('Manifest validation failed:')
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }

  console.log(`OK — validated ${pages.length} pages in conversion-manifest.yaml`)
}

main()
