import { matchQualifiedIdentifier, splitSqlStatements } from './sql'
import type { MergeStrategy } from './types'

interface SqlObjectMatcher {
  kind: 'table' | 'function' | 'policy' | 'trigger' | 'index'
  pattern: RegExp
  /**
   * Postgres keywords that signal the author intends the statement to be safely
   * re-runnable. When present we silently skip duplicates instead of warning,
   * because the duplicate is by design.
   */
  safeRerunKeywords: readonly string[]
}

const QUALIFIED_TABLE =
  /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:(?:"([^"]+)"|([a-zA-Z_][\w$]*))\.)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/i
const QUALIFIED_FUNCTION =
  /create\s+(?:or\s+replace\s+)?function\s+(?:(?:"([^"]+)"|([a-zA-Z_][\w$]*))\.)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/i
const QUALIFIED_POLICY =
  /create\s+policy\s+(?:"([^"]+)"|([a-zA-Z_][\w$]*))\s+on\s+(?:(?:"([^"]+)"|([a-zA-Z_][\w$]*))\.)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/i
const QUALIFIED_TRIGGER = /create\s+(?:or\s+replace\s+)?trigger\s+(?:"([^"]+)"|([a-zA-Z_][\w$]*))/i
const QUALIFIED_INDEX =
  /create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/i

const SQL_OBJECTS: readonly SqlObjectMatcher[] = [
  { kind: 'table', pattern: QUALIFIED_TABLE, safeRerunKeywords: ['if not exists'] },
  {
    kind: 'function',
    pattern: QUALIFIED_FUNCTION,
    safeRerunKeywords: ['or replace', 'if not exists'],
  },
  {
    kind: 'trigger',
    pattern: QUALIFIED_TRIGGER,
    safeRerunKeywords: ['or replace', 'if not exists'],
  },
  { kind: 'index', pattern: QUALIFIED_INDEX, safeRerunKeywords: ['if not exists'] },
  { kind: 'policy', pattern: QUALIFIED_POLICY, safeRerunKeywords: [] },
]

export const mergeSql: MergeStrategy = ({ files }) => {
  const warnings: string[] = []
  const sections: string[] = []
  const seen = new Set<string>()

  for (const file of files) {
    for (const statement of splitSqlStatements(file.content)) {
      if (!statement || statement === ';') {
        continue
      }

      const identified = identifyObject(statement)

      if (!identified) {
        sections.push(statement)
        continue
      }

      const dedupKey = `${identified.kind}:${identified.qualifiedName}`

      if (seen.has(dedupKey)) {
        const isSafeRerun = identified.matcher.safeRerunKeywords.some((keyword) =>
          statement.toLowerCase().includes(keyword)
        )

        if (!isSafeRerun) {
          warnings.push(
            `Duplicate ${identified.kind} "${identified.qualifiedName}" from ${file.templateId}`
          )
        }

        continue
      }

      seen.add(dedupKey)
      sections.push(statement)
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

interface IdentifiedObject {
  matcher: SqlObjectMatcher
  kind: SqlObjectMatcher['kind']
  qualifiedName: string
}

function identifyObject(statement: string): IdentifiedObject | null {
  for (const matcher of SQL_OBJECTS) {
    const qualifiedName = extractQualifiedName(statement, matcher)
    if (qualifiedName) {
      return { matcher, kind: matcher.kind, qualifiedName }
    }
  }

  return null
}

function extractQualifiedName(statement: string, matcher: SqlObjectMatcher): string | null {
  if (matcher.kind === 'policy') {
    const match = statement.match(matcher.pattern)
    if (!match) return null
    const policyName = match[1] ?? match[2]
    const tableSchema = match[3] ?? match[4] ?? 'public'
    const tableName = match[5] ?? match[6]
    if (!policyName || !tableName) return null
    return `${tableSchema}.${tableName}::${policyName}`
  }

  if (matcher.kind === 'trigger' || matcher.kind === 'index') {
    const match = statement.match(matcher.pattern)
    if (!match) return null
    const name = match[1] ?? match[2]
    return name ?? null
  }

  const qualified = matchQualifiedIdentifier(statement, matcher.pattern)
  if (!qualified) return null
  return `${qualified.schema}.${qualified.name}`
}
