import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { type CSSProperties, type PropsWithChildren, memo, useEffect } from 'react'

import { cn } from 'ui'

import Footer from '~/components/Navigation/Footer'
import HomeMenuIconPicker from '~/components/Navigation/NavigationMenu/HomeMenuIconPicker'
import NavigationMenu, { type MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import TopNavBar from '~/components/Navigation/NavigationMenu/TopNavBar'
import { menuState, useMenuMobileOpen } from '~/hooks/useMenuState'

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
        'transition-all ease-out z-10',
        'top-0',
        mobileMenuOpen && 'absolute',
        'flex items-center h-[var(--mobile-header-height,40px)]',
        mobileMenuOpen ? 'gap-0' : 'gap-3'
      )}
    >
      <button
        className={[
          'h-8 w-8 flex group items-center justify-center mr-2',
          mobileMenuOpen && 'mt-0.5',
        ].join(' ')}
        onClick={() => menuState.setMenuMobileOpen(!mobileMenuOpen)}
      >
        <div
          className={[
            'space-y-1  cursor-pointer relative',
            mobileMenuOpen ? 'w-4 h-4' : 'w-4 h-[8px]',
          ].join(' ')}
        >
          <span
            className={[
              'transition-all ease-out block w-4 h-px bg-foreground-muted group-hover:bg-foreground',
              !mobileMenuOpen ? 'w-4' : 'absolute rotate-45 top-[6px]',
            ].join(' ')}
          ></span>
          <span
            className={[
              'transition-all ease-out block h-px bg-foreground-muted group-hover:bg-foreground',
              !mobileMenuOpen ? 'w-3 group-hover:w-4' : 'absolute w-4 -rotate-45 top-[2px]',
            ].join(' ')}
          ></span>
        </div>
      </button>
      <div className={[].join(' ')}>
        <HomeMenuIconPicker
          icon={menuLevel ? levelsData[menuLevel].icon : 'home'}
          className={[
            'transition-all duration-200',
            mobileMenuOpen ? 'invisible w-0 h-0' : 'w-4 h-4',
          ].join(' ')}
        />
      </div>
      <span
        className={[
          'transition-all duration-200',
          'text-foreground',
          mobileMenuOpen ? 'text-xs' : 'text-sm',
        ].join(' ')}
      >
        {mobileMenuOpen
          ? 'Close'
          : menuLevel
            ? levelsData[menuLevel].name
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
      className={[
        'h-full',
        'left-0',
        'right-0',
        'z-10',
        'backdrop-blur-sm backdrop-filter bg-alternative/90',
        mobileMenuOpen ? 'absolute h-full w-full top-0 left-0' : 'hidden h-0',
        // always hide on desktop
        'lg:hidden',
      ].join(' ')}
      onClick={() => menuState.setMenuMobileOpen(!mobileMenuOpen)}
    ></div>
  )
})

const HeaderLogo = memo(function HeaderLogo() {
  const { resolvedTheme } = useTheme()
  return (
    <Link href="/" className="px-10 flex items-center gap-2">
      <Image
        className="cursor-pointer"
        src={
          resolvedTheme?.includes('dark') ? '/docs/supabase-dark.svg' : '/docs/supabase-light.svg'
        }
        width={96}
        height={24}
        alt="Supabase Logo"
      />
      <span className="font-mono text-sm font-medium text-brand-link">DOCS</span>
    </Link>
  )
})

const Container = memo(function Container({
  children,
  style,
}: PropsWithChildren<{ style?: CSSProperties }>) {
  const mobileMenuOpen = useMenuMobileOpen()

  return (
    <div
      // #docs-content-container is used by layout to scroll to top
      id="docs-content-container"
      className={cn(
        // 'overflow-x-auto',
        'w-full transition-all ease-out',
        // 'absolute lg:relative',
        mobileMenuOpen ? 'ml-[75%] sm:ml-[50%] md:ml-[33%] overflow-hidden' : 'overflow-auto',
        // desktop override any margin styles
        'lg:ml-0'
      )}
      style={style}
    >
      <div className="flex flex-col relative">{children}</div>
    </div>
  )
})

const NavContainer = memo(function NavContainer({ menuId }: { menuId: MenuId }) {
  const mobileMenuOpen = useMenuMobileOpen()

  return (
    <nav
      aria-labelledby="main-nav-title"
      className={[
        // 'hidden',
        'absolute lg:relative',
        mobileMenuOpen ? 'w-[75%] sm:w-[50%] md:w-[33%] left-0' : 'w-0 -left-[280px]',
        'lg:w-[420px] !lg:left-0',
        // desktop override any left styles
        'lg:left-0',
        'transition-all',
        'top-0',
        'flex flex-col ml-0',
      ].join(' ')}
    >
      <div
        className={[
          'top-0',
          'relative',
          'w-auto',
          'border-r overflow-auto h-screen',
          'backdrop-blur backdrop-filter bg-background',
          'flex flex-col',
        ].join(' ')}
      >
        <h1 id="main-nav-title" className="sr-only">
          Main menu
        </h1>
        <div className="top-0 sticky z-10">
          <div>
            <div>
              <div
                className={[
                  'hidden lg:flex lg:height-auto',
                  'pt-8 bg-background flex-col gap-8',
                ].join(' ')}
              >
                <HeaderLogo />
              </div>
              <div className="h-4 bg-background w-full"></div>
              <div className="bg-gradient-to-b from-background to-transparent h-4 w-full"></div>
            </div>
          </div>
        </div>
        <div
          className={[
            'transition-all ease-out duration-200',
            'absolute left-0 right-0 h-screen',
            'px-5 pl-5 py-16',
            'top-[0px]',
            'bg-background',
            // desktop styles
            'lg:relative lg:top-0 lg:left-0 lg:pb-10 lg:px-10 lg:pt-0 lg:flex',
            'lg:opacity-100 lg:visible',
          ].join(' ')}
        >
          <NavigationMenu menuId={menuId} />
        </div>
      </div>
    </nav>
  )
})

function MainSkeleton({ children, menuId }: PropsWithChildren<{ menuId: MenuId }>) {
  return (
    <div className="flex flex-row h-full">
      <NavContainer menuId={menuId} />
      <Container
        style={
          {
            '--desktop-header-height': '60px',
            '--mobile-header-height': '40px',
          } as CSSProperties
        }
      >
        <div className={['lg:sticky top-0 z-10 overflow-hidden'].join(' ')}>
          <TopNavBar />
        </div>
        <div
          className={[
            'sticky transition-all top-0',
            'z-10',
            'backdrop-blur backdrop-filter bg-background',
          ].join(' ')}
        >
          <div className={['lg:hidden', 'px-3.5', 'border-b z-10'].join(' ')}>
            <MobileHeader menuId={menuId} />
          </div>
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

export { MainSkeleton }
