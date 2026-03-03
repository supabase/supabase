/**
 * Lightweight SQL parser for telemetry event detection.
 *
 * [Sean] Replace this with a proper SQL parser like `@supabase/pg-parser` once a
 * browser-compatible version is available.
 */
import { TABLE_EVENT_ACTIONS, TableEventAction } from 'common/telemetry-constants'

export interface TableEventDetails {
  type: TableEventAction
  schema?: string
  tableName?: string
}

type Detector = {
  type: TableEventAction
  patterns: RegExp[]
}

export class SQLEventParser {
  private static DETECTORS: Detector[] = [
    {
      type: TABLE_EVENT_ACTIONS.TableCreated,
      patterns: [
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>[\w"`]+)/i,
        /CREATE\s+TEMP(?:ORARY)?\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>[\w"`]+)/i,
        /CREATE\s+UNLOGGED\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>[\w"`]+)/i,
        /SELECT\s+.*?\s+INTO\s+(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>[\w"`]+)/is,
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>[\w"`]+)\s+AS\s+SELECT/i,
      ],
    },
    {
      type: TABLE_EVENT_ACTIONS.TableDataAdded,
      patterns: [
        /INSERT\s+INTO\s+(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>[\w"`]+)/i,
        /COPY\s+(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>[\w"`]+)\s+FROM/i,
      ],
    },
    {
      type: TABLE_EVENT_ACTIONS.TableRLSEnabled,
      patterns: [
        /ALTER\s+TABLE\s+(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>[\w"`]+).*?ENABLE\s+ROW\s+LEVEL\s+SECURITY/i,
        /ALTER\s+TABLE\s+(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>[\w"`]+).*?ENABLE\s+RLS/i,
      ],
    },
  ]

  private cleanIdentifier(identifier?: string) {
    return identifier?.replace(/["`']/g, '').replace(/\.$/, '')
  }

  private match(sql: string): TableEventDetails | null {
    for (const { type, patterns } of SQLEventParser.DETECTORS) {
      for (const pattern of patterns) {
        const match = sql.match(pattern)
        if (match?.groups) {
          return {
            type,
            schema: this.cleanIdentifier(match.groups.schema),
            tableName: this.cleanIdentifier(match.groups.table ?? match.groups.object),
          }
        }
      }
    }
    return null
  }

  private splitStatements(sql: string): string[] {
    // Regex matches:
    // - single quotes ('...') with escapes
    // - double quotes ("...")
    // - dollar-quoted blocks ($$...$$ or $tag$...$tag$)
    // - semicolons
    // - everything else
    const tokens =
      sql.match(
        /'([^']|'')*'|"([^"]|"")*"|\$[a-zA-Z0-9_]*\$[\s\S]*?\$[a-zA-Z0-9_]*\$|;|[^'"$;]+/g
      ) || []

    const statements: string[] = []
    let current = ''

    for (const token of tokens) {
      if (token === ';') {
        if (current.trim()) statements.push(current.trim())
        current = ''
      } else {
        current += token
      }
    }

    if (current.trim()) {
      statements.push(current.trim())
    }

    return statements
  }

  private deduplicate(events: TableEventDetails[]): TableEventDetails[] {
    const seen = new Set<string>()
    return events.filter((e) => {
      const key = `${e.type}:${e.schema || ''}:${e.tableName || ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private removeComments(sql: string): string {
    return sql
      .replace(/--.*?$/gm, '') // line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
  }

  getTableEvents(sql: string): TableEventDetails[] {
    const statements = this.splitStatements(this.removeComments(sql))
    const results: TableEventDetails[] = []

    for (const stmt of statements) {
      const event = this.match(stmt)
      if (event) results.push(event)
    }

    return this.deduplicate(results)
  }
}

export const sqlEventParser = new SQLEventParser()
