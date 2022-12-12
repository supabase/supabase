import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Footer from '~/components/Footer'
import NavigationMenu from '~/components/Navigation/NavigationMenu/NavigationMenu'
import TopNavBar from '~/components/Navigation/NavigationMenu/TopNavBar'
import SiteRefLayout from './SiteRefLayout'
import Image from 'next/image'

const Layout = (props) => {
  const router = useRouter()

  useEffect(() => {
    const key = localStorage.getItem('supabaseDarkMode')
    if (!key) {
      // Default to dark mode if no preference config
      document.documentElement.className = 'dark'
    } else {
      document.documentElement.className = key === 'true' ? 'dark' : ''
    }
  }, [])

  if (process.env.NEXT_PUBLIC_NEW_DOCS !== 'true') {
    return <>{props.children}</>
  }

  return SiteRefLayout(props)

  if (process.env.NEXT_PUBLIC_EXPERIMENTAL_REF && router.asPath.includes('/reference/')) {
    return SiteRefLayout(props)
  }

  return (
    <>
      <main>
        <Image
          width={608}
          height={975}
          alt="background"
          src={`${router.basePath}/img/gradient-bg.png`}
          className="absolute left-0 w-[520px] top-0 -z-10"
        />
        <div className="mx-auto sticky top-0 z-10">
          <TopNavBar />
        </div>
        <div className="grid grid-cols-12 opacity-100 duration-100 max-w-[1400px] mx-auto py-16 gap-4 px-5">
          <div className="col-span-3">
            <NavigationMenu />
          </div>
          <div className="col-span-9">
            {props.children}
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
      </main>
    </>
  )
}

export default Layout
