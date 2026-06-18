import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import matter from 'gray-matter'
import { parse as parseToml } from 'smol-toml'

import { BANNED_ORIENTATION_HEADINGS } from '../internals/overview-page-registry'
import { parseContentListings } from '../lib/content-listings.schema'
import { deriveOverviewPagePaths } from '../lib/derive-overview-page-paths'
import { CONTENT_DIRECTORY, GUIDES_DIRECTORY } from '../lib/docs'

type LintLevel = 'error' | 'warning'

/** Flip to 'error' when all overview pages are migrated and CI should enforce. */
const OVERVIEW_LINT_LEVEL: LintLevel = 'warning'
const TROUBLESHOOTING_LINT_LEVEL: LintLevel = 'warning'

interface LintIssue {
  level: LintLevel
  file: string
  line: number
  column: number
  message: string
}

function createIssue(
  level: LintLevel,
  file: string,
  message: string,
  line = 1,
  column = 1
): LintIssue {
  return { level, file, message, line, column }
}

function toGuidesContentPath(guidesRelPath: string): string {
  return `content/guides/${guidesRelPath}`
}

function findLineColumn(raw: string, search: string): { line: number; column: number } | null {
  const lines = raw.split('\n')

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!
    const columnIndex = line.indexOf(search)

    if (columnIndex === -1) {
      continue
    }

    if (line.trim() === search || line.startsWith(search)) {
      return { line: index + 1, column: columnIndex + 1 }
    }
  }

  return null
}

function findBannedHeadingInRaw(
  raw: string
): { heading: string; line: number; column: number } | null {
  for (const heading of BANNED_ORIENTATION_HEADINGS) {
    const location = findLineColumn(raw, heading)
    if (location) {
      return { heading, ...location }
    }
  }

  return null
}

function formatSummary(errorCount: number, warningCount: number, fileCount: number): string {
  const sourceLabel = fileCount === 1 ? 'source' : 'sources'
  const lines = [`🔍 ${fileCount} ${sourceLabel} linted`]

  const diagnosticMessage = (() => {
    if (errorCount === 0 && warningCount === 0) {
      return '🟢 No errors or warnings found'
    }

    if (errorCount === 0) {
      const warningLabel = warningCount === 1 ? 'warning' : 'warnings'
      return `🟡 Found ${warningCount} ${warningLabel}`
    }

    if (warningCount === 0) {
      const errorLabel = errorCount === 1 ? 'error' : 'errors'
      return `🔴 Found ${errorCount} ${errorLabel}`
    }

    const errorLabel = errorCount === 1 ? 'error' : 'errors'
    const warningLabel = warningCount === 1 ? 'warning' : 'warnings'
    return `🔴 Found ${errorCount} ${errorLabel} and ${warningCount} ${warningLabel}`
  })()

  lines.push(diagnosticMessage)
  return lines.join('\n')
}

function formatSimple(issues: LintIssue[], fileCount: number): string {
  const diagnosticLines = issues.map((issue) => {
    const severity = issue.level === 'error' ? 'ERROR' : 'WARN'
    return `${issue.file}:${issue.line}:${issue.column}: [${severity}] ${issue.message}`
  })

  const errorCount = issues.filter((issue) => issue.level === 'error').length
  const warningCount = issues.filter((issue) => issue.level === 'warning').length
  const summary = formatSummary(errorCount, warningCount, fileCount)

  if (diagnosticLines.length === 0) {
    return `${summary}\n`
  }

  return `${diagnosticLines.join('\n')}\n\n${summary}\n`
}

function parseFrontmatter(raw: string, language: 'yaml' | 'toml' = 'yaml') {
  if (language === 'toml') {
    return matter(raw, {
      language: 'toml',
      engines: { toml: parseToml },
    })
  }

  return matter(raw)
}

async function lintOverviewPage(relPath: string): Promise<LintIssue[]> {
  const issues: LintIssue[] = []
  const contentPath = toGuidesContentPath(relPath)
  const filePath = join(GUIDES_DIRECTORY, relPath)

  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch {
    issues.push(createIssue(OVERVIEW_LINT_LEVEL, contentPath, 'Overview registry file is missing'))
    return issues
  }

  const { data } = parseFrontmatter(raw)

  try {
    parseContentListings(data.contentListings)
  } catch (error) {
    issues.push(
      createIssue(
        OVERVIEW_LINT_LEVEL,
        contentPath,
        error instanceof Error ? error.message : 'Invalid contentListings front matter'
      )
    )
  }

  if (!data.contentListings) {
    issues.push(
      createIssue(OVERVIEW_LINT_LEVEL, contentPath, 'Missing contentListings front matter')
    )
  }

  const bannedHeading = findBannedHeadingInRaw(raw)
  if (bannedHeading) {
    issues.push(
      createIssue(
        OVERVIEW_LINT_LEVEL,
        contentPath,
        `Hand-rolled orientation section "${bannedHeading.heading}" must be moved to contentListings front matter`,
        bannedHeading.line,
        bannedHeading.column
      )
    )
  }

  return issues
}

async function lintContentListingsFrontMatter(
  filePath: string
): Promise<{ checked: boolean; issues: LintIssue[] }> {
  const issues: LintIssue[] = []
  const contentPath = filePath.replace(`${CONTENT_DIRECTORY}/`, 'content/')

  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch {
    return { checked: false, issues }
  }

  const { data } = parseFrontmatter(raw, 'toml')
  if (data.contentListings === undefined) {
    return { checked: false, issues }
  }

  try {
    parseContentListings(data.contentListings)
  } catch (error) {
    issues.push(
      createIssue(
        TROUBLESHOOTING_LINT_LEVEL,
        contentPath,
        error instanceof Error ? error.message : 'Invalid contentListings front matter'
      )
    )
  }

  return { checked: true, issues }
}

async function main() {
  const overviewPages = deriveOverviewPagePaths()

  const overviewIssues = (
    await Promise.all(overviewPages.map((relPath) => lintOverviewPage(relPath)))
  ).flat()

  const { globby } = await import('globby')
  const troubleshootingFiles = await globby(['content/troubleshooting/**/*.mdx'], {
    cwd: process.cwd(),
  })
  const troubleshootingResults = await Promise.all(
    troubleshootingFiles.map((filePath) => lintContentListingsFrontMatter(filePath))
  )
  const troubleshootingIssues = troubleshootingResults.flatMap((result) => result.issues)
  const lintedTroubleshootingCount = troubleshootingResults.filter(
    (result) => result.checked
  ).length

  const issues = [...overviewIssues, ...troubleshootingIssues]
  const lintedFileCount = overviewPages.length + lintedTroubleshootingCount

  process.stdout.write(formatSimple(issues, lintedFileCount))

  const errorCount = issues.filter((issue) => issue.level === 'error').length
  if (errorCount > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
