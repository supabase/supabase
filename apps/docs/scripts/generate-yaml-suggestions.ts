#!/usr/bin/env tsx

import { readFile } from 'node:fs/promises'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

interface StubEntry {
  id: string
  title: string
  $ref: string
  description: string
  examples?: Array<{ id: string; name: string; code: string }>
}

interface ValidationReport {
  timestamp: string
  summary: {
    total_issues: number
    broken_references: number
    missing_documentation: number
    private_apis_exposed: number
  }
  issues: Array<{
    type: string
    severity: string
    ref?: string
    path?: string
    message: string
    location?: string
  }>
}

interface YamlSpec {
  functions?: Array<{ id: string; $ref?: string }>
}

/**
 * Find the line number where new functions should be inserted
 */
async function findInsertionPoint(yamlPath: string): Promise<number> {
  const content = await readFile(yamlPath, 'utf-8')
  const lines = content.split('\n')

  // Find the last function entry
  let lastFunctionLine = -1
  let inFunctions = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.match(/^functions:/)) {
      inFunctions = true
      continue
    }

    if (inFunctions && line.match(/^  - id:/)) {
      lastFunctionLine = i
    }

    // If we hit a new top-level key, we're done
    if (inFunctions && line.match(/^[a-z]/)) {
      break
    }
  }

  // Find the end of the last function block (look for next "- id:" or end of functions)
  if (lastFunctionLine !== -1) {
    for (let i = lastFunctionLine + 1; i < lines.length; i++) {
      const line = lines[i]
      // If we hit another function or end of functions section
      if (line.match(/^  - id:/) || line.match(/^[a-z]/)) {
        return i
      }
    }
  }

  return lines.length
}

/**
 * Format a stub entry as a YAML string for GitHub suggestions
 */
function formatStubAsYaml(stub: StubEntry): string {
  const lines: string[] = []

  // Function entry (list item)
  lines.push(`  - id: ${stub.id}`)
  lines.push(`    title: ${stub.title}`)
  lines.push(`    $ref: '${stub.$ref}'`)

  // Description (multiline if needed)
  if (stub.description.includes('\n')) {
    lines.push(`    description: |`)
    stub.description.split('\n').forEach((line) => {
      lines.push(`      ${line}`)
    })
  } else {
    lines.push(`    description: ${stub.description}`)
  }

  // Examples (if any)
  if (stub.examples && stub.examples.length > 0) {
    lines.push(`    examples:`)
    for (const example of stub.examples) {
      lines.push(`      - id: ${example.id}`)
      lines.push(`        name: ${example.name}`)
      lines.push(`        code: |`)
      example.code.split('\n').forEach((line) => {
        lines.push(`          ${line}`)
      })
    }
  }

  return lines.join('\n')
}

/**
 * Group stubs by parent class
 */
function groupStubsByClass(stubs: StubEntry[]): Map<string, StubEntry[]> {
  const groups = new Map<string, StubEntry[]>()

  for (const stub of stubs) {
    const parts = stub.$ref.split('.')
    // Get class name (second-to-last part, or "other")
    const className = parts.length >= 2 ? parts[parts.length - 2] : 'other'

    if (!groups.has(className)) {
      groups.set(className, [])
    }
    groups.get(className)!.push(stub)
  }

  return groups
}

/**
 * Generate GitHub PR comment markdown
 */
async function generatePRComment(
  reportPath: string,
  stubsPath: string,
  yamlPath: string
): Promise<string> {
  // Load files
  const report: ValidationReport = JSON.parse(await readFile(reportPath, 'utf-8'))
  const stubs: StubEntry[] = JSON.parse(await readFile(stubsPath, 'utf-8'))

  const insertionLine = await findInsertionPoint(yamlPath)

  // Group stubs by class for better organization
  const groupedStubs = groupStubsByClass(stubs)

  // Build comment sections
  const sections: string[] = []

  // Header
  sections.push('## 📊 Reference Documentation Sync Report\n')

  // Summary
  sections.push('### Summary\n')
  if (report.summary.broken_references > 0) {
    sections.push(`- ❌ **${report.summary.broken_references} broken references** (APIs removed)`)
  }
  if (report.summary.missing_documentation > 0) {
    const errors = report.issues.filter(
      (i) => i.type === 'missing-documentation' && i.severity === 'error'
    ).length
    sections.push(`- 📝 **${errors} new undocumented APIs** (auto-detected)`)
  }

  // Count stubs with descriptions/examples
  const withDescriptions = stubs.filter((s) => !s.description.startsWith('TODO')).length
  const withExamples = stubs.filter((s) => s.examples && s.examples.length > 0).length
  if (stubs.length > 0) {
    sections.push(`- ✅ ${withDescriptions}/${stubs.length} stubs have TypeDoc descriptions`)
    sections.push(`- 💡 ${withExamples}/${stubs.length} stubs have examples`)
  }

  sections.push('\n---\n')

  // Broken references section
  const brokenRefs = report.issues.filter((i) => i.type === 'broken-reference')
  if (brokenRefs.length > 0) {
    sections.push('### 🔴 Broken References (Action Required)\n')
    sections.push('These APIs no longer exist in the code:\n')
    sections.push('<details>')
    sections.push(`<summary>View broken references (${brokenRefs.length})</summary>\n`)
    sections.push('')

    for (const issue of brokenRefs) {
      const location = issue.location ? ` (${issue.location})` : ''
      sections.push(`- \`${issue.ref}\`${location}`)
    }

    sections.push('')
    sections.push('**Action:** Remove these entries from `spec/supabase_js_v2.yml`')
    sections.push('</details>\n')
    sections.push('---\n')
  }

  // New APIs section
  if (stubs.length > 0) {
    sections.push('### ✨ New APIs to Document\n')
    sections.push('Click **"Commit suggestion"** on each block below to add documentation stubs.\n')
    sections.push(`#### File: \`apps/docs/spec/supabase_js_v2.yml\`\n`)

    // Generate suggestions grouped by class
    for (const [className, classStubs] of groupedStubs.entries()) {
      sections.push(`#### ${className}\n`)

      // Create one suggestion block per stub
      for (const stub of classStubs) {
        const yamlContent = formatStubAsYaml(stub)

        sections.push('```suggestion')
        sections.push(yamlContent)
        sections.push('```\n')
      }
    }

    sections.push('---\n')
  }

  // Full report (collapsed)
  sections.push('### 📋 Full Report')
  sections.push('<details>')
  sections.push('<summary>View detailed validation report</summary>\n')
  sections.push('```json')
  sections.push(JSON.stringify(report, null, 2).slice(0, 5000)) // Truncate if too long
  if (JSON.stringify(report, null, 2).length > 5000) {
    sections.push('... (truncated)')
  }
  sections.push('```')
  sections.push('</details>\n')

  // Footer
  sections.push('---\n')
  sections.push('🤖 This validation ran automatically via `validate-reference-sync.ts`')

  return sections.join('\n')
}

/**
 * Main entry point
 */
async function main() {
  try {
    const reportPath = 'sync-report.json'
    const stubsPath = 'sync-report-stubs.yaml'
    const yamlPath = 'spec/supabase_js_v2.yml'

    console.log('📝 Generating GitHub PR comment...\n')

    const comment = await generatePRComment(reportPath, stubsPath, yamlPath)

    // Output to stdout for GitHub Actions to capture
    console.log('<!-- validation-comment -->')
    console.log(comment)
    console.log('<!-- /validation-comment -->')

    console.error('\n✅ Comment generated successfully')
  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

main()
