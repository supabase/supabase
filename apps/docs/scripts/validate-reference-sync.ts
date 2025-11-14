#!/usr/bin/env tsx
/**
 * Validates that apps/docs/spec/supabase_js_v2.yml stays in sync with the latest
 * TypeDoc output (apps/docs/spec/enrichments/tsdoc_v2/combined.json). Run via
 * `pnpm --filter docs validate:refs` whenever tsdoc data or the YAML spec changes.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Document, parseDocument, YAMLMap, YAMLSeq } from 'yaml'

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
  examples?: YamlExample[]
}

interface YamlSpec {
  info: {
    definition: string
    [key: string]: any
  }
  functions?: YamlFunction[]
}

interface YamlExample {
  id?: string
  name?: string
  code?: string
  [key: string]: any
}

type CategoryKey = 'database' | 'auth' | 'edgeFunctions' | 'realtime' | 'storage'

interface SectionItem {
  id: string
  title: string
  slug: string
  type: 'function' | 'markdown'
  product?: string
  isFunc?: boolean
  items?: SectionItem[]
  excludes?: string[]
}

interface SectionCategory {
  type: 'category'
  title: string
  items: SectionItem[]
  excludes?: string[]
}

const STATIC_TOP_SECTIONS: SectionItem[] = [
  {
    title: 'Introduction',
    id: 'introduction',
    slug: 'introduction',
    type: 'markdown',
  },
  {
    title: 'Installing',
    id: 'installing',
    slug: 'installing',
    type: 'markdown',
    excludes: ['reference_javascript_v1', 'reference_kotlin_v1', 'reference_swift_v1'],
  },
  {
    title: 'Initializing',
    id: 'initializing',
    slug: 'initializing',
    type: 'function',
  },
  {
    title: 'TypeScript support',
    id: 'typescript-support',
    slug: 'typescript-support',
    type: 'markdown',
    excludes: [
      'reference_javascript_v1',
      'reference_dart_v1',
      'reference_dart_v2',
      'reference_python_v2',
      'reference_csharp_v0',
      'reference_csharp_v1',
      'reference_swift_v1',
      'reference_swift_v2',
      'reference_kotlin_v1',
      'reference_kotlin_v2',
      'reference_kotlin_v3',
    ],
  },
  {
    title: 'Upgrade guide',
    id: 'upgrade-guide',
    slug: 'upgrade-guide',
    type: 'markdown',
    excludes: [
      'reference_javascript_v2',
      'reference_dart_v1',
      'reference_python_v2',
      'reference_csharp_v0',
      'reference_csharp_v1',
      'reference_swift_v1',
      'reference_swift_v2',
      'reference_kotlin_v1',
      'reference_kotlin_v2',
      'reference_kotlin_v3',
    ],
  },
]

const STATIC_BOTTOM_SECTIONS: SectionCategory[] = [
  {
    type: 'category',
    title: 'Misc',
    excludes: [
      'reference_dart_v1',
      'reference_dart_v2',
      'reference_javascript_v1',
      'reference_javascript_v2',
      'reference_kotlin_v1',
      'reference_kotlin_v2',
      'reference_python_v2',
      'reference_swift_v1',
      'reference_swift_v2',
      'reference_kotlin_v3',
    ],
    items: [
      {
        title: 'Release Notes',
        id: 'release-notes',
        slug: 'release-notes',
        isFunc: false,
        type: 'markdown',
      },
    ],
  },
]

const STATIC_SECTION_IDS = new Set<string>(
  [
    ...STATIC_TOP_SECTIONS.map((section) => section.id),
    ...STATIC_BOTTOM_SECTIONS.flatMap((category) => category.items.map((item) => item.id)),
  ].filter(Boolean)
)

const CATEGORY_CONFIG: Record<CategoryKey, { title: string; defaultProduct: string }> = {
  database: { title: 'Database', defaultProduct: 'database' },
  auth: { title: 'Auth', defaultProduct: 'auth' },
  edgeFunctions: { title: 'Edge Functions', defaultProduct: 'functions' },
  realtime: { title: 'Realtime', defaultProduct: 'realtime' },
  storage: { title: 'Storage', defaultProduct: 'storage' },
}

const CATEGORY_ORDER: CategoryKey[] = ['database', 'auth', 'edgeFunctions', 'realtime', 'storage']

const ID_CATEGORY_OVERRIDES: Record<string, { category: CategoryKey; product?: string }> = {
  'auth-api': { category: 'auth', product: 'auth' },
  'auth-mfa-api': { category: 'auth', product: 'auth' },
  'admin-api': { category: 'auth', product: 'auth-admin' },
  'using-filters': { category: 'database', product: 'database' },
  'using-modifiers': { category: 'database', product: 'database' },
}

const GROUP_PARENT_CONFIG: Record<string, { category: CategoryKey; product?: string }> = {
  'using-filters': { category: 'database', product: 'database' },
  'using-modifiers': { category: 'database', product: 'database' },
  'auth-mfa-api': { category: 'auth', product: 'auth' },
  'admin-api': { category: 'auth', product: 'auth-admin' },
}

const GROUP_CHILD_CONFIGS: Array<{ parentId: string; matcher: (fn: YamlFunction) => boolean }> = [
  {
    parentId: 'using-filters',
    matcher: (fn) => !!fn.$ref && fn.$ref.includes('PostgrestFilterBuilder.'),
  },
  {
    parentId: 'using-modifiers',
    matcher: (fn) => !!fn.$ref && fn.$ref.includes('PostgrestTransformBuilder.'),
  },
  {
    parentId: 'auth-mfa-api',
    matcher: (fn) => !!fn.$ref && fn.$ref.includes('GoTrueMFAApi.'),
  },
  {
    parentId: 'admin-api',
    matcher: (fn) =>
      !!fn.$ref &&
      (fn.$ref.includes('GoTrueAdmin') ||
        fn.$ref.includes('GoTrueAdminOAuthApi') ||
        fn.$ref.includes('AuthOAuthServerApi.')),
  },
]

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
  jsonPath?: string
  yamlPath?: string
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

// Source packages (vs re-export package)
const SOURCE_PACKAGES = [
  '@supabase/auth-js',
  '@supabase/storage-js',
  '@supabase/postgrest-js',
  '@supabase/realtime-js',
  '@supabase/functions-js',
]

const REEXPORT_PACKAGE = '@supabase/supabase-js'

/**
 * Normalizes a TypeDoc reference path so it matches the format used in YAML.
 * Removes synthetic segments such as `.index` that are added by barrel files.
 */
