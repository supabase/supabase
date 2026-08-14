import { LOCAL_STORAGE_KEYS } from 'common'
import { afterEach, describe, expect, it } from 'vitest'

import { ExplorerQueryTabCoordinator } from './ExplorerQueryTabCoordinator'
import { explorerQueryState } from '@/state/explorer-query'
import { createTabsState, TabsStateContext } from '@/state/tabs'
import { customRender } from '@/tests/lib/custom-render'

const QUERY_ID = 'pagehide-query'

afterEach(() => {
  explorerQueryState.removeDraft({ id: QUERY_ID, projectRef: 'default' })
})

describe('ExplorerQueryTabCoordinator', () => {
  it('flushes pending query edits when the page is hidden', () => {
    const key = LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS('default')
    explorerQueryState.createDraft({ id: QUERY_ID, projectRef: 'default' })
    explorerQueryState.updateDraft({ id: QUERY_ID, sql: 'select 1' })

    customRender(
      <TabsStateContext.Provider value={createTabsState('default')}>
        <ExplorerQueryTabCoordinator />
      </TabsStateContext.Provider>
    )
    window.dispatchEvent(new Event('pagehide'))

    expect(JSON.parse(localStorage.getItem(key) ?? '{}')[QUERY_ID].sql).toBe('select 1')
  })
})
