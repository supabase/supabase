#!/usr/bin/env tsx

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'yaml'

// Types for TypeDoc JSON structure
interface TypeDocNode {
  id: number
  name: string
  kind: number
  flags?: {
    isProtected?: boolean
    isPrivate?: boolean
    isOptional?: boolean
    isInherited?: boolean
  }
  children?: TypeDocNode[]
  signatures?: TypeDocNode[]
  sources?: Array<{ fileName: string; line: number }>
  comment?: {
    summary?: Array<{ kind: string; text: string }>
    blockTags?: Array<{ tag: string; content: Array<{ kind: string; text: string }> }>
  }
}

interface CombinedSpec {
  name: string
  children: TypeDocNode[]
}

interface YamlFunction {
  id: string
  title?: string
  $ref?: string
  description?: string
}

interface YamlSpec {
  info: {
    definition: string
    [key: string]: any
  }
  functions?: YamlFunction[]
}

interface ValidationIssue {
  type: 'broken-reference' | 'missing-documentation' | 'private-api-exposed'
  severity: 'error' | 'warning'
  ref?: string
  path?: string
  message: string
  location?: string
}

interface ValidationReport {
  timestamp: string
  summary: {
    total_issues: number
    broken_references: number
    missing_documentation: number
    private_apis_exposed: number
  }
  issues: ValidationIssue[]
}

// CLI options
interface Options {
  fix: boolean
  reportPath: string
  strict: boolean
}

// TypeDoc kind constants
const TypeDocKind = {
  Enum: 8,
  EnumMember: 16,
  Class: 128,
  Interface: 256,
  Constructor: 512,
  Property: 1024,
  Method: 2048,
  Function: 64,
  TypeAlias: 4194304,
} as const

/**
 * Extract description from TypeDoc comment (checks signatures too)
 */
function extractDescription(node: TypeDocNode): string | null {
  // Try to get comment from the node itself
  let comment = node.comment

  // If not found, try the first signature (methods/constructors have comments on signatures)
  if (!comment && node.signatures && node.signatures.length > 0) {
    comment = node.signatures[0].comment
  }

  if (!comment?.summary) {
    return null
  }

  const description = comment.summary
    .filter((part) => part.kind === 'text')
    .map((part) => part.text)
    .join('')
    .trim()

  return description || null
}

/**
 * Extract examples from TypeDoc @example tags (checks signatures too)
 */
function extractExamples(node: TypeDocNode): string[] {
  // Try to get comment from the node itself
  let comment = node.comment

  // If not found, try the first signature
  if (!comment && node.signatures && node.signatures.length > 0) {
    comment = node.signatures[0].comment
  }

  if (!comment?.blockTags) {
    return []
  }

  return comment.blockTags
    .filter((tag) => tag.tag === '@example')
    .map((tag) =>
      tag.content
        .map((part) => part.text)
        .join('')
        .trim()
    )
    .filter(Boolean)
}

/**
 * Check if an API is public (not private/internal)
 */
function isPublicApi(node: TypeDocNode): boolean {
  // Skip items with leading underscores (internal convention)
  if (node.name.startsWith('_')) {
    return false
  }

  // Skip protected/private members
  if (node.flags?.isProtected || node.flags?.isPrivate) {
    return false
  }

  // Check for @internal tag in comments
  if (node.comment?.blockTags?.some((tag) => tag.tag === '@internal')) {
    return false
  }

  return true
}

/**
 * Check if a class name indicates it's a user-facing API
 */
function isUserFacingClass(className: string): boolean {
  // Skip error classes
  if (className.endsWith('Error')) {
    return false
  }

  // Check for user-facing patterns
  const userFacingPatterns = [/Client$/, /Api$/, /Builder$/, /Channel$/, /Scope$/, /Manager$/]

  return userFacingPatterns.some((pattern) => pattern.test(className))
}

/**
 * Check if a class is exported from top-level or index
 */
function isTopLevelExport(path: string): boolean {
  const parts = path.split('.')
  // Pattern: @library.ClassName or @library.index.ClassName
  return parts.length === 2 || (parts.length === 3 && parts[1] === 'index')
}

/**
 * Build a map of reference paths to nodes from combined.json
 */