function normalizeRefPath(path: string | undefined): string {
  if (!path) {
    return ''
  }

  let normalized = path

  normalized = normalized.replace(/\.index(?=\.|$)/g, '')
  normalized = normalized.replace(/\.\.+/g, '.')

  return normalized
}

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
    const normalizedPath = normalizeRefPath(currentPath)

    // Only add if public (or if we're not filtering)
    if (!publicOnly || isPublicApi(node)) {
      map.set(normalizedPath, node)
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
      refs.set(normalizeRefPath(fn.$ref), fn)
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
    const normalizedPath = normalizeRefPath(currentPath)

    // Check if this is a class or interface with public methods
    if (
      (node.kind === TypeDocKind.Class || node.kind === TypeDocKind.Interface) &&
      isPublicApi(node)
    ) {
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
            const methodPath = normalizeRefPath([...path, node.name, child.name].join('.'))
            return yamlRefs.has(methodPath)
          }) || false

        const isUserFacing =
          isUserFacingClass(node.name) || isTopLevelExport(currentPath) || hasDocumentation

        classes.set(normalizedPath, {
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
 * Check if a path is a re-export that's already documented in a source package
 *
 * Example:
 * - @supabase/supabase-js.GoTrueClient.signUp is a re-export
 * - @supabase/auth-js.GoTrueClient.signUp is documented → skip supabase-js version
 */
function isDocumentedReexport(path: string, yamlRefs: Map<string, YamlFunction>): boolean {
  // Only check re-export package
  if (!path.startsWith(REEXPORT_PACKAGE + '.')) {
    return false
  }

  // Extract the class.method part (everything after @supabase/supabase-js.)
  const pathSuffix = path.substring(REEXPORT_PACKAGE.length + 1)

  // Check if this same path exists in any source package AND is documented
  for (const sourcePackage of SOURCE_PACKAGES) {
    const sourceEquivalent = `${sourcePackage}.${pathSuffix}`
    if (yamlRefs.has(sourceEquivalent)) {
      // Found documented version in source package - this is a re-export
      return true
    }
  }

  // Exception: SupabaseClient methods are NOT re-exports (they only exist in supabase-js)
  if (pathSuffix.startsWith('SupabaseClient.')) {
    return false
  }

  // Default: assume it's a re-export if it's in supabase-js but not documented
  // This handles cases where source package doc is missing but we don't want double errors
  return true
}

/**
 * Check if a path is an internal implementation class
 *
 * Internal classes have patterns like:
 * - @supabase/storage-js.packages/BlobDownloadBuilder.default.constructor
 * - Classes accessed via .default export
 * - Classes with / in their module path
 */
function isInternalImplementationClass(path: string): boolean {
  // Check for .default. pattern (module default exports)
  if (path.includes('.default.')) {
    return true
  }

  // Check for / in class name (internal module structure)
  // Example: packages/BlobDownloadBuilder
  const parts = path.split('.')
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]
    if (part.includes('/')) {
      return true
    }
  }

  return false
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

    // Skip re-exports that are already documented in source packages
    if (isDocumentedReexport(path, yamlRefs)) {
      continue
    }

    // Skip internal implementation classes
    if (isInternalImplementationClass(path)) {
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
): YamlFunction[] {
  return missingIssues.map((issue) => {
    const path = issue.path!
    const parts = path.split('.')
    const methodName = parts[parts.length - 1]
    const className = parts[parts.length - 2] || methodName

    // Get the node to extract TypeDoc comments
    const node = jsonMap.get(path)

    // Extract description from TypeDoc
    const typeDocDescription = node ? extractDescription(node) : null
    const description = typeDocDescription || `TODO: Add description for ${methodName}`

    // Extract examples from TypeDoc
    const typeDocExamples = node ? extractExamples(node) : []
    const baseId = createStubId(path)
    const examples =
      typeDocExamples.length > 0
        ? typeDocExamples.map((example, index) => ({
            id: `${baseId}-example-${index + 1}`,
            name: `Example ${index + 1}`,
            code: example,
          }))
        : undefined

    const stub: YamlFunction = {
      id: baseId,
      title: methodName === 'constructor' ? `new ${className}()` : `${className}.${methodName}()`,
      $ref: path,
      description,
    }

    if (examples) {
      stub.examples = examples
    }

    return stub
  })
}

function createStubId(path: string): string {
  const sanitized = normalizeRefPath(path).replace(/^@supabase\//, '')
  return sanitized
    .split('.')
    .map((segment) => segment.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase())
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
}

function appendStubsToYaml(
  yamlDoc: Document.Parsed,
  yamlSpec: YamlSpec,
  stubs: YamlFunction[],
  functionsSeq: YAMLSeq<YAMLMap>,
  functionNodeMap: Map<string, YAMLMap>
): number {
  if (stubs.length === 0) {
    return 0
  }

  if (!yamlSpec.functions) {
    yamlSpec.functions = []
  }

  const existingIds = new Set(yamlSpec.functions.map((fn) => fn.id))
  let appended = 0

  for (const stub of stubs) {
    let candidateId = stub.id
    let suffix = 1
    while (existingIds.has(candidateId)) {
      candidateId = `${stub.id}-${suffix++}`
    }
    existingIds.add(candidateId)

    const normalizedStub: YamlFunction = { ...stub, id: candidateId }
    yamlSpec.functions.push(normalizedStub)

    const node = yamlDoc.createNode(normalizedStub) as YAMLMap
    functionsSeq.add(node)
    functionNodeMap.set(candidateId, node)
    appended++
  }

  return appended
}

function getFunctionsSequence(doc: Document.Parsed): YAMLSeq<YAMLMap> {
  let functionsNode = doc.get('functions', true) as YAMLSeq<YAMLMap> | null
  if (!functionsNode) {
    functionsNode = doc.createNode([]) as YAMLSeq<YAMLMap>
    doc.set('functions', functionsNode)
  }
  return functionsNode
}

function buildFunctionNodeMap(functionsSeq: YAMLSeq<YAMLMap>): Map<string, YAMLMap> {
  const map = new Map<string, YAMLMap>()

  for (const item of functionsSeq.items) {
    if (item instanceof YAMLMap) {
      const id = item.get('id') as string | undefined
      if (typeof id === 'string') {
        map.set(id, item)
      }
    }
  }

  return map
}

function getTypeDocNodeWithFallback(
  refPath: string,
  fullJsonMap: Map<string, TypeDocNode>
): { node: TypeDocNode; description: string | null } | null {
  const normalizedRef = normalizeRefPath(refPath)
  const directNode = fullJsonMap.get(normalizedRef)
  if (directNode) {
    const description = extractDescription(directNode)
    if (description) {
      return { node: directNode, description }
    }
    if (normalizedRef.endsWith('.constructor')) {
      const parentPath = normalizedRef.replace(/\.constructor$/, '')
      const parentNode = fullJsonMap.get(parentPath)
      if (parentNode) {
        return { node: parentNode, description: extractDescription(parentNode) }
      }
    }
    return { node: directNode, description: null }
  }

  if (normalizedRef.endsWith('.constructor')) {
    const parentPath = normalizedRef.replace(/\.constructor$/, '')
    const parentNode = fullJsonMap.get(parentPath)
    if (parentNode) {
      return { node: parentNode, description: extractDescription(parentNode) }
    }
  }

  return null
}

function syncYamlDescriptionsAndExamples(
  yamlSpec: YamlSpec,
  functionNodeMap: Map<string, YAMLMap>,
  yamlDoc: Document.Parsed,
  fullJsonMap: Map<string, TypeDocNode>
): boolean {
  let changed = false

  if (!yamlSpec.functions) {
    return changed
  }

  for (const fn of yamlSpec.functions) {
    if (!fn.id || !fn.$ref) {
      continue
    }

    const typeDocDetails = getTypeDocNodeWithFallback(fn.$ref, fullJsonMap)
    if (!typeDocDetails) {
      continue
    }

    const typeDocNode = typeDocDetails.node
    const typeDocDescription = typeDocDetails.description
    const fnNode = functionNodeMap.get(fn.id)
    if (!fnNode) {
      continue
    }

    if (typeDocDescription && Object.prototype.hasOwnProperty.call(fn, 'description')) {
      delete fn.description
      if (fnNode.delete('description')) {
        changed = true
      }
    }

    const typeDocExamples = extractExamples(typeDocNode)
    if (
      typeDocExamples.length > 0 &&
      mergeExamplesFromTypeDoc(yamlDoc, fn, fnNode, typeDocExamples)
    ) {
      changed = true
    }
  }

  return changed
}

function mergeExamplesFromTypeDoc(
  yamlDoc: Document.Parsed,
  fn: YamlFunction,
  fnNode: YAMLMap,
  typeDocExamples: string[]
): boolean {
  const existingExamples: YamlExample[] = Array.isArray(fn.examples) ? fn.examples : []
  const existingCodes = new Set(
    existingExamples
      .map((example) => (typeof example.code === 'string' ? example.code.trim() : ''))
      .filter(Boolean)
  )
  const existingIds = new Set(
    existingExamples
      .map((example) => example.id)
      .filter((id): id is string => typeof id === 'string')
  )
  const newExamples: YamlExample[] = []
  const startingIndex = existingExamples.length

  typeDocExamples.forEach((code, index) => {
    const trimmed = code.trim()
    if (!trimmed || existingCodes.has(trimmed)) {
      return
    }

    let baseId = `${fn.id}-typedoc-example-${index + 1}`
    let candidateId = baseId
    let suffix = 1
    while (existingIds.has(candidateId)) {
      candidateId = `${baseId}-${suffix++}`
    }
    existingIds.add(candidateId)

    newExamples.push({
      id: candidateId,
      name: `Example ${startingIndex + newExamples.length + 1}`,
      code,
    })
    existingCodes.add(trimmed)
  })

  if (newExamples.length === 0) {
    return false
  }

  if (!fn.examples) {
    fn.examples = []
  }
  fn.examples.push(...newExamples)

  let examplesNode = fnNode.get('examples', true) as unknown as YAMLSeq<YAMLMap> | undefined
  if (!examplesNode) {
    examplesNode = yamlDoc.createNode([]) as YAMLSeq<YAMLMap>
    fnNode.set('examples', examplesNode)
  }

  newExamples.forEach((example) => {
    const node = yamlDoc.createNode(example)
    examplesNode!.add(node)
  })

  return true
}

function getDefaultProduct(category: CategoryKey): string {
  return CATEGORY_CONFIG[category].defaultProduct
}

function getCategoryMeta(fn: YamlFunction): { category: CategoryKey; product: string } | null {
  const override = ID_CATEGORY_OVERRIDES[fn.id]
  if (override) {
    return {
      category: override.category,
      product: override.product ?? getDefaultProduct(override.category),
    }
  }

  if (!fn.$ref) {
    return null
  }

  const segments = fn.$ref.split('.')
  const pkg = segments[0]
  const className = segments[1] ?? ''
  const memberName = segments[segments.length - 1] ?? ''

  switch (pkg) {
    case '@supabase/postgrest-js':
      return { category: 'database', product: 'database' }
    case '@supabase/storage-js':
      return { category: 'storage', product: 'storage' }
    case '@supabase/functions-js':
      return { category: 'edgeFunctions', product: 'functions' }
    case '@supabase/realtime-js':
      return { category: 'realtime', product: 'realtime' }
    case '@supabase/auth-js': {
      const isAdmin =
        className.startsWith('GoTrueAdmin') ||
        className.startsWith('GoTrueAdminOAuth') ||
        className.startsWith('AuthOAuthServer')
      return { category: 'auth', product: isAdmin ? 'auth-admin' : 'auth' }
    }
    case '@supabase/supabase-js': {
      if (fn.id === 'initializing') {
        return null
      }

      const realtimeMembers = [
        'SupabaseClient.channel',
        'SupabaseClient.getChannels',
        'SupabaseClient.removeChannel',
        'SupabaseClient.removeAllChannels',
      ]
      if (realtimeMembers.some((member) => fn.$ref!.endsWith(member))) {
        return { category: 'realtime', product: 'realtime' }
      }

      const databaseMembers = ['SupabaseClient.from', 'SupabaseClient.rpc', 'SupabaseClient.schema']
      if (databaseMembers.some((member) => fn.$ref!.endsWith(member))) {
        return { category: 'database', product: 'database' }
      }

      return null
    }
    default:
      return null
  }
}

function createNavItem(fn: YamlFunction, product?: string): SectionItem {
  const item: SectionItem = {
    id: fn.id,
    title: fn.title ?? fn.id,
    slug: fn.id,
    type: 'function',
  }

  if (product) {
    item.product = product
  }

  return item
}

function buildCanonicalCategories(yamlSpec: YamlSpec): SectionCategory[] {
  const categories = new Map<CategoryKey, SectionCategory>()
  for (const key of CATEGORY_ORDER) {
    categories.set(key, {
      type: 'category',
      title: CATEGORY_CONFIG[key].title,
      items: [],
    })
  }

  const groupParents = new Map<string, SectionItem>()

  for (const fn of yamlSpec.functions ?? []) {
    if (!fn.id || STATIC_SECTION_IDS.has(fn.id)) {
      continue
    }

    const parentConfig = GROUP_PARENT_CONFIG[fn.id]
    if (parentConfig) {
      const parentItem = createNavItem(
        fn,
        parentConfig.product ?? getDefaultProduct(parentConfig.category)
      )
      parentItem.isFunc = false
      parentItem.items = []
      groupParents.set(fn.id, parentItem)
      categories.get(parentConfig.category)?.items.push(parentItem)
      continue
    }

    const meta = getCategoryMeta(fn)
    if (!meta) {
      continue
    }

    const navItem = createNavItem(fn, meta.product)
    const groupConfig = GROUP_CHILD_CONFIGS.find((group) => group.matcher(fn))
    if (groupConfig) {
      const parent = groupParents.get(groupConfig.parentId)
      if (parent && parent.items) {
        parent.items.push(navItem)
        continue
      }
    }

    categories.get(meta.category)?.items.push(navItem)
  }

  return CATEGORY_ORDER.map((key) => categories.get(key)!).filter(
    (category) => category.items.length > 0
  )
}

async function syncClientLibrarySections(yamlSpec: YamlSpec, sectionsPath: string) {
  const canonicalCategories = buildCanonicalCategories(yamlSpec)
  const existingSections = await loadExistingSections(sectionsPath)
  const categoryMap = new Map(
    existingSections
      .filter((section): section is SectionCategory => isCategoryEntry(section))
      .map((category) => [category.title, category])
  )

  const mergedCategories = canonicalCategories
    .map((canonicalCategory) => {
      const existingCategory = categoryMap.get(canonicalCategory.title)
      return mergeCategory(existingCategory, canonicalCategory)
    })
    .filter((category): category is SectionCategory => !!category && category.items.length > 0)

  const finalSections = insertCategoriesIntoSections(existingSections, mergedCategories)
  await writeFile(sectionsPath, JSON.stringify(finalSections, null, 2) + '\n')
}

async function loadExistingSections(
  sectionsPath: string
): Promise<Array<SectionCategory | SectionItem>> {
  try {
    const raw = await readFile(sectionsPath, 'utf-8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    // ignore - will fall back to defaults
  }
  return [...STATIC_TOP_SECTIONS, ...STATIC_BOTTOM_SECTIONS]
}

function isCategoryEntry(entry: any): entry is SectionCategory {
  return entry && entry.type === 'category' && Array.isArray(entry.items)
}

function mergeCategory(
  existing: SectionCategory | undefined,
  canonical: SectionCategory
): SectionCategory | null {
  if (!canonical.items || canonical.items.length === 0) {
    return null
  }
  if (!existing) {
    return canonical
  }
  return {
    ...existing,
    items: mergeCategoryItems(existing.items ?? [], canonical.items ?? []),
  }
}

function mergeCategoryItems(existing: SectionItem[], canonical: SectionItem[]): SectionItem[] {
  const existingMap = new Map(existing.map((item) => [item.id, item]))
  return canonical.map((canonicalItem) => {
    const existingItem = canonicalItem.id ? existingMap.get(canonicalItem.id) : undefined
    if (!existingItem) {
      return canonicalItem
    }
    const merged: SectionItem = { ...existingItem }
    if (canonicalItem.items && canonicalItem.items.length > 0) {
      merged.items = mergeCategoryItems(existingItem.items ?? [], canonicalItem.items)
    } else if (merged.items) {
      delete merged.items
    }
    return merged
  })
}

function insertCategoriesIntoSections(
  existingSections: Array<SectionCategory | SectionItem>,
  categories: SectionCategory[]
): Array<SectionCategory | SectionItem> {
  if (categories.length === 0) {
    return existingSections.filter(
      (section) => !isCategoryEntry(section) || !isTargetCategory(section.title)
    )
  }

  const targetTitles = new Set(categories.map((category) => category.title))
  const finalSections: Array<SectionCategory | SectionItem> = []
  let inserted = false

  for (const entry of existingSections) {
    if (isCategoryEntry(entry) && targetTitles.has(entry.title)) {
      if (!inserted) {
        finalSections.push(...categories)
        inserted = true
      }
      continue
    }
    finalSections.push(entry)
  }

  if (!inserted) {
    finalSections.push(...categories)
  }

  return finalSections
}

function isTargetCategory(title: string): boolean {
  return CATEGORY_ORDER.some((key) => CATEGORY_CONFIG[key].title === title)
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
  const yamlDoc = parseDocument(yamlContent)
  const yamlSpec: YamlSpec = (yamlDoc.toJSON() as YamlSpec) ?? {
    info: { definition: '' },
    functions: [],
  }
  const functionsSeq = getFunctionsSequence(yamlDoc)
  const functionNodeMap = buildFunctionNodeMap(functionsSeq)
  let yamlDocChanged = false

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
  yamlDocChanged =
    syncYamlDescriptionsAndExamples(yamlSpec, functionNodeMap, yamlDoc, fullJsonMap) ||
    yamlDocChanged

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

    if (stubs.length > 0) {
      const appended = appendStubsToYaml(yamlDoc, yamlSpec, stubs, functionsSeq, functionNodeMap)
      if (appended > 0) {
        yamlDocChanged = true
        console.log(`✅ Appended ${appended} stub entries to ${yamlPath}`)
      }
    } else {
      console.log('ℹ️  No eligible stubs were generated.')
    }
  }

  if (yamlDocChanged) {
    await writeFile(yamlPath, yamlDoc.toString())
    console.log(`📝 Updated ${yamlPath}`)
  }

  const sectionsPath = join(dirname(yamlPath), 'common-client-libs-sections.json')
  console.log('\n🧭 Syncing common client library sections...')
  await syncClientLibrarySections(yamlSpec, sectionsPath)
  console.log(`✅ Updated ${sectionsPath}`)

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
function parseArgs(): Required<Pick<Options, 'jsonPath' | 'yamlPath'>> & Options {
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

  const jsonPathIndex = args.indexOf('--json-path')
  if (jsonPathIndex !== -1 && args[jsonPathIndex + 1]) {
    options.jsonPath = args[jsonPathIndex + 1]
  }

  const yamlPathIndex = args.indexOf('--yaml-path')
  if (yamlPathIndex !== -1 && args[yamlPathIndex + 1]) {
    options.yamlPath = args[yamlPathIndex + 1]
  }

  // Default paths
  const DOCS_DIR = process.cwd()
  const jsonPath = options.jsonPath ?? join(DOCS_DIR, 'spec/enrichments/tsdoc_v2/combined.json')
  const yamlPath = options.yamlPath ?? join(DOCS_DIR, 'spec/supabase_js_v2.yml')

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
