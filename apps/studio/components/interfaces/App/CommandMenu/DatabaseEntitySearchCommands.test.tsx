import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { useEffect, useState } from 'react'
import { useCommands, useSetCommandMenuOpen, useSetQuery } from 'ui-patterns/CommandMenu'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDatabaseEntitySearchCommands } from './DatabaseEntitySearchCommands'
import type { EntitySearchData } from '@/data/database/entity-search-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const { mockUseSelectedProjectQuery } = vi.hoisted(() => ({
  mockUseSelectedProjectQuery: vi.fn(),
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

const SEARCH_RESULT: EntitySearchData = {
  tables: [
    { id: 101, schema: 'public', name: 'blog_posts', rls_enabled: true, policy_count: 4 },
    { id: 102, schema: 'blog', name: 'blog_posts_archive', rls_enabled: false, policy_count: 1 },
  ],
}

/** Renders the registered command sections as a plain list, driven by a text input. */
const CommandMenuHarness = () => {
  useDatabaseEntitySearchCommands()
  const setQuery = useSetQuery()
  const setOpen = useSetCommandMenuOpen()
  const sections = useCommands()
  const [value, setValue] = useState('')

  useEffect(() => setOpen(true), [setOpen])

  return (
    <>
      <input
        aria-label="Search"
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setQuery(event.target.value)
        }}
      />
      {sections.map((section) => (
        <section key={section.id} aria-label={section.name}>
          {section.commands.map((command) => (
            <div key={command.id}>
              <span>{command.name}</span>
              {command.badge?.()}
              {'route' in command && <span>{command.route}</span>}
            </div>
          ))}
        </section>
      ))}
    </>
  )
}

describe('useDatabaseEntitySearchCommands', () => {
  let searchRequests: string[]

  beforeEach(() => {
    searchRequests = []
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { id: 1, ref: 'default', name: 'default', connectionString: 'encrypted' },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = (await request.json()) as { query: string }
        searchRequests.push(query)
        return HttpResponse.json([SEARCH_RESULT])
      },
    })
  })

  it('lists matching tables with their policy count and RLS status', async () => {
    customRender(<CommandMenuHarness />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'blog_posts')

    const section = await screen.findByRole('region', { name: 'Tables' })
    expect(section).toHaveTextContent('public.blog_posts')
    expect(section).toHaveTextContent('4 policies • RLS enabled')
    expect(section).toHaveTextContent('blog.blog_posts_archive')
    expect(section).toHaveTextContent('1 policy • RLS disabled')
    expect(section).toHaveTextContent('/project/default/editor/101?schema=public')
  })

  it('debounces typing into a single database query', async () => {
    customRender(<CommandMenuHarness />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'blog_posts')

    await screen.findByRole('region', { name: 'Tables' })
    expect(searchRequests).toHaveLength(1)
    // The `_` is escaped so it matches literally rather than as an ILIKE wildcard
    expect(searchRequests[0]).toContain("E'%blog\\\\_posts%'")
  })

  it('does not query the database for short searches', async () => {
    customRender(<CommandMenuHarness />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'bl')

    // Wait past the debounce window before asserting nothing was sent
    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(searchRequests).toHaveLength(0)
    expect(screen.queryByRole('region', { name: 'Tables' })).not.toBeInTheDocument()
  })

  it('clears results once the search becomes too short', async () => {
    customRender(<CommandMenuHarness />)
    const input = screen.getByRole('textbox', { name: 'Search' })

    await userEvent.type(input, 'blog')
    await screen.findByRole('region', { name: 'Tables' })

    await userEvent.clear(input)
    await userEvent.type(input, 'bl')

    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Tables' })).not.toBeInTheDocument()
    )
  })

  it('does not search outside of a project', async () => {
    mockUseSelectedProjectQuery.mockReturnValue({ data: undefined })
    customRender(<CommandMenuHarness />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'blog_posts')

    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(searchRequests).toHaveLength(0)
  })
})
