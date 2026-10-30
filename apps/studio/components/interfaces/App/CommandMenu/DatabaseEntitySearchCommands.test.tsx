import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { useEffect, useState } from 'react'
import {
  CommandHeader,
  CommandMenuInput,
  CommandMenuList,
  CommandWrapper,
  useCommands,
  useSetCommandMenuOpen,
  useSetQuery,
} from 'ui-patterns/CommandMenu'
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
  })

  it('does not query the database for short searches', async () => {
    customRender(<CommandMenuHarness />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'bl')

    // Wait past the debounce window before asserting nothing was sent
    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(searchRequests).toHaveLength(0)
    expect(screen.queryByRole('region', { name: 'Tables' })).not.toBeInTheDocument()
  })

  it('does not show results from a previous project while searching another', async () => {
    let project = { id: 1, ref: 'default', name: 'default', connectionString: 'encrypted' }
    mockUseSelectedProjectQuery.mockImplementation(() => ({ data: project }))
    let resolveSecondSearch: (() => void) | undefined
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ params }) => {
        // Hold the second project's search in flight until the test releases it
        if (params.ref === 'other') {
          await new Promise<void>((resolve) => (resolveSecondSearch = resolve))
        }
        return HttpResponse.json([SEARCH_RESULT])
      },
    })

    const { rerender } = customRender(<CommandMenuHarness />)
    const input = screen.getByRole('textbox', { name: 'Search' })
    await userEvent.type(input, 'blog')
    await screen.findByRole('region', { name: 'Tables' })

    project = { id: 2, ref: 'other', name: 'other', connectionString: 'encrypted' }
    rerender(<CommandMenuHarness />)
    await userEvent.type(input, '_posts')

    await waitFor(() => expect(resolveSecondSearch).toBeDefined())
    expect(screen.queryByRole('region', { name: 'Tables' })).not.toBeInTheDocument()

    resolveSecondSearch?.()
    const section = await screen.findByRole('region', { name: 'Tables' })
    expect(section).toHaveTextContent('/project/other/editor/101?schema=public')
  })
})

/** Renders the real command menu list, to check how results interact with its empty state. */
const CommandMenuListHarness = () => {
  useDatabaseEntitySearchCommands()
  const setOpen = useSetCommandMenuOpen()

  useEffect(() => setOpen(true), [setOpen])

  return (
    <CommandWrapper>
      <CommandHeader>
        <CommandMenuInput />
      </CommandHeader>
      <CommandMenuList />
    </CommandWrapper>
  )
}

describe('useDatabaseEntitySearchCommands in the command menu list', () => {
  beforeEach(() => {
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { id: 1, ref: 'default', name: 'default', connectionString: 'encrypted' },
    })
  })

  it('hides the empty state once table results arrive', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json([SEARCH_RESULT]),
    })
    customRender(<CommandMenuListHarness />)

    await userEvent.type(screen.getByRole('combobox'), 'blog_posts')

    expect(await screen.findByText('4 policies • RLS enabled')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('No results found.')).not.toBeInTheDocument())
  })
})
