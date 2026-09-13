import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EditorBaseLayout } from './EditorBaseLayout'

const { mockTabsState, mockEditorType } = vi.hoisted(() => ({
  mockTabsState: {
    activeTab: 'r-1',
    openTabs: ['r-1'],
    tabsMap: {
      'r-1': {
        id: 'r-1',
        type: 'r',
        label: 'routines',
        metadata: {
          name: 'tasks',
          schema: 'public',
          tableId: 1,
        },
      },
    },
  } as any,
  mockEditorType: vi.fn(),
}))

vi.mock('common', () => ({
  useParams: () => ({ ref: 'default' }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/project/default/editor/1',
}))

vi.mock('@/state/tabs', () => ({
  useTabsStateSnapshot: () => mockTabsState,
}))

vi.mock('ui', () => ({
  cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
}))

vi.mock('../ProjectLayout', () => ({
  ProjectLayoutWithAuth: ({
    browserTitle,
    children,
  }: {
    browserTitle?: Record<string, string>
    children: ReactNode
  }) => (
    <div>
      <div data-testid="browser-title">{JSON.stringify(browserTitle ?? {})}</div>
      {children}
    </div>
  ),
}))

vi.mock('../Tabs/CollapseButton', () => ({
  CollapseButton: () => null,
}))

vi.mock('../Tabs/Tabs', () => ({
  EditorTabs: () => null,
}))

vi.mock('./EditorsLayout.hooks', () => ({
  useEditorType: () => mockEditorType(),
}))

describe('EditorBaseLayout browser title', () => {
  beforeEach(() => {
    mockEditorType.mockReturnValue('table')
    mockTabsState.activeTab = 'r-1'
    mockTabsState.openTabs = ['r-1']
    mockTabsState.tabsMap = {
      'r-1': {
        id: 'r-1',
        type: 'r',
        label: 'routines',
        metadata: {
          name: 'tasks',
          schema: 'public',
          tableId: 1,
        },
      },
    }
  })

  it('prefers the live tab label over stale metadata when composing the title entity', () => {
    render(
      <EditorBaseLayout title="Tables" product="Table Editor">
        <div>Page content</div>
      </EditorBaseLayout>
    )

    expect(JSON.parse(screen.getByTestId('browser-title').textContent ?? '{}')).toEqual({
      section: 'Tables',
      entity: 'routines',
    })
  })

  it('falls back to metadata when a tab does not have a label yet', () => {
    mockTabsState.tabsMap['r-1'].label = undefined

    render(
      <EditorBaseLayout title="Tables" product="Table Editor">
        <div>Page content</div>
      </EditorBaseLayout>
    )

    expect(JSON.parse(screen.getByTestId('browser-title').textContent ?? '{}')).toEqual({
      section: 'Tables',
      entity: 'tasks',
    })
  })
})
