import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import type { ComponentType } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerNavTables } from './ExplorerNavTables'
import { entityQueryId } from '@/components/interfaces/Explorer/entityQuery.utils'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { EntityTypesResponse } from '@/data/entity-types/entity-types-infinite-query'
import { createTabId, createTabsState, TabsStateContext } from '@/state/tabs'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

const params = vi.hoisted(() => ({ id: undefined as string | undefined }))
vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => ({ ref: 'default', id: params.id }) }
})

const openEntityQuery = vi.fn()
const openSchemaVisualizer = vi.fn()
vi.mock('@/components/interfaces/Explorer/hooks', () => ({
  useOpenEntityQuery: () => ({ openEntityQuery }),
  useOpenSchemaVisualizer: () => ({ openSchemaVisualizer }),
}))

// The virtualizer measures a zero-height container in jsdom and renders no rows, so this
// stands in for it to exercise the rows themselves.
type Row = { schema: string; name: string }
vi.mock('@/components/ui/InfiniteList', () => ({
  LoaderForIconMenuItems: () => null,
  InfiniteListDefault: ({
    items,
    itemProps,
    ItemComponent,
  }: {
    items: Row[]
    itemProps: object
    ItemComponent: ComponentType<{ item: Row }>
  }) =>
    items.map((item) => (
      <ItemComponent key={`${item.schema}.${item.name}`} item={item} {...itemProps} />
    )),
}))

const DATABASE = [
  { schema: 'public', name: 'users', type: ENTITY_TYPE.TABLE },
  { schema: 'analytics', name: 'events', type: ENTITY_TYPE.TABLE },
  { schema: 'analytics', name: 'daily_events', type: ENTITY_TYPE.VIEW },
]

const sqlList = (query: string, column: string) =>
  [
    ...(query.match(new RegExp(`${column} in \\(([^)]*)\\)`))?.[1].matchAll(/'([^']*)'/g) ?? []),
  ].map(([, value]) => value)

/** Answers the schema list and the entity list the way the database would. */
const mockDatabase = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    // @ts-expect-error partial project response
    response: { id: 1, ref: 'default', name: 'Default Project', status: 'ACTIVE_HEALTHY' },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const key = new URL(request.url).searchParams.get('key') ?? ''
      if (!key.startsWith('entity-types')) {
        return HttpResponse.json([
          { id: 1, name: 'public' },
          { id: 2, name: 'analytics' },
        ])
      }

      const { query } = (await request.json()) as { query: string }
      const schemas = sqlList(query, 'nc.nspname')
      const types = sqlList(query, 'c.relkind')
      const search = query.match(/ilike '%([^%]*)%'/)?.[1] ?? ''
      const entities = DATABASE.filter(
        (entity) =>
          schemas.includes(entity.schema) &&
          types.includes(entity.type) &&
          entity.name.includes(search)
      )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((entity, index) => ({ ...entity, id: index + 1, comment: null, rls_enabled: true }))

      return HttpResponse.json<EntityTypesResponse[]>([
        { data: { count: entities.length, entities } },
      ])
    },
  })
}

const listedNames = () =>
  within(screen.getByRole('group', { name: 'Tables' }))
    .queryAllByRole('button')
    .filter((button) => DATABASE.some((entity) => entity.name === button.textContent))
    .map((button) => button.textContent)

describe('Explorer tables panel', () => {
  beforeEach(() => {
    localStorage.clear()
    params.id = undefined
    vi.clearAllMocks()
    mockDatabase()
  })

  it("lists the last selected schema's tables and views without drilling in, and opens one as a query", async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA('default'), 'analytics')
    params.id = entityQueryId({ schema: 'analytics', name: 'events' })
    customRender(<ExplorerNavTables />)

    expect(await screen.findByRole('button', { name: 'daily_events' })).toBeInTheDocument()
    expect(listedNames()).toEqual(['daily_events', 'events'])
    expect(screen.getByRole('button', { name: 'events' })).toHaveAttribute('aria-current', 'page')

    await userEvent.click(screen.getByRole('button', { name: 'daily_events' }))
    expect(openEntityQuery).toHaveBeenCalledWith({
      schema: 'analytics',
      name: 'daily_events',
      type: ENTITY_TYPE.VIEW,
    })
  })

  it('switches schema in place and remembers it for the Table Editor', async () => {
    const user = userEvent.setup()
    customRender(<ExplorerNavTables />)

    await screen.findByRole('button', { name: 'users' })
    await user.click(screen.getByTestId('schema-selector'))
    await user.click(await screen.findByRole('option', { name: 'analytics' }))

    expect(await screen.findByRole('button', { name: 'events' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'users' })).not.toBeInTheDocument()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA('default'))).toBe(
      'analytics'
    )
    expect(openSchemaVisualizer).not.toHaveBeenCalled()
  })

  it('takes the open schema visualizer along when switching schema, since it has no selector of its own here', async () => {
    const user = userEvent.setup()
    const tabs = createTabsState('default')
    tabs.addTab({
      id: createTabId('schema', { schema: 'public' }),
      type: 'schema',
      label: 'public · Schema Visualizer',
      metadata: { schema: 'public' },
      isPreview: false,
    })
    customRender(
      <TabsStateContext.Provider value={tabs}>
        <ExplorerNavTables />
      </TabsStateContext.Provider>
    )

    await screen.findByRole('button', { name: 'users' })
    await user.click(screen.getByTestId('schema-selector'))
    await user.click(await screen.findByRole('option', { name: 'analytics' }))

    expect(openSchemaVisualizer).toHaveBeenCalledWith('analytics')
  })

  it('narrows the list by object type and recovers when every type is hidden', async () => {
    const user = userEvent.setup()
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA('default'), 'analytics')
    customRender(<ExplorerNavTables />)

    await screen.findByRole('button', { name: 'events' })
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const viewOption = screen.getByLabelText('view').closest('div.group') as HTMLElement
    await user.click(within(viewOption).getByRole('button', { name: 'Select only' }))

    expect(await screen.findByRole('button', { name: 'daily_events' })).toBeInTheDocument()
    expect(listedNames()).toEqual(['daily_events'])

    await user.click(screen.getByLabelText('view'))
    expect(await screen.findByText('All object types are hidden')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(await screen.findByRole('button', { name: 'events' })).toBeInTheDocument()
  })

  it('searches within the schema and says when nothing matches', async () => {
    const user = userEvent.setup()
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA('default'), 'analytics')
    customRender(<ExplorerNavTables />)

    await screen.findByRole('button', { name: 'events' })
    await user.type(screen.getByRole('textbox', { name: 'Search tables' }), 'missing')
    expect(await screen.findByText('No results found')).toBeInTheDocument()
  })

  it('opens the schema visualizer for the selected schema', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA('default'), 'analytics')
    customRender(<ExplorerNavTables />)

    await userEvent.click(await screen.findByRole('button', { name: 'Visualize schema' }))
    expect(openSchemaVisualizer).toHaveBeenCalledWith('analytics')
  })
})
