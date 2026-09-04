import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentType, PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ExplorerNavTables } from './ExplorerNavTables'
import { entityQueryId } from '@/components/interfaces/Explorer/entityQuery.utils'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { customRender } from '@/tests/lib/custom-render'

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

vi.mock('@/components/ui/SchemaSelector', () => ({ SchemaSelector: () => null }))

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

vi.mock('@/hooks/misc/useSchemaQueryState', () => ({
  useQuerySchemaState: () => ({ selectedSchema: 'public', setSelectedSchema: vi.fn() }),
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: { ref: 'abc', connectionString: 'postgres://' } }),
}))

vi.mock('@/data/entity-types/entity-types-infinite-query', () => ({
  useEntityTypesQuery: () => ({
    data: {
      pages: [
        {
          data: {
            entities: [
              { id: 1, schema: 'public', name: 'users', type: ENTITY_TYPE.TABLE },
              { id: 2, schema: 'public', name: 'posts', type: ENTITY_TYPE.TABLE },
            ],
          },
        },
      ],
    },
    isPending: false,
  }),
}))

describe('ExplorerNavTables', () => {
  it('marks the table backing the open query and opens the clicked one as a query', async () => {
    customRender(<ExplorerNavTables onBack={vi.fn()} />)

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
