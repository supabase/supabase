import { render } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import TableEditorPage from '@/pages/project/[ref]/editor/index'

const mocks = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  history: { editor: undefined as string | undefined },
  tabs: {
    openTabs: [] as string[],
    tabsMap: {} as Record<string, { type: string; metadata?: Record<string, unknown> }>,
  },
}))

vi.mock('next/router', () => ({ useRouter: () => mocks.router }))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => ({ ref: 'default' }) }
})

vi.mock('@/hooks/misc/useDashboardHistory', () => ({
  useDashboardHistory: () => ({ history: mocks.history, isHistoryLoaded: true }),
}))

vi.mock('@/hooks/misc/useSchemaQueryState', () => ({
  useQuerySchemaState: () => ({ selectedSchema: 'public' }),
}))

vi.mock('@/state/tabs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/state/tabs')>()
  return { ...actual, useTabsStateSnapshot: () => mocks.tabs }
})

vi.mock('@/components/layouts/Tabs/NewTab', () => ({ NewTab: () => null }))
vi.mock('@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor', () => ({
  SidePanelEditor: () => null,
}))

describe('Table Editor index', () => {
  beforeEach(() => {
    mocks.router.push.mockReset()
    mocks.router.replace.mockReset()
    mocks.history.editor = undefined
    mocks.tabs.openTabs = []
    mocks.tabs.tabsMap = {}
  })

  test('replaces the index with the last opened table', () => {
    mocks.history.editor = '12'
    mocks.tabs.openTabs = ['r-12']
    mocks.tabs.tabsMap = { 'r-12': { type: 'r', metadata: { tableId: 12, schema: 'auth' } } }

    render(<TableEditorPage dehydratedState={undefined} />)

    expect(mocks.router.push).not.toHaveBeenCalled()
    expect(mocks.router.replace).toHaveBeenCalledWith(
      expect.stringMatching(/\/project\/default\/editor\/12\?schema=auth$/)
    )
  })

  test('replaces the index with the last table tab when there is no history', () => {
    mocks.tabs.openTabs = ['r-34']
    mocks.tabs.tabsMap = { 'r-34': { type: 'r', metadata: { tableId: 34, schema: 'public' } } }

    render(<TableEditorPage dehydratedState={undefined} />)

    expect(mocks.router.push).not.toHaveBeenCalled()
    expect(mocks.router.replace).toHaveBeenCalledWith(
      expect.stringMatching(/\/project\/default\/editor\/34\?schema=public$/)
    )
  })

  test('stays on the index without a table to open', () => {
    render(<TableEditorPage dehydratedState={undefined} />)

    expect(mocks.router.push).not.toHaveBeenCalled()
    expect(mocks.router.replace).not.toHaveBeenCalled()
  })
})
