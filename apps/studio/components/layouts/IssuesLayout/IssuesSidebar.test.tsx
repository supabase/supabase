import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { IssuesSidebar } from './IssuesSidebar'
import type { Lint } from '@/data/lint/lint-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

const lint: Lint = {
  name: 'rls_disabled_in_public',
  title: 'RLS disabled',
  level: 'ERROR',
  facing: 'EXTERNAL',
  categories: ['SECURITY'],
  description: 'Row level security is disabled',
  detail: 'Enable row level security on public.accounts',
  remediation: 'https://supabase.com/docs/guides/database/postgres/row-level-security',
  metadata: { type: 'table', schema: 'public', name: 'accounts' },
  cache_key: 'accounts-rls',
}

describe('IssuesSidebar', () => {
  it('searches, preserves filters in links, and clears an empty filtered list', async () => {
    mockProjectGrantContext({ ref: 'default' })
    addAPIMock({ method: 'get', path: '/platform/projects/:ref/run-lints', response: [lint] })
    const user = userEvent.setup()
    customRender(<IssuesSidebar />, { nuqs: { searchParams: '?category=security' } })
    const link = await screen.findByRole('link', { name: /RLS disabled/i })
    expect(link).toHaveAttribute(
      'href',
      '/project/default/issues/rls_disabled_in_public?category=security'
    )
    const search = screen.getByRole('textbox', { name: 'Search issues' })
    await user.click(search)
    await user.paste('accounts')
    await waitFor(() =>
      expect(link).toHaveAttribute(
        'href',
        '/project/default/issues/rls_disabled_in_public?category=security&q=accounts'
      )
    )
    await user.keyboard('{Escape}')
    expect(search).toHaveValue('')
    expect(search).toHaveFocus()
    await user.paste('missing table')
    expect(await screen.findByText('No issues match these filters')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(await screen.findByRole('link', { name: /RLS disabled/i })).toHaveAttribute(
      'href',
      '/project/default/issues/rls_disabled_in_public'
    )
    expect(search).toHaveValue('')
  })
})
