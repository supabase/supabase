import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import type { ComponentType, PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerNavTables } from './ExplorerNavTables'
import { entityQueryId } from '@/components/interfaces/Explorer/entityQuery.utils'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { EntityTypesResponse } from '@/data/entity-types/entity-types-infinite-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const openEntityQuery = vi.fn()

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ id: entityQueryId({ schema: 'public', name: 'posts' }) }),
  }
})

vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/project/[ref]/explorer/query/[id]' }),
}))

vi.mock('./ExplorerLayout.constants', () => ({
  ExplorerNavPanel: ({ children }: PropsWithChildren) => <div>{children}</div>,
  rowClassName: (isActive: boolean) => (isActive ? 'active' : 'inactive'),
}))

// The virtualizer measures a zero-height container in jsdom and renders no rows, so this
// stands in for it to exercise the row itself.
type Row = { id: number; schema: string; name: string; type: ENTITY_TYPE }

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
  }) => items.map((item) => <ItemComponent key={item.id} item={item} {...itemProps} />),
}))

vi.mock('@/components/interfaces/Explorer/hooks', () => ({
  useOpenEntityQuery: () => ({ openEntityQuery }),
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: { ref: 'abc', connectionString: 'postgres://' } }),
}))

describe('ExplorerNavTables', () => {
  beforeEach(() => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = (await request.json()) as { query: string }
        const schema = query.includes("'analytics'") ? 'analytics' : 'public'
        return HttpResponse.json<EntityTypesResponse[]>([
          {
            data: {
              count: 2,
              entities: ['users', 'posts'].map((name, index) => ({
                id: index + 1,
                schema,
                name,
                type: ENTITY_TYPE.TABLE,
                comment: null,
                rls_enabled: true,
              })),
            },
          },
        ])
      },
    })
  })

  it('marks the table backing the open query and opens the clicked one as a query', async () => {
    customRender(<ExplorerNavTables schema="public" />)

    await waitFor(() => expect(screen.getByRole('button', { name: 'users' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'posts' })).toHaveClass('active')
    expect(screen.getByRole('button', { name: 'users' })).toHaveClass('inactive')

    await userEvent.click(screen.getByRole('button', { name: 'users' }))

    expect(openEntityQuery).toHaveBeenCalledWith({
      schema: 'public',
      name: 'users',
      type: ENTITY_TYPE.TABLE,
    })
  })
})

it('opens tables from the drilled schema even when the current query is in public', async () => {
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const { query } = (await request.json()) as { query: string }
      expect(query).toContain("'analytics'")
      return HttpResponse.json<EntityTypesResponse[]>([
        {
          data: {
            count: 1,
            entities: [
              {
                id: 3,
                schema: 'analytics',
                name: 'events',
                type: ENTITY_TYPE.TABLE,
                comment: null,
                rls_enabled: true,
              },
            ],
          },
        },
      ])
    },
  })
  customRender(<ExplorerNavTables schema="analytics" />)
  await userEvent.click(await screen.findByRole('button', { name: 'events' }))
  expect(openEntityQuery).toHaveBeenCalledWith({
    schema: 'analytics',
    name: 'events',
    type: ENTITY_TYPE.TABLE,
  })
})
