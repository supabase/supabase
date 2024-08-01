'use client'

import dynamic from 'next/dynamic'
import { memo, useEffect, type PropsWithChildren, type ReactNode } from 'react'

import { cn } from 'ui'

import DefaultNavigationMenu, {
  MenuId,
} from '~/components/Navigation/NavigationMenu/NavigationMenu'
import TopNavBar from '~/components/Navigation/NavigationMenu/TopNavBar'
import { DOCS_CONTENT_CONTAINER_ID } from '~/features/ui/helpers.constants'
import { menuState, useMenuMobileOpen } from '~/hooks/useMenuState'

const Footer = dynamic(() => import('~/components/Navigation/Footer'))
const NavigationMenu = dynamic(
  () => import('~/components/Navigation/NavigationMenu/NavigationMenu')
)

const levelsData = {
  home: {
    icon: 'home',
    name: 'Home',
  },
  gettingstarted: {
    icon: 'getting-started',
    name: 'Getting Started',
  },
  database: {
    icon: 'database',
    name: 'Database',
  },
  api: {
    icon: 'rest',
    name: 'REST API',
  },
  graphql: {
    icon: 'graphql',
    name: 'GraphQL',
  },
  auth: {
    icon: 'auth',
    name: 'Auth',
  },
  functions: {
    icon: 'edge-functions',
    name: 'Edge Functions',
  },
  realtime: {
    icon: 'realtime',
    name: 'Realtime',
  },
  analytics: {
    icon: 'analytics',
    name: 'Analytics',
  },
  storage: {
    icon: 'storage',
    name: 'Storage',
  },
  ai: {
    icon: 'ai',
    name: 'AI & Vectors',
  },
  supabase_cli: {
    icon: 'reference-cli',
    name: 'Supabase CLI',
  },
  platform: {
    icon: 'platform',
    name: 'Platform',
  },
  resources: {
    icon: 'resources',
    name: 'Resources',
  },
  self_hosting: {
    icon: 'self-hosting',
    name: 'Self-Hosting',
  },
  integrations: {
    icon: 'integrations',
    name: 'Integrations',
  },
  reference_javascript_v1: {
    icon: 'reference-javascript',
    name: 'Javascript Reference v1.0',
  },
  reference_javascript_v2: {
    icon: 'reference-javascript',
    name: 'Javascript Reference v2.0',
  },
  reference_dart_v1: {
    icon: 'reference-dart',
    name: 'Dart Reference v1.0',
  },
  reference_dart_v2: {
    icon: 'reference-dart',
    name: 'Dart Reference v2.0',
  },
  reference_csharp_v0: {
    icon: 'reference-csharp',
    name: 'C# Reference v0.0',
  },
  reference_csharp_v1: {
    icon: 'reference-csharp',
    name: 'C# Reference v1.0',
  },
  reference_python_v2: {
    icon: 'reference-python',
    name: 'Python Reference v2.0',
  },
  reference_swift_v1: {
    icon: 'reference-swift',
    name: 'Swift Reference v1.0',
  },
  reference_swift_v2: {
    icon: 'reference-swift',
    name: 'Swift Reference v2.0',
  },
  reference_kotlin_v1: {
    icon: 'reference-kotlin',
    name: 'Kotlin Reference v1.0',
  },
  reference_kotlin_v2: {
    icon: 'reference-kotlin',
    name: 'Kotlin Reference v2.0',
  },
  reference_cli: {
    icon: 'reference-cli',
    name: 'CLI Reference',
  },
  reference_api: {
    icon: 'reference-api',
    name: 'Management API Reference',
  },
  reference_self_hosting_auth: {
    icon: 'reference-auth',
    name: 'Auth Server Reference',
  },
  reference_self_hosting_storage: {
    icon: 'reference-storage',
    name: 'Storage Server Reference',
  },
  reference_self_hosting_realtime: {
    icon: 'reference-realtime',
    name: 'Realtime Server Reference',
  },
  reference_self_hosting_analytics: {
    icon: 'reference-analytics',
    name: 'Analytics Server Reference',
  },
  reference_self_hosting_functions: {
    icon: 'reference-functions',
    name: 'Functions Server Reference',
  },
}

const MobileHeader = memo(function MobileHeader({ menuId }: { menuId: MenuId }) {
  const mobileMenuOpen = useMenuMobileOpen()
  const menuLevel = menuId

  return (
    <div
      className={cn(
        'lg:hidden px-3.5 border-b z-10',
        'transition-all ease-out',
        'top-0',
        mobileMenuOpen && 'absolute',
        'flex items-center',
        mobileMenuOpen ? 'gap-0' : 'gap-1'
      )}
    >
      <button
        className={cn(
          'h-8 w-8 flex group items-center justify-center mr-1',
          mobileMenuOpen && 'mt-0.5'
        )}
        onClick={() => menuState.setMenuMobileOpen(!mobileMenuOpen)}
      >
        <div
          className={cn(
            'space-y-1  cursor-pointer relative',
            mobileMenuOpen ? 'w-4 h-4' : 'w-4 h-[8px]'
          )}
        >
          <span
            className={cn(
              'transition-all ease-out block w-4 h-px bg-foreground-muted group-hover:bg-foreground',
              !mobileMenuOpen ? 'w-4' : 'absolute rotate-45 top-[6px]'
            )}
          />
          <span
            className={cn(
              'transition-all ease-out block h-px bg-foreground-muted group-hover:bg-foreground',
              !mobileMenuOpen ? 'w-3 group-hover:w-4' : 'absolute w-4 -rotate-45 top-[2px]'
            )}
          />
        </div>
      </button>
      <span
        className={cn(
          'transition-all duration-200',
          'text-foreground',
          mobileMenuOpen ? 'text-xs' : 'text-sm'
        )}
      >
        {mobileMenuOpen
          ? 'Close'
          : menuLevel
            ? levelsData[menuLevel]?.name
            : levelsData['home'].name}
      </span>
    </div>
  )
})