function buildReferenceMap(
  spec: CombinedSpec,
  publicOnly: boolean = true
): Map<string, TypeDocNode> {
  const map = new Map<string, TypeDocNode>()

  function traverse(node: TypeDocNode, path: string[] = []) {
    const currentPath = [...path, node.name].join('.')

    // Only add if public (or if we're not filtering)
    if (!publicOnly || isPublicApi(node)) {
      map.set(currentPath, node)
    }

    // Recurse into children
    if (node.children) {
      for (const child of node.children) {
        traverse(child, [...path, node.name])
      }
    }
  }

  // Start traversal from each library in the combined spec
  for (const library of spec.children) {
    traverse(library, [])
  }

  return map
}

/**
 * Extract all $ref values from YAML functions
 */
function extractYamlRefs(yamlSpec: YamlSpec): Map<string, YamlFunction> {
  const refs = new Map<string, YamlFunction>()

  if (!yamlSpec.functions) {
    return refs
  }

  for (const fn of yamlSpec.functions) {
    if (fn.$ref) {
      refs.set(fn.$ref, fn)
    }
  }

  return refs
}

/**
 * Validate YML → JSON (check for broken references)
 */
function validateBrokenReferences(
  yamlRefs: Map<string, YamlFunction>,
  jsonMap: Map<string, TypeDocNode>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const [ref, fn] of yamlRefs.entries()) {
    if (!jsonMap.has(ref)) {
      issues.push({
        type: 'broken-reference',
        severity: 'error',
        ref,
        message: `Reference '${ref}' in YAML (id: '${fn.id}') does not exist in combined.json. This API may have been removed.`,
        location: `functions[id="${fn.id}"]`,
      })
    }
  }

  return issues
}

/**
 * Find all classes with public methods and their paths
 */
function findDocumentableClasses(
  spec: CombinedSpec,
  yamlRefs: Map<string, YamlFunction>
): Map<string, { className: string; hasDocumentation: boolean; isUserFacing: boolean }> {
  const classes = new Map<
    string,
    { className: string; hasDocumentation: boolean; isUserFacing: boolean }
  >()

  function traverse(node: TypeDocNode, path: string[] = []) {
    const currentPath = [...path, node.name].join('.')

    // Check if this is a class or interface with public methods
    if ((node.kind === TypeDocKind.Class || node.kind === TypeDocKind.Interface) && isPublicApi(node)) {
      // Skip Error classes - we don't document them
      if (node.name.endsWith('Error')) {
        return
      }

      const hasPublicMethods =
        node.children?.some(
          (child) =>
            (child.kind === TypeDocKind.Method || child.kind === TypeDocKind.Constructor) &&
            isPublicApi(child)
        ) || false

      if (hasPublicMethods) {
        // Check if this class has any documented methods
        const hasDocumentation =
          node.children?.some((child) => {
            const methodPath = [...path, node.name, child.name].join('.')
            return yamlRefs.has(methodPath)
          }) || false

        const isUserFacing =
          isUserFacingClass(node.name) || isTopLevelExport(currentPath) || hasDocumentation

        classes.set(currentPath, {
          className: node.name,
          hasDocumentation,
          isUserFacing,
        })
      }
    }

    // Recurse into children
    if (node.children) {
      for (const child of node.children) {
        traverse(child, [...path, node.name])
      }
    }
  }

  // Start traversal from each library
  for (const library of spec.children) {
    traverse(library, [])
  }

  return classes
}

/**
 * Validate JSON → YML (check for missing documentation)
 */
function validateMissingDocumentation(
  jsonMap: Map<string, TypeDocNode>,
  yamlRefs: Map<string, YamlFunction>,
  spec: CombinedSpec
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Find all documentable classes dynamically
  const documentableClasses = findDocumentableClasses(spec, yamlRefs)

  for (const [path, node] of jsonMap.entries()) {
    // Skip if already documented
    if (yamlRefs.has(path)) {
      continue
    }

    // Only document methods and constructors
    if (node.kind !== TypeDocKind.Method && node.kind !== TypeDocKind.Constructor) {
      continue
    }

    // Skip inherited methods
    if (node.flags?.isInherited) {
      continue
    }

    // Find the parent class for this method
    const parts = path.split('.')
    let parentClassPath: string | null = null
    let parentClassInfo:
      | { className: string; hasDocumentation: boolean; isUserFacing: boolean }
      | undefined

    // Try to find parent class by removing last segment (the method name)
    for (let i = parts.length - 1; i >= 2; i--) {
      const potentialClassPath = parts.slice(0, i).join('.')
      if (documentableClasses.has(potentialClassPath)) {
        parentClassPath = potentialClassPath
        parentClassInfo = documentableClasses.get(potentialClassPath)
        break
      }
    }

    // Skip if no parent class found (shouldn't happen for valid methods)
    if (!parentClassPath || !parentClassInfo) {
      continue
    }

    // Determine severity based on class importance and method depth
    const classNameIndex = parts.indexOf(parentClassInfo.className)
    const methodDepthFromClass = parts.length - classNameIndex - 1

    // Error for direct methods on user-facing classes, warning for others
    const severity: 'error' | 'warning' =
      parentClassInfo.isUserFacing && methodDepthFromClass === 1 ? 'error' : 'warning'

    issues.push({
      type: 'missing-documentation',
      severity,
      path,
      message: `Public API '${path}' (kind: ${node.kind}) exists in combined.json but is not documented in YAML.`,
    })
  }

  return issues
}

