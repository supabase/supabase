import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Footer from '~/components/Footer'

import TopNavBar from '~/components/Navigation/NavigationMenu/TopNavBar'

const Layout = ({ children }) => {
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

  return (
    <>
      <main>
        <img
          src={`${router.basePath}/img/gradient-bg.png`}
          className="absolute left-0 w-[520px] top-0 -z-10"
        />
        <div className="mx-auto sticky top-0 z-10">
          <TopNavBar />
        </div>

        {children}
      </main>
    </>
  )
}

export default Layout
