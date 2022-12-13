import { useTheme } from 'common/Providers'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import NavigationMenu from '~/components/Navigation/NavigationMenu/NavigationMenu'
import TopNavBarRef from '~/components/Navigation/NavigationMenu/TopNavBarRef'

import FooterHelpCallout from '~/components/FooterHelpCallout'

import { menuState, useMenuLevelId, useMenuMobileOpen } from '~/hooks/useMenuState'
import { useEffect } from 'react'

const SiteRefLayout = ({ children }) => {
  const { isDarkMode } = useTheme()

  useEffect(() => {
    const key = localStorage.getItem('supabaseDarkMode')
    if (!key) {
      // Default to dark mode if no preference config
      document.documentElement.className = 'dark'
    } else {
      document.documentElement.className = key === 'true' ? 'dark' : ''
    }
  }, [])

  const menuLevel = useMenuLevelId()
  const mobileMenuOpen = useMenuMobileOpen()

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
    auth: {
      icon: '/docs/img/icons/menu/auth',
      name: 'Auth',
    },
    functions: {
      icon: '/docs/img/icons/menu/functions',
      name: 'Functions',
    },
    realtime: {
      icon: '/docs/img/icons/menu/realtime',
      name: 'Realtime',
    },
    storage: {
      icon: '/docs/img/icons/menu/storage',
      name: 'Storage',
    },
    platform: {
      icon: '/docs/img/icons/menu/platform',
      name: 'Platform',
    },
    resources: {
      icon: '/docs/img/icons/menu/resources',
      name: 'Resources',
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
  }

  return (
    <main>
      {/* <img
          src={`${router.basePath}/img/gradient-bg.png`}
          className="absolute left-0 w-[520px] top-0 -z-1 pointer-events-none"
        /> */}

      <div className="flex flex-row h-screen">
        <div
          className={[
            'hidden', // experiment hidden
            'transition-all',
            'top-0',
            'relative',
            'h-screen w-[420px]',
            'z-10',
            'lg:flex flex-col ml-0',
          ].join(' ')}
        >
          <div
            className={[
              'top-0',
              'relative',
              'w-auto',
              'z-10',

              'border-r overflow-auto h-screen',
              'backdrop-blur backdrop-filter bg-white-1200 dark:bg-blackA-300',
              'flex flex-col',
            ].join(' ')}
          >
            <div className="top-0 sticky z-10">
              <div>
                <div>
                  <div
                    className={[
                      'hidden md:flex md:height-auto',
                      'pt-8 bg-scale-200 flex-col gap-8',
                    ].join(' ')}
                  >
                    <Link href="/">
                      <a className="px-10 flex items-center gap-2">
                        <Image
                          className="cursor-pointer"
                          src={isDarkMode ? '/docs/supabase-dark.svg' : '/docs/supabase-light.svg'}
                          width={96}
                          height={24}
                          alt="Supabase Logo"
                        />
                        <span className="font-mono text-sm font-medium text-brand-900">DOCS</span>
                      </a>
                    </Link>
                    {/* {router.asPath.includes('/reference/') && <RefSwitcher />} */}
                  </div>
                  <div className="h-4 bg-scale-200 w-full"></div>
                  <div className="bg-gradient-to-b from-scale-200 to-transparent h-4 w-full"></div>
                </div>
              </div>
            </div>
            <div className={['pb-10 px-5 md:px-10 md:flex'].join(' ')}>
              <NavigationMenu />
            </div>
          </div>
        </div>
        <div
          // #docs-content-container is used by layout to scroll to top
          id="docs-content-container"
          className={[
            'w-full h-screen transition-all ease-out',
            mobileMenuOpen ? 'overflow-hidden' : 'overflow-auto',
          ].join(' ')}
        >
          <div className="flex flex-col relative">
            {/* <NavigationMenu /> */}
            <div className={['lg:sticky top-0 z-10 overflow-hidden'].join(' ')}>
              <TopNavBarRef />
            </div>
            <div
              className={[
                'sticky transition-all top-0',
                'z-10',
                'backdrop-blur backdrop-filter bg-white-1200 dark:bg-blackA-300',
              ].join(' ')}
            >
              <div className={['lg:hidden', 'px-5 ', 'border-b z-10'].join(' ')}>
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
                          'transition-all ease-out block w-4 h-px bg-scale-900 group-hover:bg-scale-1200',
                          !mobileMenuOpen ? 'w-4' : 'absolute rotate-45 top-[6px]',
                        ].join(' ')}
                      ></span>
                      <span
                        className={[
                          'transition-all ease-out block h-px bg-scale-900 group-hover:bg-scale-1200',
                          !mobileMenuOpen
                            ? 'w-3 group-hover:w-4'
                            : 'absolute w-4 -rotate-45 top-[2px]',
                        ].join(' ')}
                      ></span>
                    </div>
                  </button>
                  <div className={[].join(' ')}>
                    <img
                      src={
                        menuLevel
                          ? levelsData[menuLevel].icon + '.svg'
                          : levelsData['home'].icon + '.svg'
                      }
                      className={[
                        'transition-all duration-200',
                        mobileMenuOpen ? 'invisible w-0 h-0' : 'w-4 h-4',
                      ].join(' ')}
                    />
                  </div>
                  <span
                    className={[
                      'transition-all duration-200',
                      'text-scale-1200',
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
                <div
                  className={[
                    'transition-all ease-out duration-200',
                    'absolute left-0 right-0 h-screen',
                    'px-5 pl-5 py-16',
                    'top-[0px]',
                    'bg-scale-200',
                    mobileMenuOpen
                      ? 'overflow-y-auto opacity-100 left-[0px] visible'
                      : 'left-[-40px] h-0 opacity-0 invisible',
                  ].join(' ')}
                >
                  <NavigationMenu />
                </div>
              </div>
            </div>
            <div className="grow px-5 max-w-7xl mx-auto py-16">
              {children}

              <div className="mt-32">
                <FooterHelpCallout />
              </div>
              <hr className="border-scale-400  mt-8"></hr>
              <div className="flex flex-col lg:flex-row gap-3 mt-6">
                <span className="text-xs text-scale-900">Supabase 2022</span>
                <span className="text-xs text-scale-900">—</span>
                <Link href="/handbook/contributing">
                  <a className="text-xs text-scale-800 hover:underline">Contributing</a>
                </Link>
                <Link href="https://supabase.com/changelog">
                  <a className="text-xs text-scale-800 hover:underline">Changelog</a>
                </Link>

                <Link href="https://github.com/supabase/supabase/blob/master/DEVELOPERS.md">
                  <a className="text-xs text-scale-800 hover:underline">Author Styleguide</a>
                </Link>
                <Link href="https://supabase.com/docs/oss">
                  <a className="text-xs text-scale-800 hover:underline">Open Source</a>
                </Link>
                <Link href="https://supabase.com/docs/handbook/supasquad">
                  <a className="text-xs text-scale-800 hover:underline">Supasquad</a>
                </Link>
              </div>
            </div>

            <div
              className={[
                // 'top-0 left-0',
                'hidden', // experiment hidden
                'h-full',
                'left-0',
                'right-0',
                'z-10',
                'backdrop-blur-sm backdrop-filter bg-white-1200 dark:bg-blackA-600',
                mobileMenuOpen ? 'absolute MOBILE-MENU-OPEN' : 'hidden h-0 MOBILE-MENU-CLOSED',
              ].join(' ')}
              onClick={() => menuState.setMenuMobileOpen(!mobileMenuOpen)}
            ></div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default SiteRefLayout