/**
 * Check if any private APIs are exposed in YAML
 */
function validatePrivateExposure(
  yamlRefs: Map<string, YamlFunction>,
  jsonMap: Map<string, TypeDocNode>,
  fullJsonMap: Map<string, TypeDocNode>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const [ref] of yamlRefs.entries()) {
    // If it's in YAML but NOT in the public-only JSON map, it's private
    if (!jsonMap.has(ref) && fullJsonMap.has(ref)) {
      issues.push({
        type: 'private-api-exposed',
        severity: 'warning',
        ref,
        message: `Reference '${ref}' is documented in YAML but appears to be a private/internal API.`,
      })
    }
  }

  return issues
}

/**
 * Generate stub YAML entries for missing documentation
 */
function generateStubEntries(
  missingIssues: ValidationIssue[],
  jsonMap: Map<string, TypeDocNode>
): Array<{
  id: string
  title: string
  $ref: string
  description: string
  examples?: Array<{ id: string; name: string; code: string }>
}> {
  return missingIssues.map((issue) => {
    const path = issue.path!
    const parts = path.split('.')
    const name = parts[parts.length - 1]

    // Get the node to extract TypeDoc comments
    const node = jsonMap.get(path)

    // Extract description from TypeDoc
    const typeDocDescription = node ? extractDescription(node) : null
    const description = typeDocDescription || `TODO: Add description for ${name}`

    // Extract examples from TypeDoc
    const typeDocExamples = node ? extractExamples(node) : []
    const examples =
      typeDocExamples.length > 0
        ? typeDocExamples.map((example, index) => ({
            id: `example-${index + 1}`,
            name: `Example ${index + 1}`,
            code: example,
          }))
        : undefined

    const stub: {
      id: string
      title: string
      $ref: string
      description: string
      examples?: Array<{ id: string; name: string; code: string }>
    } = {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: name,
      $ref: path,
      description,
    }

    if (examples) {
      stub.examples = examples
    }

    return stub
  })
}

/**
 * Main validation function
 */
async function validate(
  jsonPath: string,
  yamlPath: string,
  options: Options
): Promise<ValidationReport> {
  console.log('🔍 Loading files...')

  // Load combined.json
  const jsonContent = await readFile(jsonPath, 'utf-8')
  const combinedSpec: CombinedSpec = JSON.parse(jsonContent)

  // Load YAML
  const yamlContent = await readFile(yamlPath, 'utf-8')
  const yamlSpec: YamlSpec = parse(yamlContent)

  console.log('✅ Files loaded successfully')
  console.log(`📚 Combined spec contains ${combinedSpec.children.length} libraries`)
  console.log(`📄 YAML spec contains ${yamlSpec.functions?.length || 0} documented functions`)

  // Build reference maps
  console.log('\n🗺️  Building reference maps...')
  const publicJsonMap = buildReferenceMap(combinedSpec, true)
  const fullJsonMap = buildReferenceMap(combinedSpec, false)
  const yamlRefs = extractYamlRefs(yamlSpec)

  console.log(`✅ Found ${publicJsonMap.size} public APIs in combined.json`)
  console.log(`✅ Found ${yamlRefs.size} documented references in YAML`)

  // Run validations
  console.log('\n🔎 Running validations...')
  const brokenRefs = validateBrokenReferences(yamlRefs, fullJsonMap)
  const missingDocs = validateMissingDocumentation(publicJsonMap, yamlRefs, combinedSpec)
  const privateExposed = validatePrivateExposure(yamlRefs, publicJsonMap, fullJsonMap)

  const allIssues = [...brokenRefs, ...missingDocs, ...privateExposed]

  // Generate report
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total_issues: allIssues.length,
      broken_references: brokenRefs.length,
      missing_documentation: missingDocs.length,
      private_apis_exposed: privateExposed.length,
    },
    issues: allIssues,
  }

  // Write report
  console.log(`\n📝 Writing report to ${options.reportPath}...`)
  await writeFile(options.reportPath, JSON.stringify(report, null, 2))

  // Auto-fix if requested
  if (options.fix && missingDocs.length > 0) {
    console.log('\n🔧 Generating stub entries for missing documentation...')
    const stubs = generateStubEntries(
      missingDocs.filter((i) => i.severity === 'error'),
      publicJsonMap
    )
    const stubsPath = options.reportPath.replace('.json', '-stubs.yaml')
    await writeFile(stubsPath, JSON.stringify(stubs, null, 2))
    console.log(`✅ Generated ${stubs.length} stub entries at ${stubsPath}`)
    console.log('⚠️  Note: Stubs are in JSON format. Convert to YAML and add to supabase_js_v2.yml')

    // Show a sample of descriptions found
    const withDescriptions = stubs.filter((s) => !s.description.startsWith('TODO')).length
    const withExamples = stubs.filter((s) => s.examples && s.examples.length > 0).length
    console.log(`   📝 ${withDescriptions}/${stubs.length} have TypeDoc descriptions`)
    console.log(`   💡 ${withExamples}/${stubs.length} have TypeDoc examples`)
  }

  return report
}

