/**
 * Shared SQL parsing helpers used by both the merger and the resource extractor.
 *
 * Splitting is line-based with awareness of `$$ ... $$` dollar quoted blocks so a
 * semicolon inside a function body does not end a statement. Line comments are
 * stripped before dollar-quote tracking — otherwise a comment containing `$$`
 * would flip the parser state and swallow the rest of the file.
 */

export function splitSqlStatements(content: string): string[] {
  const statements: string[] = []
  let currentStatement = ''
  let inDollarBlock = false

  for (const rawLine of content.split('\n')) {
    const lineWithoutComment = stripLineComment(rawLine)
    const dollarDelimiterCount = lineWithoutComment.match(/\$\$/g)?.length ?? 0

    if (dollarDelimiterCount % 2 === 1) {
      inDollarBlock = !inDollarBlock
    }

    currentStatement += `${rawLine}\n`

    if (lineWithoutComment.trim().endsWith(';') && !inDollarBlock) {
      statements.push(currentStatement.trim())
      currentStatement = ''
    }
  }

  if (currentStatement.trim()) {
    statements.push(currentStatement.trim())
  }

  return statements
}

function stripLineComment(line: string): string {
  let inString = false

  for (let index = 0; index < line.length - 1; index++) {
    const char = line[index]

    if (char === "'") {
      inString = !inString
      continue
    }

    if (!inString && char === '-' && line[index + 1] === '-') {
      return line.slice(0, index)
    }
  }

  return line
}

export function matchIdentifier(statement: string, regex: RegExp): string | null {
  const match = statement.match(regex)
  if (!match) return null

  return match[1] ?? match[2] ?? null
}

export interface QualifiedIdentifier {
  schema: string
  name: string
}

export function matchQualifiedIdentifier(
  statement: string,
  regex: RegExp,
  defaultSchema = 'public'
): QualifiedIdentifier | null {
  const match = statement.match(regex)
  if (!match) return null

  const name = match[3] ?? match[4]
  if (!name) return null

  return {
    schema: match[1] ?? match[2] ?? defaultSchema,
    name,
  }
}

export function splitSqlValueList(valueList: string): string[] {
  const values: string[] = []
  let currentValue = ''
  let inString = false

  for (let index = 0; index < valueList.length; index++) {
    const char = valueList[index]
    const nextChar = valueList[index + 1]

    currentValue += char

    if (char === "'" && nextChar === "'") {
      currentValue += nextChar
      index++
      continue
    }

    if (char === "'") {
      inString = !inString
      continue
    }

    if (char === ',' && !inString) {
      values.push(currentValue.slice(0, -1).trim())
      currentValue = ''
    }
  }

  if (currentValue.trim()) {
    values.push(currentValue.trim())
  }

  return values
}
