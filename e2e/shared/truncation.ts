// Above this many skipped pages, messages show only the count.
const MAX_LISTED_PAGES = 5

export type Truncation = {
  label: string
  limit: number
  truncated: string[]
}

function listPages(pages: string[]): string {
  return pages.length <= MAX_LISTED_PAGES ? `: ${pages.join(', ')}` : ''
}

// One line, so GitHub renders it as a single annotation.
export function formatAnnotation({ label, limit, truncated }: Truncation): string {
  return (
    `${truncated.length} in-scope ${label} page(s) were not tested because the limit is ${limit}` +
    `${listPages(truncated)}. See the job summary for the full list.`
  )
}

export function formatJobSummary({ label, limit, truncated }: Truncation): string {
  return [
    '### Some pages were not tested',
    '',
    `${truncated.length} in-scope ${label} page(s) are over the ${limit}-page limit, so no test covers them.`,
    '',
    '<details>',
    `<summary>Pages not tested (${truncated.length})</summary>`,
    '',
    ...truncated.map((page) => `- ${page}`),
    '',
    '</details>',
    '',
    'To test them, run the workflow manually with this `page_paths` value. Manual runs have no page limit.',
    '',
    '```',
    truncated.join(','),
    '```',
    '',
  ].join('\n')
}

export function formatLog({ truncated }: Truncation): string {
  return ['Pages not tested:', ...truncated.map((page) => `  ${page}`)].join('\n')
}

export function formatLocalWarning({ label, limit, truncated }: Truncation): string {
  return (
    `Warning: ${truncated.length} in-scope ${label} page(s) are over the ${limit}-page limit and ` +
    `were not tested${listPages(truncated)}. ` +
    'Pass them in the page-paths env var, or run the :all script, to test them.'
  )
}
