import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import NavigationMenu from '~/components/Navigation/NavigationMenu/NavigationMenu'
import TopNavBarRef from '~/components/Navigation/NavigationMenu/TopNavBarRef'
import { useTheme } from '~/components/Providers'

import RefSwitcher from '~/components/Navigation/RefSwitcher'

const SiteRefLayout = ({ children }) => {
  const router = useRouter()
  const { isDarkMode } = useTheme()

  return (
    <>
      <main>
        {/* <img
          src={`${router.basePath}/img/gradient-bg.png`}
          className="absolute left-0 w-[520px] top-0 -z-1 pointer-events-none"
        /> */}

        <div className="flex flex-row h-screen">
          <div
            className="
                border-r overflow-auto h-screen min-w-[320px]
                backdrop-blur backdrop-filter bg-white-1200 dark:bg-blackA-300
                flex flex-col
            "
          >
            <div className="top-0 sticky z-10">
              <div className="pt-8 bg-scale-200 flex flex-col gap-8">
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
                {/* {router.asPath.includes('/new/reference/') && <RefSwitcher />} */}
              </div>
              <div className="h-4 bg-scale-200 w-full"></div>
              <div className="bg-gradient-to-b from-scale-200 to-transparent h-4 w-full"></div>
            </div>
            <div className="pb-10 px-10">
              <NavigationMenu />
            </div>
          </div>
          <div className="w-full h-screen overflow-auto">
            <div className="flex flex-col">
              {/* <NavigationMenu /> */}

              <div className="sticky top-0 z-10">
                <TopNavBarRef />
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
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default SiteRefLayout
