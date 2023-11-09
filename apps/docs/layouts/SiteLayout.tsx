import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import NavigationMenu from '~/components/Navigation/NavigationMenu/NavigationMenu'
import TopNavBar from '~/components/Navigation/NavigationMenu/TopNavBar'

import Head from 'next/head'
import { PropsWithChildren, memo, useEffect } from 'react'
import Footer from '~/components/Navigation/Footer'
import { menuState, useMenuLevelId, useMenuMobileOpen } from '~/hooks/useMenuState'

const levelsData = {
  home: {
    icon: '/docs/img/icons/menu/home',
    name: 'Home',
  },
  gettingstarted: {
    icon: '/docs/img/icons/menu/getting-started',
    name: 'Getting Started',
  },
  database: {
    icon: '/docs/img/icons/menu/database',
    name: 'Database',
  },
  api: {
    icon: '/docs/img/icons/menu/rest',
    name: 'REST API',
  },
  graphql: {
    icon: '/docs/img/icons/menu/graphql',
    name: 'GraphQL',
  },
  auth: {
    icon: '/docs/img/icons/menu/auth',
    name: 'Auth',
  },
  functions: {
    icon: '/docs/img/icons/menu/functions',
    name: 'Edge Functions',
  },
  realtime: {
    icon: '/docs/img/icons/menu/realtime',
    name: 'Realtime',
  },
  analytics: {
    icon: '/docs/img/icons/menu/analytics',
    name: 'Analytics',
  },
  storage: {
    icon: '/docs/img/icons/menu/storage',
    name: 'Storage',
  },
  ai: {
    icon: '/docs/img/icons/menu/ai',
    name: 'AI & Vectors',
  },
  supabase_cli: {
    icon: '/docs/img/icons/menu/reference-cli',
    name: 'Supabase CLI',
  },
  platform: {
    icon: '/docs/img/icons/menu/platform',
    name: 'Platform',
  },
  resources: {
    icon: '/docs/img/icons/menu/resources',
    name: 'Resources',
  },
  self_hosting: {
    icon: '/docs/img/icons/menu/self-hosting',
    name: 'Self-Hosting',
  },
  integrations: {
    icon: '/docs/img/icons/menu/integrations',
    name: 'Integrations',
  },
  reference_javascript_v1: {
    icon: '/docs/img/icons/menu/reference-javascript',
    name: 'Javascript Reference v1.0',
  },
  reference_javascript_v2: {
    icon: '/docs/img/icons/menu/reference-javascript',
    name: 'Javascript Reference v2.0',
  },
  reference_dart_v0: {
    icon: '/docs/img/icons/menu/reference-dart',
    name: 'Dart Reference v0.0',
  },
  reference_dart_v1: {
    icon: '/docs/img/icons/menu/reference-dart',
    name: 'Dart Reference v0.0',
  },
  reference_csharp_v0: {
    icon: '/docs/img/icons/menu/reference-csharp',
    name: 'C# Reference v0.0',
  },
  reference_python_v2: {
    icon: '/docs/img/icons/menu/reference-python',
    name: 'Python Reference v2.0',
  },
  reference_swift_v1: {
    icon: '/docs/img/icons/menu/reference-swift',
    name: 'Swift Reference v1.0',
  },
  reference_kotlin_v0: {
    icon: '/docs/img/icons/menu/reference-kotlin',
    name: 'Kotlin Reference v0.0',
  },
  reference_cli: {
    icon: '/docs/img/icons/menu/reference-cli',
    name: 'CLI Reference',
  },
  reference_api: {
    icon: '/docs/img/icons/menu/reference-api',
    name: 'Management API Reference',
  },
  reference_self_hosting_auth: {
    icon: '/docs/img/icons/menu/reference-auth',
    name: 'Auth Server Reference',
  },
  reference_self_hosting_storage: {
    icon: '/docs/img/icons/menu/reference-storage',
    name: 'Storage Server Reference',
  },
  reference_self_hosting_realtime: {
    icon: '/docs/img/icons/menu/reference-realtime',
    name: 'Realtime Server Reference',
  },
  reference_self_hosting_analytics: {
    icon: '/docs/img/icons/menu/reference-analytics',
    name: 'Analytics Server Reference',
  },
  reference_self_hosting_functions: {
    icon: '/docs/img/icons/menu/reference-functions',
    name: 'Functions Server Reference',
  },
}

const MobileHeader = memo(function MobileHeader() {
  const mobileMenuOpen = useMenuMobileOpen()
  const menuLevel = useMenuLevelId()

  return (
    <div
      className={[
        'transition-all ease-out z-10',
        'top-0',
        mobileMenuOpen && 'absolute',
        'flex items-center h-[40px]',
        mobileMenuOpen ? 'gap-0' : 'gap-3',
      ].join(' ')}
    >
      <button
        className={['mr-2', mobileMenuOpen && 'mt-0.5'].join(' ')}
        onClick={() => menuState.setMenuMobileOpen(!mobileMenuOpen)}
      >
        <div
          className={[
            'space-y-1 group cursor-pointer relative',
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
        <img
          src={menuLevel ? levelsData[menuLevel].icon + '.svg' : levelsData['home'].icon + '.svg'}
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
        src={resolvedTheme === 'dark' ? '/docs/supabase-dark.svg' : '/docs/supabase-light.svg'}
        width={96}
        height={24}
        alt="Supabase Logo"
      />
      <span className="font-mono text-sm font-medium text-brand">DOCS</span>
    </Link>
  )
})

const Container = memo(function Container(props: PropsWithChildren) {
  const mobileMenuOpen = useMenuMobileOpen()

  return (
    <div
      // #docs-content-container is used by layout to scroll to top
      id="docs-content-container"
      className={[
        // 'overflow-x-auto',
        'w-full h-screen transition-all ease-out',
        // 'absolute lg:relative',
        mobileMenuOpen
          ? '!w-auto ml-[75%] sm:ml-[50%] md:ml-[33%] overflow-hidden'
          : 'overflow-auto',
        // desktop override any margin styles
        'lg:ml-0',
      ].join(' ')}
    >
      <div className="flex flex-col relative">{props.children}</div>
    </div>
  )
})

const NavContainer = memo(function NavContainer() {
  const mobileMenuOpen = useMenuMobileOpen()

  return (
    <div
      className={[
        // 'hidden',
        'absolute lg:relative',
        mobileMenuOpen ? 'w-[75%] sm:w-[50%] md:w-[33%] left-0' : 'w-0 -left-[280px]',
        'lg:w-[420px] !lg:left-0',
        // desktop override any left styles
        'lg:left-0',
        'transition-all',
        'top-0',
        'h-screen',
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
          <NavigationMenu />
        </div>
      </div>
    </div>
  )
})

const SiteLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <>
      <Head>
        <title>Supabase Docs</title>
      </Head>
      <main>
        <div className="flex flex-row h-screen">
          <NavContainer />
          <Container>
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
              <div className={['lg:hidden', 'px-5 ', 'border-b z-10'].join(' ')}>
                <MobileHeader />
              </div>
            </div>
            <div className="grow">
              {children}
              <Footer />
            </div>
            <MobileMenuBackdrop />
          </Container>
        </div>
      </main>
    </>
  )
}

export default SiteLayout