/**
 * Print summary to console
 */
function printSummary(report: ValidationReport, strict: boolean) {
  console.log('\n' + '='.repeat(60))
  console.log('📊 VALIDATION SUMMARY')
  console.log('='.repeat(60))

  console.log(`\n🔢 Total Issues: ${report.summary.total_issues}`)
  console.log(`   ❌ Broken References: ${report.summary.broken_references}`)
  console.log(`   📝 Missing Documentation: ${report.summary.missing_documentation}`)
  console.log(`   ⚠️  Private APIs Exposed: ${report.summary.private_apis_exposed}`)

  if (report.issues.length > 0) {
    console.log('\n📋 Issues by type:\n')

    const grouped = report.issues.reduce(
      (acc, issue) => {
        acc[issue.type] = acc[issue.type] || []
        acc[issue.type].push(issue)
        return acc
      },
      {} as Record<string, ValidationIssue[]>
    )

    for (const [type, issues] of Object.entries(grouped)) {
      console.log(`\n  ${type.toUpperCase()}:`)
      issues.slice(0, 5).forEach((issue) => {
        const icon = issue.severity === 'error' ? '❌' : '⚠️ '
        console.log(`    ${icon} ${issue.message}`)
      })
      if (issues.length > 5) {
        console.log(`    ... and ${issues.length - 5} more`)
      }
    }
  }

  console.log('\n' + '='.repeat(60))

  const hasErrors = report.issues.some((i) => i.severity === 'error')
  const hasWarnings = report.issues.some((i) => i.severity === 'warning')

  if (hasErrors || (strict && hasWarnings)) {
    console.log('❌ Validation FAILED')
    console.log(`\nSee full report at: ${process.cwd()}/sync-report.json`)
  } else if (hasWarnings) {
    console.log('⚠️  Validation passed with warnings')
  } else {
    console.log('✅ Validation PASSED')
  }
}

/**
 * Parse CLI arguments
 */
function parseArgs(): Options & { jsonPath: string; yamlPath: string } {
  const args = process.argv.slice(2)

  const options: Options = {
    fix: args.includes('--fix'),
    reportPath: 'sync-report.json',
    strict: args.includes('--strict'),
  }

  const reportPathIndex = args.indexOf('--report-path')
  if (reportPathIndex !== -1 && args[reportPathIndex + 1]) {
    options.reportPath = args[reportPathIndex + 1]
  }

  // Default paths
  const DOCS_DIR = process.cwd()
  const jsonPath = join(DOCS_DIR, 'spec/enrichments/tsdoc_v2/combined.json')
  const yamlPath = join(DOCS_DIR, 'spec/supabase_js_v2.yml')

  return { ...options, jsonPath, yamlPath }
}

/**
 * Main entry point
 */
async function main() {
  try {
    console.log('🚀 Starting reference sync validation...\n')

    const { jsonPath, yamlPath, ...options } = parseArgs()

    const report = await validate(jsonPath, yamlPath, options)

    printSummary(report, options.strict)

    // Exit with error code if validation failed
    const hasErrors = report.issues.some((i) => i.severity === 'error')
    const hasWarnings = report.issues.some((i) => i.severity === 'warning')

    if (hasErrors || (options.strict && hasWarnings)) {
      process.exit(1)
    }
  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

main()
