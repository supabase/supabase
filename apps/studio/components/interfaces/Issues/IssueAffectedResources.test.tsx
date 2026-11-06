import { screen } from '@testing-library/react'
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

const renderIssue = (lints: Lint[]) => {
  const [issue] = lintsToIssues(lints)
  customRender(<IssueAffectedResources issue={issue} />)
}

describe('IssueAffectedResources', () => {
  it('keeps a long list short until asked, so the properties column stays readable', async () => {
    const lints = Array.from({ length: 7 }, (_, index) =>
      makeLint({
        cache_key: `lint-${index}`,
        metadata: { type: 'table', schema: 'public', name: `table_${index}` },
      })
    )
    renderIssue(lints)

    expect(screen.getAllByRole('listitem')).toHaveLength(5)

    await userEvent.click(screen.getByRole('button', { name: 'Show 2 more' }))

    expect(screen.getAllByRole('listitem')).toHaveLength(7)
  })

  it('shows what is wrong with a resource and how to fix it when opened', async () => {
    renderIssue([makeLint()])

    // The index name is only in the finding's detail, not in the row's table name
    expect(screen.queryByText('posts_slug_idx')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /public\.posts/ }))

    expect(await screen.findByText('posts_slug_idx')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View index' })).toBeInTheDocument()
  })

  it('keeps a confirmation open when a fix asks for one, so GraphQL access can still be revoked', async () => {
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

    await userEvent.click(screen.getByRole('button', { name: /public\.posts/ }))
    await userEvent.click(
      await screen.findByRole('button', { name: 'Remove access for anonymous users' })
    )

    const confirm = await screen.findByRole('button', { name: 'Remove access' })
    await userEvent.click(screen.getByText(/Data API access removed/))

    expect(confirm).toBeInTheDocument()
  })
})
