import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ExplorerSchemaPage from '@/pages/project/[ref]/explorer/schema'
import { createTabsState, TabsStateContext } from '@/state/tabs'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/components/interfaces/Database/Schemas/SchemaGraph', () => ({
  SchemaGraph: () => <div>Schema graph</div>,
}))
vi.mock('@/components/layouts/DefaultLayout', () => ({ DefaultLayout: () => null }))
vi.mock('@/components/layouts/ExplorerLayout/ExplorerLayout', () => ({
  ExplorerLayout: () => null,
}))

describe('Explorer schema page', () => {
  it('registers direct schema visits and reactivates an existing schema tab', () => {
    const store = createTabsState('default')
    for (const schema of ['public', 'sales & reports', 'public']) {
      const { unmount } = customRender(
        <TabsStateContext.Provider value={store}>
          <ExplorerSchemaPage dehydratedState={undefined} />
        </TabsStateContext.Provider>,
        { nuqs: { searchParams: { schema } } }
      )
      expect(screen.getByText('Schema graph')).toBeInTheDocument()
      expect(store.activeTab).toBe(`schema-${schema}`)
      expect(store.tabsMap[`schema-${schema}`]).toMatchObject({
        type: 'schema',
        label: `${schema} · Schema Visualizer`,
        metadata: { schema },
        isPreview: false,
      })
      unmount()
    }
    expect(store.openTabs).toEqual(['schema-public', 'schema-sales & reports'])
  })
})
