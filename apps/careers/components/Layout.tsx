import { useEffect } from 'react'
import Nav from './Nav'
// import Footer from './Footer'

type Props = {
  hideHeader?: boolean
  hideFooter?: boolean
  children: React.ReactNode
}

const Layout = (props: Props) => {
  const { hideHeader = false, hideFooter = false, children } = props

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
    <div className="mx-8 mt-6 sm:mx-12 md:mx-auto md:max-w-screen-lg">
      {!hideHeader && <Nav />}
      <div className="min-h-screen">
        <main>{children}</main>
      </div>
      {/*!hideFooter && <Footer />*/}
    </div>
  )
}

export default Layout
