// Above this many skipped pages, messages show only the count.
const MAX_LISTED_PAGES = 5

export type Truncation = {
  label: string
  // The check that skipped pages do not get, such as 'accessibility scan'.
  check: string
  limit: number
  truncated: string[]
}

function listPages(pages: string[]): string {
  return pages.length <= MAX_LISTED_PAGES ? `: ${pages.join(', ')}` : ''
}

// One line, so GitHub renders it as a single annotation.
export function formatAnnotation({ label, check, limit, truncated }: Truncation): string {
  return (
    `${truncated.length} in-scope ${label} page(s) did not get the ${check} because the limit is ${limit}` +
    `${listPages(truncated)}. See the job summary for the full list.`
  )
}

export function formatJobSummary({ label, check, limit, truncated }: Truncation): string {
  return [
    `### Some pages did not get the ${check}`,
    '',
    `${truncated.length} in-scope ${label} page(s) are over the ${limit}-page ${check} limit. The link check still ran on them.`,
    '',
    '<details>',
    `<summary>Pages without the ${check} (${truncated.length})</summary>`,
    '',
    ...truncated.map((page) => `- ${page}`),
    '',
    '</details>',
    '',
    `To run the ${check} on them, run the workflow manually with this \`page_paths\` value. Manual runs have no page limit.`,
    '',
    '```',
    truncated.join(','),
    '```',
    '',
  ].join('\n')
}

export function formatLog({ check, truncated }: Truncation): string {
  return [`Pages without the ${check}:`, ...truncated.map((page) => `  ${page}`)].join('\n')
}

export function formatLocalWarning({ label, check, limit, truncated }: Truncation): string {
  return (
    `Warning: ${truncated.length} in-scope ${label} page(s) are over the ${limit}-page ${check} limit and ` +
    `did not get it${listPages(truncated)}. ` +
    'Pass them in the page-paths env var, or run the :all script, to test them.'
  )
}
