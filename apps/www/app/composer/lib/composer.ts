import JSZip from 'jszip'

import type { Template } from './templates'

export interface MergedFile {
  path: string
  content: string
  sources: string[]
}

export interface MergeResult {
  files: MergedFile[]
  compositionId: string
  warnings: string[]
}

export interface CompositionManifest {
  compositionId: string
  generatedAt: string
  templates: string[]
  files: Array<{
    path: string
    sources: string[]
  }>
  warnings: string[]
}

export interface DependencyResolution {
  resolved: Template[]
  missingDeps: string[]
}

export function getTemplatesRequiringDependency(
  dependencyId: string,
  selectedIds: Iterable<string>,
  allTemplates: Template[]
): Template[] {
  const selected = new Set(selectedIds)

  return allTemplates.filter(
    (template) =>
      selected.has(template.id) && template.dependencies?.required?.includes(dependencyId)
  )
}

export function canRemoveTemplate(
  templateId: string,
  selectedIds: Iterable<string>,
  allTemplates: Template[]
): boolean {
  return getTemplatesRequiringDependency(templateId, selectedIds, allTemplates).length === 0
}

export function generateCompositionId(templateIds: string[]): string {
  const hashInput = [...templateIds].sort().join('-')
  let hashCode = 0

  for (let i = 0; i < hashInput.length; i++) {
    hashCode = (hashCode << 5) - hashCode + hashInput.charCodeAt(i)
    hashCode &= hashCode
  }

  return Math.abs(hashCode).toString(36).padStart(6, '0')
}

function parseTomlValue(rawValue: string): unknown {
  const value = rawValue.trim()

  if (value === 'true') return true
  if (value === 'false') return false
  if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10)
  if (/^-?\d+\.\d+$/.test(value)) return Number.parseFloat(value)
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1)
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim()
    if (!inner) return []

    return inner.split(',').map((item) => parseTomlValue(item.trim()))
  }

  return value
}

function parseToml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  let currentSection = result

  for (const line of content.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) continue

    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/)

    if (sectionMatch) {
      currentSection = result

      for (const part of sectionMatch[1].split('.')) {
        const existing = currentSection[part]

        if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
          currentSection[part] = {}
        }

        currentSection = currentSection[part] as Record<string, unknown>
      }

      continue
    }

    const keyValueMatch = trimmed.match(/^([^=]+)=(.+)$/)

    if (keyValueMatch) {
      currentSection[keyValueMatch[1].trim()] = parseTomlValue(keyValueMatch[2])
    }
  }

  return result
}

function stringifyTomlValue(value: unknown): string {
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'boolean' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return `[${value.map(stringifyTomlValue).join(', ')}]`

  return String(value)
}

