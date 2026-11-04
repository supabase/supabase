import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { useEffect, useState } from 'react'
import {
  CommandHeader,
  CommandMenuInput,
  CommandMenuList,
  CommandWrapper,
  PageType,
  useCommands,
  usePageComponent,
  useRegisterPage,
  useSetCommandMenuOpen,
  useSetPage,
  useSetQuery,
} from 'ui-patterns/CommandMenu'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ENTITY_SEARCH_DEBOUNCE_MS } from './DatabaseEntitySearch.utils'
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
  policies: [
    {
      id: 201,
      name: 'Authors can edit their posts',
      command: 'UPDATE',
      schema: 'public',
      table: 'blog_posts',
      table_id: 101,
    },
    {
      id: 202,
      name: 'Anyone can read archived posts',
      command: 'SELECT',
      schema: 'blog',
      table: 'blog_posts_archive',
      table_id: 102,
    },
  ],
  triggers: [
    {
      id: 401,
      name: 'audit_blog_changes',
      activation: 'AFTER',
      events: ['INSERT', 'UPDATE'],
      schema: 'public',
      table: 'blog_posts',
      table_id: 101,
      matched_function: null,
    },
    {
      id: 402,
      name: 'set_updated_at',
      activation: 'BEFORE',
      events: ['UPDATE'],
      schema: 'blog',
      table: 'blog_posts_archive',
      table_id: 102,
      matched_function: null,
    },
    {
      id: 403,
      name: 'fill_audit_fields',
      activation: 'BEFORE',
      events: ['INSERT'],
      schema: 'public',
      table: 'comments',
      table_id: 103,
      matched_function: 'set_audit_fields',
    },
  ],
  functions: [
    { id: 301, schema: 'public', name: 'get_blog_post', type: 'function', args: 'id bigint' },
    { id: 302, schema: 'blog', name: 'archive_blog_posts', type: 'procedure', args: '' },
    { id: 303, schema: 'public', name: 'touch_blog_post', type: 'function', args: '' },
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

  it('lists matching policies with their command and table, linking to the policy editor', async () => {
    customRender(<CommandMenuHarness />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'blog_posts')

    const section = await screen.findByRole('region', { name: 'Policies' })
    expect(section).toHaveTextContent('Authors can edit their posts')
    expect(section).toHaveTextContent('UPDATE on public.blog_posts')
    // The policies page lists policies per schema, so the link has to carry it
    expect(section).toHaveTextContent('/project/default/database/policies?schema=public&edit=201')
    expect(section).toHaveTextContent('/project/default/database/policies?schema=blog&edit=202')
  })

  it('lists matching triggers with their timing and table, linking to the trigger editor', async () => {
    customRender(<CommandMenuHarness />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'blog_posts')

    const section = await screen.findByRole('region', { name: 'Triggers' })
    expect(section).toHaveTextContent('audit_blog_changes')
    expect(section).toHaveTextContent('AFTER INSERT OR UPDATE on public.blog_posts')
    expect(section).toHaveTextContent('BEFORE UPDATE on blog.blog_posts_archive')
    // A trigger found through its function says which function it runs, instead of its timing
    expect(section).toHaveTextContent('fill_audit_fields')
    expect(section).toHaveTextContent('Runs set_audit_fields')
    expect(section).not.toHaveTextContent('BEFORE INSERT on public.comments')
    expect(section.textContent?.match(/Runs /g)).toHaveLength(1)
    // The triggers page lists triggers per schema, so the link has to carry it
    expect(section).toHaveTextContent(
      '/project/default/database/triggers/data?schema=public&edit=401'
    )
    expect(section).toHaveTextContent(
      '/project/default/database/triggers/data?schema=blog&edit=402'
    )
  })

  it('lists matching functions with their arguments, linking to the function editor', async () => {
    customRender(<CommandMenuHarness />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'blog_post')

    const section = await screen.findByRole('region', { name: 'Functions' })
    expect(section).toHaveTextContent('public.get_blog_post')
    expect(section).toHaveTextContent('(id bigint)')
    expect(section).toHaveTextContent('blog.archive_blog_posts')
    expect(section).toHaveTextContent('procedure')
    // Functions without parameters have no details to show
    expect(section).toHaveTextContent('public.touch_blog_post')
    expect(section).not.toHaveTextContent('()')
    // The functions page lists functions per schema, so the link has to carry it
    expect(section).toHaveTextContent('/project/default/database/functions?schema=public&edit=301')
    expect(section).toHaveTextContent('/project/default/database/functions?schema=blog&edit=302')
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
    expect(screen.queryByRole('region', { name: 'Policies' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Triggers' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Functions' })).not.toBeInTheDocument()
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

  it('keeps a trigger found through its function visible while a refined search loads', async () => {
    let requests = 0
    let resolveRefinedSearch: (() => void) | undefined
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async () => {
        requests += 1
        // Hold the refined search in flight until the test releases it
        if (requests === 2) {
          await new Promise<void>((resolve) => (resolveRefinedSearch = resolve))
        }
        return HttpResponse.json([
          {
            ...SEARCH_RESULT,
            tables: [],
            policies: [],
            functions: [],
            triggers: [SEARCH_RESULT.triggers[2]],
          },
        ])
      },
    })
    customRender(<CommandMenuHarness />)
    const input = screen.getByRole('textbox', { name: 'Search' })

    await userEvent.type(input, 'set_audit')
    expect(await screen.findByText(/Runs set_audit_fields/)).toBeInTheDocument()

    // Neither the trigger's name nor its table match the refined search, only its function
    await userEvent.type(input, '_fields')
    await waitFor(() => expect(resolveRefinedSearch).toBeDefined())
    expect(screen.getByText(/Runs set_audit_fields/)).toBeInTheDocument()

    resolveRefinedSearch?.()
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

  it.each([
    ['archive_blog_posts', 'a function'],
    ['audit_blog', 'a trigger'],
  ])(
    'lists tables, policies, triggers, then functions, even when %s matches best',
    async (search) => {
      addAPIMock({
        method: 'post',
        path: '/platform/pg-meta/:ref/query',
        response: () => HttpResponse.json([SEARCH_RESULT]),
      })
      customRender(<CommandMenuListHarness />)

      await userEvent.type(screen.getByRole('combobox'), search)

      await screen.findByText('Functions')
      const headings = screen.getAllByText(/^(Tables|Policies|Triggers|Functions)$/)
      expect(headings.map((heading) => heading.textContent)).toEqual([
        'Tables',
        'Policies',
        'Triggers',
        'Functions',
      ])
    }
  )

  it('lists functions before triggers that only match through the function they run', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () =>
        HttpResponse.json([
          {
            tables: [],
            policies: [],
            triggers: [SEARCH_RESULT.triggers[2]],
            functions: [
              { id: 304, schema: 'public', name: 'set_audit_fields', type: 'function', args: '' },
            ],
          },
        ]),
    })
    customRender(<CommandMenuListHarness />)

    await userEvent.type(screen.getByRole('combobox'), 'set_audit')

    await screen.findByText('Runs set_audit_fields')
    const headings = screen.getAllByText(/^(Tables|Policies|Triggers|Functions)$/)
    expect(headings.map((heading) => heading.textContent)).toEqual(['Functions', 'Triggers'])
  })
})

