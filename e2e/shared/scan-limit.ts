// Above this many unscanned pages, messages show only the count.
const MAX_LISTED_PAGES = 5

// In-scope pages over a check's page limit, so they don't get that check.
export type UnscannedPages = {
  // The check the pages don't get, such as 'accessibility scan'.
  check: string
  limit: number
  pages: string[]
}

// The suite label, such as 'docs', names the pages in messages.
export type UnscannedPagesWarning = UnscannedPages & { label: string }

function listPages(pages: string[]): string {
  return pages.length <= MAX_LISTED_PAGES ? `: ${pages.join(', ')}` : ''
}

// One line, so GitHub renders it as a single annotation.
export function formatAnnotation({ label, check, limit, pages }: UnscannedPagesWarning): string {
  return (
    `${pages.length} in-scope ${label} page(s) did not get the ${check} because the limit is ${limit}` +
    `${listPages(pages)}. See the job summary for the full list.`
  )
}

export function formatJobSummary({ label, check, limit, pages }: UnscannedPagesWarning): string {
  return [
    `### Some pages did not get the ${check}`,
    '',
    `${pages.length} in-scope ${label} page(s) are over the ${limit}-page ${check} limit. The link check runs on them.`,
    '',
    '<details>',
    `<summary>Pages without the ${check} (${pages.length})</summary>`,
    '',
    ...pages.map((page) => `- ${page}`),
    '',
    '</details>',
    '',
    `To run the ${check} on them, run the workflow manually with this \`page_paths\` value. Set \`base_url\` to this pull request's preview, because production doesn't have its changes. Manual runs have no page limit.`,
    '',
    '```',
    pages.join(','),
    '```',
    '',
  ].join('\n')
}

export function formatLog({ check, pages }: UnscannedPagesWarning): string {
  return [`Pages without the ${check}:`, ...pages.map((page) => `  ${page}`)].join('\n')
}

export function formatLocalWarning(
  { label, check, limit, pages }: UnscannedPagesWarning,
  pagePathsEnv: string
): string {
  return (
    `Warning: ${pages.length} in-scope ${label} page(s) are over the ${limit}-page ${check} limit and ` +
    `won't get it${listPages(pages)}. ` +
    `To test them, set ${pagePathsEnv} to them or run \`pnpm e2e:${label}:all\`.`
  )
}
