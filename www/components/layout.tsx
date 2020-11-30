import { useEffect } from 'react'
import Nav from 'components/Nav/index'
import Footer from 'components/Footer/index'
import Meta from 'components/meta'

type Props = {
  preview?: boolean
  children: React.ReactNode
}

const Layout = ({ preview, children }: Props) => {

  useEffect(() => {
    const darkMode = localStorage.getItem('supabaseDarkMode')
    if (darkMode) document.documentElement.className = darkMode === 'true' ? 'dark' : ''
  }, [])

  const updateTheme = (isDarkMode: boolean) => {
    document.documentElement.className = isDarkMode ? 'dark' : ''
  }

  return (
    <>
      <Meta />
      <Nav />
      <div className="min-h-screen bg-gray-100">
        <main>{children}</main>
      </div>
      <Footer updateTheme={updateTheme} />
    </>
  )
}

export default Layout