const MobileMenuBackdrop = memo(function MobileMenuBackdrop() {
  const mobileMenuOpen = useMenuMobileOpen()

  useEffect(() => {
    window.addEventListener('resize', (e: UIEvent) => {
      const w = e.target as Window
      if (mobileMenuOpen && w.innerWidth >= 1024) {
        menuState.setMenuMobileOpen(!mobileMenuOpen)
      }
    })
    return () => {
      window.removeEventListener('resize', () => {})
    }
  }, [mobileMenuOpen])

  return (
    <div
      className={cn(
        'h-full',
        'left-0',
        'right-0',
        'z-10',
        'backdrop-blur-sm backdrop-filter bg-alternative/90',
        mobileMenuOpen ? 'absolute h-full w-full top-0 left-0' : 'hidden h-0',
        // always hide on desktop
        'lg:hidden'
      )}
      onClick={() => menuState.setMenuMobileOpen(!mobileMenuOpen)}
    ></div>
  )
})

const Container = memo(function Container({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <main
      // used by layout to scroll to top
      id={DOCS_CONTENT_CONTAINER_ID}
      className={cn(
        'w-full transition-all ease-out relative',
        // desktop override any margin styles
        'lg:ml-0',
        className
      )}
    >
      <div className="flex flex-col sticky top-0">{children}</div>
    </main>
  )
})

const NavContainer = memo(function NavContainer({ children }: PropsWithChildren) {
  const mobileMenuOpen = useMenuMobileOpen()

  return (
    <nav
      aria-labelledby="main-nav-title"
      className={cn(
        'fixed lg:relative z-50 lg:z-40',
        mobileMenuOpen ? 'w-[75%] sm:w-[50%] md:w-[33%] left-0' : 'w-0 -left-full',
        'lg:w-[420px] !lg:left-0',
        'lg:top-[var(--header-height)] lg:sticky',
        'h-screen lg:h-[calc(100vh-var(--header-height))]',
        // desktop override any left styles
        'lg:left-0',
        'transition-all',
        'top-0 bottom-0',
        'flex flex-col ml-0',
        'border-r',
        'lg:overflow-y-auto'
      )}
    >
      <div
        className={cn(
          'top-0 lg:top-[var(--header-height)]',
          'h-full',
          'relative lg:sticky',
          'w-full lg:w-auto',
          'h-fit lg:h-screen overflow-y-scroll lg:overflow-auto',
          'backdrop-blur backdrop-filter bg-background',
          'flex flex-col flex-grow'
        )}
      >
        <span id="main-nav-title" className="sr-only">
          Main menu
        </span>
        <div className="top-0 sticky h-0 z-10">
          <div className="bg-gradient-to-b from-background to-transparent h-4 w-full"></div>
        </div>
        <div
          className={cn(
            'transition-all ease-out duration-200',
            'absolute left-0 right-0',
            'px-5 pl-5 pt-6 pb-16 lg:pb-32',
            'bg-background',
            // desktop styles
            'lg:relative lg:left-0 lg:pb-10 lg:px-10 lg:flex',
            'lg:opacity-100 lg:visible'
          )}
        >
          {children}
        </div>
      </div>
    </nav>
  )
})

interface SkeletonProps extends PropsWithChildren {
  menuId?: MenuId
  NavigationMenu?: ReactNode
}

function TopNavSkeleton({ children }) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="hidden lg:sticky w-full lg:flex top-0 left-0 right-0 z-50">
        <TopNavBar />
      </div>
      {children}
    </div>
  )
}

function SidebarSkeleton({ children, menuId, NavigationMenu }: SkeletonProps) {
  const mobileMenuOpen = useMenuMobileOpen()
  const hideSideNav = !menuId

  return (
    <div className="flex flex-row h-full relative">
      {!hideSideNav && (
        <NavContainer>{NavigationMenu ?? <DefaultNavigationMenu menuId={menuId} />}</NavContainer>
      )}
      <Container>
        <div
          className={cn(
            'flex lg:hidden w-full top-0 left-0 right-0 z-50',
            hideSideNav && 'sticky',
            mobileMenuOpen && 'z-10'
          )}
        >
          <TopNavBar />
        </div>
        <div
          className={cn(
            'sticky',
            'transition-all top-0 z-10',
            'backdrop-blur backdrop-filter bg-background'
          )}
        >
          {!hideSideNav && <MobileHeader menuId={menuId} />}
        </div>
        <div className="grow">
          {children}
          <Footer />
        </div>
        <MobileMenuBackdrop />
      </Container>
    </div>
  )
}

export { TopNavSkeleton, SidebarSkeleton }
