import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ExplorerNavDatabase } from './ExplorerNavDatabase'
import { ExplorerNavSchema } from './ExplorerNavSchema'
import type { SchemasData } from '@/data/database/schemas-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const openSchemaVisualizer = vi.fn()
vi.mock('@/components/interfaces/Explorer/hooks', () => ({
  useCreateChat: () => ({}),
  useCreateNotebook: () => ({}),
  useOpenSchemaVisualizer: () => ({ openSchemaVisualizer }),
}))
vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: { ref: 'default', connectionString: 'postgres://' } }),
  useIsHighAvailability: () => false,
}))

const schemas: SchemasData = [
  { id: 1, name: 'public', owner: 'postgres', comment: null },
  { id: 2, name: 'analytics', owner: 'postgres', comment: null },
  { id: 3, name: 'auth', owner: 'supabase_admin', comment: null },
  { id: 4, name: 'storage', owner: 'supabase_admin', comment: null },
  { id: 5, name: 'supabase_migrations', owner: 'postgres', comment: null },
  { id: 6, name: 'graphql_public', owner: 'supabase_admin', comment: null },
  { id: 7, name: '_realtime', owner: 'supabase_admin', comment: null },
]

function Navigation({ onSelectTables }: { onSelectTables: () => void }) {
  const [schema, setSchema] = useState<string>()
  if (schema)
    return (
      <ExplorerNavSchema
        schema={schema}
        onBack={() => setSchema(undefined)}
        onSelectTables={onSelectTables}
      />
    )
  return <ExplorerNavDatabase onBack={vi.fn()} onSelectSchema={setSchema} />
}

describe('Explorer database schema navigation', () => {
  it('lists schemas before objects, filters with Escape, and opens schema actions by keyboard', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json<SchemasData>(schemas),
    })
    const user = userEvent.setup()
    const onSelectTables = vi.fn()
    customRender(<Navigation onSelectTables={onSelectTables} />)
    await screen.findByRole('button', { name: 'public' })
    expect(
      within(screen.getByRole('navigation'))
        .getAllByRole('button')
        .map((button) => button.textContent)
    ).toEqual(['analytics', 'public'])
    expect(screen.queryByRole('button', { name: 'Tables' })).not.toBeInTheDocument()
    const search = screen.getByRole('textbox', { name: 'Search schemas' })
    await user.type(search, 'ANALYTICS')
    expect(screen.queryByRole('button', { name: 'public' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(search).toHaveValue('')
    await user.click(screen.getByRole('button', { name: 'analytics' }))
    const panel = screen.getByRole('group', { name: 'analytics' })
    const actions = within(within(panel).getByRole('navigation')).getAllByRole('button')
    expect(actions.map((button) => button.textContent)).toEqual(['Schema Visualizer', 'Tables'])
    actions[0].focus()
    await user.keyboard('{Enter}')
    expect(openSchemaVisualizer).toHaveBeenCalledWith('analytics')
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onSelectTables).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByRole('button', { name: 'public' })).toBeInTheDocument()
  })

  it('shows an empty search result', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json<SchemasData>(schemas),
    })
    customRender(<ExplorerNavDatabase onBack={vi.fn()} onSelectSchema={vi.fn()} />)
    await screen.findByRole('button', { name: 'public' })
    await userEvent.type(screen.getByRole('textbox', { name: 'Search schemas' }), 'missing')
    expect(screen.getByText('No schemas found')).toBeInTheDocument()
  })
})