const SUB_PAGE = 'Search Database Tables'

/** Mirrors a context search sub-page: its own input, which also sets the shared query. */
const SubPageSearch = () => {
  const setQuery = useSetQuery()
  const [value, setValue] = useState('')

  return (
    <input
      aria-label="Search database tables"
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
        setQuery(event.target.value)
      }}
    />
  )
}

/** Mirrors PageSwitch, where a sub-page replaces the command list entirely. */
const SubPageHarness = () => {
  useDatabaseEntitySearchCommands()
  const setQuery = useSetQuery()
  const setOpen = useSetCommandMenuOpen()
  const setPage = useSetPage()
  const PageComponent = usePageComponent()
  const [value, setValue] = useState('')

  useRegisterPage(SUB_PAGE, { type: PageType.Component, component: SubPageSearch })
  useEffect(() => setOpen(true), [setOpen])

  if (PageComponent) return <PageComponent />

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
      <button tabIndex={0} onClick={() => setPage(SUB_PAGE)}>
        Open sub-page
      </button>
    </>
  )
}

describe('useDatabaseEntitySearchCommands on a sub-page', () => {
  let searchRequests: string[]

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
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

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not search the database while a sub-page shows its own results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const settleDebounce = () =>
      act(() => vi.advanceTimersByTimeAsync(ENTITY_SEARCH_DEBOUNCE_MS * 2))
    customRender(<SubPageHarness />)

    // Searching from the top level does reach the database
    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'blog_posts')
    await settleDebounce()
    expect(searchRequests).toHaveLength(1)

    // The sub-page runs its own search, so typing there must not send a second request
    await user.click(screen.getByRole('button', { name: 'Open sub-page' }))
    await user.type(screen.getByRole('textbox', { name: 'Search database tables' }), 'colors')
    await settleDebounce()

    expect(searchRequests).toHaveLength(1)
  })
})
