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
  message: string
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

function hasBannedOrientationSection(content: string): string | null {
  for (const heading of BANNED_ORIENTATION_HEADINGS) {
    if (content.includes(`\n${heading}\n`) || content.startsWith(`${heading}\n`)) {
      return heading
    }
  }
  return null
}

async function lintOverviewPage(relPath: string): Promise<LintIssue[]> {
  const issues: LintIssue[] = []
  const filePath = join(GUIDES_DIRECTORY, relPath)

  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch {
    issues.push({
      level: OVERVIEW_LINT_LEVEL,
      file: relPath,
      message: 'Overview registry file is missing',
    })
    return issues
  }

  const { data, content } = parseFrontmatter(raw)

  try {
    parseContentListings(data.contentListings)
  } catch (error) {
    issues.push({
      level: OVERVIEW_LINT_LEVEL,
      file: relPath,
      message: error instanceof Error ? error.message : 'Invalid contentListings front matter',
    })
  }

  if (!data.contentListings) {
    issues.push({
      level: OVERVIEW_LINT_LEVEL,
      file: relPath,
      message: 'Missing contentListings front matter',
    })
  }

  const bannedHeading = hasBannedOrientationSection(content)
  if (bannedHeading) {
    issues.push({
      level: OVERVIEW_LINT_LEVEL,
      file: relPath,
      message: `Hand-rolled orientation section "${bannedHeading}" must be moved to contentListings front matter`,
    })
  }

  return issues
}

async function lintContentListingsFrontMatter(filePath: string): Promise<LintIssue[]> {
  const issues: LintIssue[] = []
  const relPath = filePath.replace(`${CONTENT_DIRECTORY}/`, '')

  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch {
    return issues
  }

  const { data } = parseFrontmatter(raw, 'toml')
  if (data.contentListings === undefined) {
    return issues
  }

  try {
    parseContentListings(data.contentListings)
  } catch (error) {
    issues.push({
      level: TROUBLESHOOTING_LINT_LEVEL,
      file: relPath,
      message: error instanceof Error ? error.message : 'Invalid contentListings front matter',
    })
  }

  return issues
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
  const troubleshootingIssues = (
    await Promise.all(
      troubleshootingFiles.map((filePath) => lintContentListingsFrontMatter(filePath))
    )
  ).flat()

  const issues = [...overviewIssues, ...troubleshootingIssues]

  for (const issue of issues) {
    const prefix = issue.level === 'error' ? 'error' : 'warning'
    console.log(`${prefix}: ${issue.file}: ${issue.message}`)
  }

  const errorCount = issues.filter((issue) => issue.level === 'error').length
  const warningCount = issues.filter((issue) => issue.level === 'warning').length

  console.log(
    `\nlint-content-listings: ${errorCount} error(s), ${warningCount} warning(s) across ${overviewPages.length} overview pages`
  )

  if (errorCount > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
