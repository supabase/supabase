import { render, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { STUDIO_PAGE_TITLE_SEPARATOR } from '@/lib/page-title'

const { mockRouter, mockSetSelectedDatabaseId, mockSetMobileMenuOpen } = vi.hoisted(() => ({
  mockRouter: {
    pathname: '/project/[ref]/observability/query-performance',
    asPath: '/project/default/observability/query-performance',
    push: vi.fn(),
    replace: vi.fn(),
  },
  mockSetSelectedDatabaseId: vi.fn(),
  mockSetMobileMenuOpen: vi.fn(),
}))

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

vi.mock('next/head', async () => {
  const React = await import('react')

  const Head = ({ children }: { children?: ReactNode }) => {
    React.useEffect(() => {
      const titleElement = React.Children.toArray(children).find(
        (child) => React.isValidElement(child) && child.type === 'title'
      )

      if (!React.isValidElement(titleElement)) return

      const titleText = React.Children.toArray(titleElement.props.children).join('')
      document.title = titleText
    }, [children])

    return null
  }

  return { default: Head }
})

vi.mock('common', () => ({
  useParams: () => ({ ref: 'default' }),
  mergeRefs:
    (..._refs: any[]) =>
    (_value: unknown) => {},
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

vi.mock('ui', () => ({
  cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
  LogoLoader: () => <div data-testid="logo-loader" />,
  ResizableHandle: (props: any) => <div {...props} />,
  ResizablePanel: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  ResizablePanelGroup: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  useIsMobile: () => false,
  usePanelRef: () => undefined,
}))

vi.mock('ui-patterns/MobileSheetNav/MobileSheetNav', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('../editors/EditorsLayout.hooks', () => ({
  useEditorType: () => undefined,
}))

vi.mock('../MainScrollContainerContext', () => ({
  useSetMainScrollContainer: () => () => {},
}))

vi.mock('./BuildingState', () => ({ default: () => null }))
vi.mock('./ConnectingState', () => ({ default: () => null }))
vi.mock('./LoadingState', () => ({ LoadingState: () => null }))
vi.mock('./PausedState/ProjectPausedState', () => ({ ProjectPausedState: () => null }))
vi.mock('./PauseFailedState', () => ({ default: () => null }))
vi.mock('./PausingState', () => ({ default: () => null }))
vi.mock('./ProductMenuBar', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('./ResizingState', () => ({ default: () => null }))
vi.mock('./RestartingState', () => ({ default: () => null }))
vi.mock('./RestoreFailedState', () => ({ default: () => null }))
vi.mock('./RestoringState', () => ({ default: () => null }))
vi.mock('./UpgradingState', () => ({ UpgradingState: () => null }))

vi.mock('@/components/interfaces/BranchManagement/CreateBranchModal', () => ({
  CreateBranchModal: () => null,
}))
vi.mock('@/components/interfaces/ProjectAPIDocs/ProjectAPIDocs', () => ({
  ProjectAPIDocs: () => null,
}))
vi.mock('@/components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner', () => ({
  ResourceExhaustionWarningBanner: () => null,
}))

vi.mock('@/hooks/custom-content/useCustomContent', () => ({
  useCustomContent: () => ({ appTitle: 'Supabase' }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({
    data: { name: 'Organization 1', slug: 'org-1' },
  }),
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({
    data: {
      ref: 'default',
      name: 'Project 1',
      status: 'ACTIVE_HEALTHY',
      postgrestStatus: 'ONLINE',
    },
  }),
}))

vi.mock('@/hooks/misc/withAuth', () => ({
  withAuth: (Component: any) => Component,
}))

vi.mock('@/hooks/ui/useFlag', () => ({
  usePHFlag: () => undefined,
}))

vi.mock('@/state/app-state', () => ({
  useAppStateSnapshot: () => ({
    mobileMenuOpen: false,
    showSidebar: false,
    setMobileMenuOpen: mockSetMobileMenuOpen,
  }),
}))

vi.mock('@/state/database-selector', () => ({
  useDatabaseSelectorStateSnapshot: () => ({
    setSelectedDatabaseId: mockSetSelectedDatabaseId,
  }),
}))

import { ProjectLayout } from './index'

describe('ProjectLayout title', () => {
  beforeEach(() => {
    mockRouter.pathname = '/project/[ref]/observability/query-performance'
    mockRouter.asPath = '/project/default/observability/query-performance'
    document.title = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
    document.title = ''
  })

  it('sets a composed document title and deduplicates identical section/surface labels', async () => {
    render(
      <ProjectLayout title="Settings" product="Settings" isBlocking={false}>
        <div>Page Content</div>
      </ProjectLayout>
    )

    await waitFor(() => {
      expect(document.title).toBe(
        ['Settings', 'Project 1', 'Organization 1', 'Supabase'].join(STUDIO_PAGE_TITLE_SEPARATOR)
      )
    })
  })

  it('prefers entity-first browserTitle metadata when provided', async () => {
    render(
      <ProjectLayout
        title="Database"
        product="Database"
        browserTitle={{ entity: 'users', section: 'Tables' }}
        isBlocking={false}
      >
        <div>Page Content</div>
      </ProjectLayout>
    )

    await waitFor(() => {
      expect(document.title).toBe(
        ['users', 'Tables', 'Database', 'Project 1', 'Organization 1', 'Supabase'].join(
          STUDIO_PAGE_TITLE_SEPARATOR
        )
      )
    })
  })
})