function stringifyToml(obj: Record<string, unknown>, prefix = ''): string {
  let output = ''

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue

    if (typeof value !== 'object' || Array.isArray(value)) {
      output += `${key} = ${stringifyTomlValue(value)}\n`
    }
  }

  for (const [key, value] of Object.entries(obj)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue

    const sectionPath = prefix ? `${prefix}.${key}` : key
    output += `\n[${sectionPath}]\n`
    output += stringifyToml(value as Record<string, unknown>, sectionPath)
  }

  return output
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target }

  for (const [key, value] of Object.entries(source)) {
    const existing = result[key]

    if (
      value &&
      existing &&
      typeof value === 'object' &&
      typeof existing === 'object' &&
      !Array.isArray(value) &&
      !Array.isArray(existing)
    ) {
      result[key] = deepMerge(existing as Record<string, unknown>, value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }

  return result
}

function mergeToml(files: Array<{ content: string; templateId: string }>) {
  const warnings: string[] = []
  let merged: Record<string, unknown> = {}

  for (const file of files) {
    try {
      merged = deepMerge(merged, parseToml(file.content))
    } catch {
      warnings.push(`Could not parse TOML from template ${file.templateId}`)
    }
  }

  return {
    content: stringifyToml(merged).trim(),
    warnings,
  }
}

function splitSqlStatements(content: string): string[] {
  const statements: string[] = []
  let currentStatement = ''
  let inDollarBlock = false

  for (const line of content.split('\n')) {
    const dollarDelimiterCount = line.match(/\$\$/g)?.length ?? 0

    if (dollarDelimiterCount % 2 === 1) {
      inDollarBlock = !inDollarBlock
    }

    currentStatement += `${line}\n`

    if (line.trim().endsWith(';') && !inDollarBlock) {
      statements.push(currentStatement.trim())
      currentStatement = ''
    }
  }

  if (currentStatement.trim()) {
    statements.push(currentStatement.trim())
  }

  return statements
}

function mergeSql(files: Array<{ content: string; templateId: string }>) {
  const warnings: string[] = []
  const sections: string[] = []
  const seen = {
    tables: new Set<string>(),
    functions: new Set<string>(),
    policies: new Set<string>(),
    triggers: new Set<string>(),
    indexes: new Set<string>(),
  }

  for (const file of files) {
    for (const statement of splitSqlStatements(file.content)) {
      if (!statement || statement === ';') continue

      const tableMatch = statement.match(
        /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?(\w+)/i
      )
      const functionMatch = statement.match(
        /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([^\s(]+)/i
      )
      const policyMatch = statement.match(/create\s+policy\s+"([^"]+)"/i)
      const triggerMatch = statement.match(/create\s+(?:or\s+replace\s+)?trigger\s+(\w+)/i)
      const indexMatch = statement.match(
        /create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?(\w+)/i
      )

      let shouldSkip = false

      if (tableMatch) {
        const [, tableName] = tableMatch
        if (seen.tables.has(tableName)) {
          if (!statement.toLowerCase().includes('if not exists')) {
            warnings.push(`Duplicate table "${tableName}" from ${file.templateId}`)
          }
          shouldSkip = true
        }
        seen.tables.add(tableName)
      } else if (functionMatch) {
        const [, functionName] = functionMatch
        if (seen.functions.has(functionName) && !statement.toLowerCase().includes('or replace')) {
          warnings.push(`Duplicate function "${functionName}" from ${file.templateId}`)
          shouldSkip = true
        }
        seen.functions.add(functionName)
      } else if (policyMatch) {
        const [, policyName] = policyMatch
        if (seen.policies.has(policyName)) {
          warnings.push(`Duplicate policy "${policyName}" from ${file.templateId}`)
          shouldSkip = true
        }
        seen.policies.add(policyName)
      } else if (triggerMatch) {
        const [, triggerName] = triggerMatch
        if (seen.triggers.has(triggerName) && !statement.toLowerCase().includes('or replace')) {
          warnings.push(`Duplicate trigger "${triggerName}" from ${file.templateId}`)
          shouldSkip = true
        }
        seen.triggers.add(triggerName)
      } else if (indexMatch) {
        const [, indexName] = indexMatch
        if (seen.indexes.has(indexName)) {
          if (!statement.toLowerCase().includes('if not exists')) {
            warnings.push(`Duplicate index "${indexName}" from ${file.templateId}`)
          }
          shouldSkip = true
        }
        seen.indexes.add(indexName)
      }

      if (!shouldSkip) {
        sections.push(statement)
      }
    }
  }

  return {
    content: [
      '-- Supabase Composed Schema',
      `-- Generated from templates: ${files.map((file) => file.templateId).join(', ')}`,
      '',
      sections.join('\n\n'),
    ].join('\n'),
    warnings,
  }
}

export function resolveTemplateDependencies(
  selectedIds: string[],
  allTemplates: Template[]
): DependencyResolution {
  const templateMap = new Map(allTemplates.map((template) => [template.id, template]))
  const resolvedIds = new Set<string>()
  const missingDeps = new Set<string>()

  function resolve(id: string) {
    if (resolvedIds.has(id)) return

    const template = templateMap.get(id)

    if (!template) {
      missingDeps.add(id)
      return
    }

    for (const depId of template.dependencies?.required ?? []) {
      resolve(depId)
    }

    resolvedIds.add(id)
  }

  for (const id of selectedIds) {
    resolve(id)
  }

  return {
    resolved: Array.from(resolvedIds)
      .map((id) => templateMap.get(id))
      .filter((template): template is Template => Boolean(template)),
    missingDeps: Array.from(missingDeps),
  }
}

export function mergeTemplates(templates: Template[]): MergeResult {
  const fileMap = new Map<string, Array<{ content: string; templateId: string }>>()
  const warnings: string[] = []

  for (const template of templates) {
    for (const file of template.files) {
      const fileEntries = fileMap.get(file.path) ?? []
      fileEntries.push({ content: file.content, templateId: template.id })
      fileMap.set(file.path, fileEntries)
    }
  }

  const files: MergedFile[] = []

  for (const [path, fileEntries] of fileMap.entries()) {
    const sources = fileEntries.map((file) => file.templateId)

    if (fileEntries.length === 1) {
      files.push({ path, content: fileEntries[0].content, sources })
      continue
    }

    const extension = path.split('.').pop()?.toLowerCase()

    if (extension === 'toml') {
      const result = mergeToml(fileEntries)
      files.push({ path, content: result.content, sources })
      warnings.push(...result.warnings)
      continue
    }

    if (extension === 'sql') {
      const result = mergeSql(fileEntries)
      files.push({ path, content: result.content, sources })
      warnings.push(...result.warnings)
      continue
    }

    if (extension === 'ts' || extension === 'js') {
      const functionMatch = path.match(/functions\/([^/]+)/)

      if (functionMatch) {
        warnings.push(`Duplicate edge function "${functionMatch[1]}" from ${sources.join(', ')}`)
      } else {
        warnings.push(`File ${path} exists in multiple templates - using ${sources[0]}`)
      }

      files.push({ path, content: fileEntries[0].content, sources })
      continue
    }

    const winningFile = fileEntries[fileEntries.length - 1]
    warnings.push(`File ${path} exists in multiple templates - using ${winningFile.templateId}`)
    files.push({ path, content: winningFile.content, sources })
  }

  files.sort((a, b) => a.path.localeCompare(b.path))

  return {
    files,
    compositionId: generateCompositionId(templates.map((template) => template.id)),
    warnings,
  }
}

export function createCompositionManifest(
  mergeResult: MergeResult,
  generatedAt = new Date().toISOString()
): CompositionManifest {
  return {
    compositionId: mergeResult.compositionId,
    generatedAt,
    templates: Array.from(new Set(mergeResult.files.flatMap((file) => file.sources))).sort(),
    files: mergeResult.files.map((file) => ({
      path: file.path,
      sources: file.sources,
    })),
    warnings: mergeResult.warnings,
  }
}

export async function createZipBlob(mergeResult: MergeResult): Promise<Blob> {
  const zip = new JSZip()

  for (const file of mergeResult.files) {
    zip.file(file.path, file.content)
  }

  zip.file('composition.json', JSON.stringify(createCompositionManifest(mergeResult), null, 2))

  return zip.generateAsync({ type: 'blob' })
}
