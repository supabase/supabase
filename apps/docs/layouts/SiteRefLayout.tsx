import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import NavigationMenu from '~/components/Navigation/NavigationMenu/NavigationMenu'
import TopNavBarRef from '~/components/Navigation/NavigationMenu/TopNavBarRef'
import { useTheme } from 'common/Providers'

import RefSwitcher from '~/components/Navigation/RefSwitcher'
import { useEffect, useState } from 'react'

const SiteRefLayout = ({ children }) => {
  const router = useRouter()
  const { isDarkMode } = useTheme()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [router.asPath])

  return (
    <>
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
                            src={
                              isDarkMode ? '/docs/supabase-dark.svg' : '/docs/supabase-light.svg'
                            }
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
            className={[
              'w-full h-screen transition-all ease-out',
              mobileMenuOpen ? 'overflow-hidden' : 'overflow-auto',
              // !mobileMenuOpen
              //   ? 'ml-0 MOBILE-MENU-CLOSE overflow-auto'
              //   : 'ml-[320px] h-0 MOBILE-MENU-OPEN overflow-hidden', // experiment
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
                <div
                  className={[
                    'lg:hidden',
                    'px-5 ',
                    'border-b z-10',
                    mobileMenuOpen ? 'MOBILE-MENU-OPEN' : 'MOBILE-MENU-CLOSED', // experiment new
                    mobileMenuOpen ? 'MOBILE-MENU-OPEN' : 'MOBILE-MENU-CLOSED',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'transition-all ease-out z-10',
                      mobileMenuOpen ? 'absolute mt-[64px]' : 'top-0',
                      'flex items-center gap-3 h-[40px]',
                    ].join(' ')}
                  >
                    <button className="mr-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
                        src="/docs/img/icons/menu/auth.svg"
                        className={[
                          'transition-all duration-200',
                          mobileMenuOpen ? 'w-5 h-5' : 'w-4 h-4',
                        ].join(' ')}
                      />
                    </div>
                    <span
                      className={[
                        'transition-all duration-200',
                        'text-scale-1200',
                        mobileMenuOpen ? 'text-base' : 'text-sm',
                      ].join(' ')}
                    >
                      Auth
                    </span>
                  </div>
                  <div
                    className={[
                      'transition-all ease-out duration-200',
                      'absolute left-0 right-0 h-screen',
                      'py-8 px-5 pl-14',
                      'top-[0px]',
                      'bg-scale-200',
                      mobileMenuOpen
                        ? 'opacity-100 left-[0px] visible'
                        : 'left-[-40px] h-0 opacity-0 invisible',
                    ].join(' ')}
                  >
                    <NavigationMenu />
                  </div>
                </div>
              </div>
              <div className="grow px-5 max-w-7xl mx-auto py-16">
                {children}
                <hr className="border-scale-400  mt-32"></hr>
                <div className="flex flex-row gap-3 mt-6">
                  <span className="text-xs text-scale-900">Supabase 2022</span>
                  <span className="text-xs text-scale-900">—</span>
                  <a className="text-xs text-scale-800">Contributing</a>
                  <a className="text-xs text-scale-800">Author Styleguide</a>
                  <a className="text-xs text-scale-800">Changelog</a>
                  <a className="text-xs text-scale-800">Opensource</a>
                  <a className="text-xs text-scale-800">Supasquad</a>
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
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              ></div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default SiteRefLayout
