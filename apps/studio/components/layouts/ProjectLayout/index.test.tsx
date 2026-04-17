import { render, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MobileSheetProvider } from '../Navigation/NavigationBar/MobileSheetContext'
import { ProjectLayout } from './index'
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

const {
  mockAddBanner,
  mockDismissBanner,
  mockProjectState,
  mockResourceWarningsState,
  mockBannerDismissedState,
} = vi.hoisted(() => ({
  mockAddBanner: vi.fn(),
  mockDismissBanner: vi.fn(),
  mockProjectState: {
    current: {
      ref: 'default',
      name: 'Project 1',
      status: 'ACTIVE_HEALTHY',
      postgrestStatus: 'ONLINE',
      infra_compute_size: undefined as string | undefined,
    },
  },
  mockResourceWarningsState: { current: undefined as any[] | undefined },
  mockBannerDismissedState: { current: false },
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
  IS_PLATFORM: false,
  LOCAL_STORAGE_KEYS: {
    FREE_MICRO_UPGRADE_BANNER_DISMISSED: (ref: string) =>
      `free-micro-upgrade-banner-dismissed-${ref}`,
  },
  isFeatureEnabled: () => false,
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    create: (Component: any) => Component,
  },
}))

vi.mock('ui', () => ({
  cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
  CommandInput_Shadcn_: { displayName: 'CommandInput' },
  Command_Shadcn_: { displayName: 'Command' },
  CommandGroup_Shadcn_: { displayName: 'CommandGroup' },
  CommandItem_Shadcn_: { displayName: 'CommandItem' },
  CommandList_Shadcn_: { displayName: 'CommandList' },
  LogoLoader: () => <div data-testid="logo-loader" />,
  ResizableHandle: (props: any) => <div {...props} />,
  ResizablePanel: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  ResizablePanelGroup: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Sidebar: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SidebarContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SidebarFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SidebarGroup: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SidebarMenu: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SidebarMenuButton: (props: any) => <div {...props} />,
  SidebarMenuItem: (props: any) => <div {...props} />,
  useIsMobile: () => false,
  usePanelRef: () => undefined,
  useSidebar: () => ({ setOpen: vi.fn() }),
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
vi.mock('./PauseFailedState', () => ({ PauseFailedState: () => null }))
vi.mock('./PausingState', () => ({ PausingState: () => null }))
vi.mock('./ProductMenuBar', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('./ResizingState', () => ({ ResizingState: () => null }))
vi.mock('./RestartingState', () => ({ default: () => null }))
vi.mock('./RestoreFailedState', () => ({ RestoreFailedState: () => null }))
vi.mock('./RestoringState', () => ({ RestoringState: () => null }))
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

vi.mock('@/hooks/misc/useLocalStorage', () => ({
  useLocalStorageQuery: () => [mockBannerDismissedState.current, vi.fn()],
}))

vi.mock('@/components/ui/BannerStack/BannerStackProvider', () => ({
  BANNER_ID: { FREE_MICRO_UPGRADE: 'free-micro-upgrade-banner' },
  useBannerStack: () => ({
    addBanner: mockAddBanner,
    dismissBanner: mockDismissBanner,
    banners: [],
  }),
}))

vi.mock('@/components/ui/BannerStack/Banners/BannerFreeMicroUpgrade', () => ({
  BannerFreeMicroUpgrade: () => null,
}))

vi.mock('@/data/usage/resource-warnings-query', () => ({
  useResourceWarningsQuery: () => ({ data: mockResourceWarningsState.current }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({
    data: { name: 'Organization 1', slug: 'org-1' },
  }),
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: mockProjectState.current }),
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

const renderLayout = () =>
  render(
    <MobileSheetProvider>
      <ProjectLayout product="Database" isBlocking={false}>
        <div />
      </ProjectLayout>
    </MobileSheetProvider>
  )

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
      <MobileSheetProvider>
        <ProjectLayout browserTitle={{ section: 'Settings' }} product="Settings" isBlocking={false}>
          <div>Page Content</div>
        </ProjectLayout>
      </MobileSheetProvider>
    )

    await waitFor(() => {
      expect(document.title).toBe(
        ['Settings', 'Project 1', 'Organization 1', 'Supabase'].join(STUDIO_PAGE_TITLE_SEPARATOR)
      )
    })
  })

  it('prefers entity-first browserTitle metadata when provided', async () => {
    render(
      <MobileSheetProvider>
        <ProjectLayout
          product="Database"
          browserTitle={{ entity: 'users', section: 'Tables' }}
          isBlocking={false}
        >
          <div>Page Content</div>
        </ProjectLayout>
      </MobileSheetProvider>
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

describe('FREE_MICRO_UPGRADE banner', () => {
  beforeEach(() => {
    mockRouter.pathname = '/project/[ref]'
    mockRouter.asPath = '/project/default'
    mockProjectState.current = {
      ref: 'default',
      name: 'Project 1',
      status: 'ACTIVE_HEALTHY',
      postgrestStatus: 'ONLINE',
      infra_compute_size: 'nano',
    }
    mockResourceWarningsState.current = [
      {
        project: 'default',
        cpu_exhaustion: true,
        memory_and_swap_exhaustion: false,
        disk_space_exhaustion: false,
      },
    ]
    mockBannerDismissedState.current = false
  })

  afterEach(() => {
    vi.clearAllMocks()
    mockRouter.pathname = '/project/[ref]/observability/query-performance'
    mockRouter.asPath = '/project/default/observability/query-performance'
    mockProjectState.current = {
      ref: 'default',
      name: 'Project 1',
      status: 'ACTIVE_HEALTHY',
      postgrestStatus: 'ONLINE',
      infra_compute_size: undefined,
    }
    mockResourceWarningsState.current = undefined
    mockBannerDismissedState.current = false
  })

  it('calls addBanner when project is nano and compute is near exhaustion', async () => {
    renderLayout()

    await waitFor(() => {
      expect(mockAddBanner).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'free-micro-upgrade-banner' })
      )
    })
  })

  it('calls dismissBanner when banner was previously dismissed', async () => {
    mockBannerDismissedState.current = true

    renderLayout()

    await waitFor(() => {
      expect(mockDismissBanner).toHaveBeenCalledWith('free-micro-upgrade-banner')
    })
    expect(mockAddBanner).not.toHaveBeenCalled()
  })

  it('calls dismissBanner when compute warnings are cleared', async () => {
    mockResourceWarningsState.current = [
      {
        project: 'default',
        cpu_exhaustion: false,
        memory_and_swap_exhaustion: false,
        disk_space_exhaustion: false,
      },
    ]

    renderLayout()

    await waitFor(() => {
      expect(mockDismissBanner).toHaveBeenCalledWith('free-micro-upgrade-banner')
    })
    expect(mockAddBanner).not.toHaveBeenCalled()
  })

  it('calls dismissBanner when project is not nano compute', async () => {
    mockProjectState.current = { ...mockProjectState.current, infra_compute_size: 'micro' }

    renderLayout()

    await waitFor(() => {
      expect(mockDismissBanner).toHaveBeenCalledWith('free-micro-upgrade-banner')
    })
    expect(mockAddBanner).not.toHaveBeenCalled()
  })
})
