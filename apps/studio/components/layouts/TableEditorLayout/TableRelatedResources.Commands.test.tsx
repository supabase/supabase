import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, HttpResponse } from 'msw'
import { useEffect, useState } from 'react'
import { useCommands, useSetCommandMenuOpen, useSetQuery } from 'ui-patterns/CommandMenu'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTableRelatedResourcesCommands } from './TableRelatedResources.Commands'
import type {
  TableReferencingFunctionsData,
  TableRelatedResourcesData,
} from '@/data/database/table-related-resources-query'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const TABLE_ID = 101

vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return { ...actual, useParams: () => ({ ref: 'default', id: String(TABLE_ID) }) }
})

const { mockUseSelectedProjectQuery } = vi.hoisted(() => ({
  mockUseSelectedProjectQuery: vi.fn(),
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

const RELATED_RESOURCES: TableRelatedResourcesData = {
  policies: [
    { id: 201, name: 'Authors can edit their posts', command: 'UPDATE', schema: 'public' },
  ],
  triggers: [
    {
      id: 401,
      name: 'set_updated_at',
      activation: 'BEFORE',
      events: ['INSERT', 'UPDATE'],
      schema: 'public',
    },
  ],
}

const REFERENCING_FUNCTIONS: TableReferencingFunctionsData = {
  functions: [
    { id: 301, schema: 'public', name: 'count_blog_posts', type: 'function', args: '' },
    {
      id: 302,
      schema: 'public',
      name: 'archive_blog_posts',
      type: 'procedure',
      args: 'before date',
    },
  ],
}

const SECTION = 'Related resources'

const PROJECT: ProjectDetail = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres@localhost:5432/postgres',
  db_host: 'db.default.supabase.co',
  high_availability: false,
  id: 1,
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_hibernating: false,
  is_physical_backups_enabled: false,
  name: 'Test project',
  organization_id: 1,
  ref: 'default',
  region: 'us-east-1',
  restUrl: 'https://default.supabase.co/rest/v1',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

/** Renders the registered command sections as a plain list, driven by a text input. */
const Harness = ({ autoOpen = true }: { autoOpen?: boolean }) => {
  useTableRelatedResourcesCommands()
  const setQuery = useSetQuery()
  const setOpen = useSetCommandMenuOpen()
  const sections = useCommands()
  const [value, setValue] = useState('')

  useEffect(() => {
    if (autoOpen) setOpen(true)
  }, [autoOpen, setOpen])

  return (
    <>
      <button tabIndex={0} onClick={() => setOpen(true)}>
        Open menu
      </button>
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

describe('useTableRelatedResourcesCommands', () => {
  let relatedRequests: string[]
  let functionRequests: string[]
  let tableRequests: string[]

  beforeEach(() => {
    relatedRequests = []
    functionRequests = []
    tableRequests = []
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { id: 1, ref: 'default', name: 'default', connectionString: 'encrypted' },
    })
    // Resolving the grant's scope reads the project, which the real table
    // editor has already loaded
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: PROJECT,
    })
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = (await request.json()) as { query: string }
        if (query.includes('related_functions')) {
          functionRequests.push(query)
          return HttpResponse.json([REFERENCING_FUNCTIONS])
        }
        if (query.includes('table_policies')) {
          relatedRequests.push(query)
          return HttpResponse.json([RELATED_RESOURCES])
        }
        tableRequests.push(query)
        return HttpResponse.json([
          { entity: { id: TABLE_ID, schema: 'public', name: 'blog_posts' } },
        ])
      },
    })
  })

  it('shows the policies and triggers while the function lookup is still running', async () => {
    // Reading function bodies is orders of magnitude slower than the index
    // probes behind the policies and triggers, so it must not hold them up
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = (await request.json()) as { query: string }
        if (query.includes('related_functions')) {
          functionRequests.push(query)
          await delay('infinite')
        }
        if (query.includes('table_policies')) return HttpResponse.json([RELATED_RESOURCES])
        return HttpResponse.json([
          { entity: { id: TABLE_ID, schema: 'public', name: 'blog_posts' } },
        ])
      },
    })

    customRender(<Harness />)

    const section = await screen.findByRole('region', { name: SECTION })
    expect(section).toHaveTextContent('Authors can edit their posts')
    expect(section).toHaveTextContent('set_updated_at')
    expect(section).not.toHaveTextContent('count_blog_posts')
    expect(functionRequests).toHaveLength(1)
  })

  it('lists the policies, triggers and functions of the open table in one section', async () => {
    customRender(<Harness />)

    const section = await screen.findByRole('region', { name: SECTION })

    expect(section).toHaveTextContent('Authors can edit their posts')
    expect(section).toHaveTextContent('Policy • UPDATE')
    expect(section).toHaveTextContent('/project/default/database/policies?schema=public&edit=201')

    expect(section).toHaveTextContent('set_updated_at')
    expect(section).toHaveTextContent('Trigger • BEFORE INSERT OR UPDATE')
    // The triggers index route only redirects and drops the query string
    expect(section).toHaveTextContent(
      '/project/default/database/triggers/data?schema=public&edit=401'
    )

    expect(section).toHaveTextContent('public.count_blog_posts')
    expect(section).toHaveTextContent('Procedure (before date)')
    // A function with no arguments shows no empty parentheses
    expect(section).not.toHaveTextContent('Function ()')
    expect(section).toHaveTextContent('/project/default/database/functions?schema=public&edit=301')
  })

  it('keeps the section while the user searches, without querying again', async () => {
    customRender(<Harness />)

    await screen.findByRole('region', { name: SECTION })
    await waitFor(() => expect(functionRequests).toHaveLength(1))
    expect(relatedRequests).toHaveLength(1)

    // Narrowing happens client-side in the command menu, off the loaded data
    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'colors')

    expect(screen.getByRole('region', { name: SECTION })).toHaveTextContent('set_updated_at')
    expect(relatedRequests).toHaveLength(1)
    expect(functionRequests).toHaveLength(1)
  })

  it('does not query the database until the command menu is opened', async () => {
    customRender(<Harness autoOpen={false} />)

    // The table itself is read from the cache the table editor already fills
    await waitFor(() => expect(tableRequests).toHaveLength(1))
    expect(relatedRequests).toEqual([])
    expect(functionRequests).toEqual([])

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))

    await screen.findByRole('region', { name: SECTION })
    expect(relatedRequests).toHaveLength(1)
  })
})
