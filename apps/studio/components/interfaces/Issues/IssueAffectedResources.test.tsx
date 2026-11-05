import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { IssueAffectedResources } from './IssueAffectedResources'
import { lintsToIssues } from '@/data/issues/lint-to-issue'
import type { Lint } from '@/data/lint/lint-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const makeLint = (overrides: Partial<Lint> = {}): Lint => ({
  name: 'unused_index',
  title: 'Unused Index',
  level: 'INFO',
  facing: 'EXTERNAL',
  categories: ['PERFORMANCE'],
  description: 'Detects unused indexes.',
  detail: 'Table `public.posts` has an unused index `posts_slug_idx`.',
  remediation: 'https://example.com/fix',
  metadata: { type: 'table', schema: 'public', name: 'posts' },
  cache_key: 'unused_index_public_posts',
  ...overrides,
})

const makeLintsOnTables = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    makeLint({
      cache_key: `lint-${index}`,
      detail: `Table \`public.table_${index}\` has an unused index \`index_${index}\`.`,
      metadata: { type: 'table', schema: 'public', name: `table_${index}` },
    })
  )

// Body rows only, without the column headings
const getFindingRows = () => within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row')

const renderIssue = (lints: Lint[]) => {
  const [issue] = lintsToIssues(lints)
  customRender(<IssueAffectedResources issue={issue} />)
}

describe('IssueAffectedResources', () => {
  it('shows a single finding and its fix without a click, since its detail can name what the row does not', () => {
    renderIssue([makeLint()])

    // The index name is only in the finding's detail
    expect(screen.getByText('posts_slug_idx')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View index' })).toBeInTheDocument()
    expect(getFindingRows()).toHaveLength(1)
  })

  it('puts each finding in a row with its own detail and fix, because each needs its own change', () => {
    renderIssue(makeLintsOnTables(2))

    expect(screen.getByRole('heading', { name: 'Affected resources' })).toBeInTheDocument()
    expect(getFindingRows()).toHaveLength(2)
    expect(screen.getByText('index_1')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'View index' })).toHaveLength(2)
  })

  it('keeps a long list short until asked, so one check cannot bury the rest of the page', async () => {
    renderIssue(makeLintsOnTables(7))

    expect(getFindingRows()).toHaveLength(5)

    await userEvent.click(screen.getByRole('button', { name: 'Show 2 more' }))

    expect(getFindingRows()).toHaveLength(7)
  })

  it('still offers the GraphQL revoke with its confirmation, the one fix that changes the database', async () => {
    // The confirmation reads the project for its connection string
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: { ref: 'default', connectionString: '' } as never,
    })
    renderIssue([
      makeLint({
        // Not in the API's lint name type yet
        name: 'pg_graphql_anon_table_exposed' as Lint['name'],
        title: 'GraphQL exposed',
        categories: ['SECURITY'],
      }),
    ])

    await userEvent.click(screen.getByRole('button', { name: 'Remove access for anonymous users' }))

    expect(await screen.findByRole('button', { name: 'Remove access' })).toBeInTheDocument()
  })
})
