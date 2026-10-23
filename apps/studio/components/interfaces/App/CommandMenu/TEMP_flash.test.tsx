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


it('TEMP flash', async () => {
  mockUseSelectedProjectQuery.mockReturnValue({ data: { id: 1, ref: 'default', name: 'default', connectionString: 'x' } })
  addAPIMock({ method: 'post', path: '/platform/pg-meta/:ref/query', response: async ({ request }) => {
    const { query } = (await request.json()) as { query: string }
    if (query.includes('colors')) {
      await new Promise((r) => setTimeout(r, 400))
      return HttpResponse.json([{ tables: [{ id: 9, schema: 'public', name: 'colors', rls_enabled: false, policy_count: 0 }] }])
    }
    return HttpResponse.json([SEARCH_RESULT])
  } })
  customRender(<CommandMenuHarness />)
  const input = screen.getByRole('textbox', { name: 'Search' })
  await userEvent.type(input, 'blog_posts')
  await screen.findByText('public.blog_posts')
  const t0 = Date.now()
  const log: string[] = []
  const iv = setInterval(() => {
    const names = screen.queryAllByText(/^(public|blog)\./).map((e) => e.textContent)
    log.push(`${Date.now() - t0}ms input="${(input as HTMLInputElement).value}" shown=${JSON.stringify(names)}`)
  }, 100)
  await userEvent.clear(input)
  await userEvent.type(input, 'colors')
  await screen.findByText('public.colors', {}, { timeout: 3000 })
  log.push(`${Date.now() - t0}ms colors results arrived`)
  clearInterval(iv)
  // Refinement: blog -> blog_p keeps matching rows while the new search is in flight
  await userEvent.clear(input)
  await userEvent.type(input, 'blog')
  await screen.findByText('public.blog_posts')
  await userEvent.type(input, '_posts_a')
  log.push(`refine to "${(input as HTMLInputElement).value}" immediately shows=${JSON.stringify(screen.queryAllByText(/^(public|blog)\./).map((e) => e.textContent))}`)
  console.log(log.join('\n'))
}, 15000)
