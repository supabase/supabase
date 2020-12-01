import { useState, useEffect } from 'react'
import Nav from 'components/Nav/index'
import Footer from 'components/Footer/index'
import Meta from 'components/Meta'

type Props = {
  preview?: boolean
  children: React.ReactNode
}

const Layout = ({ preview, children }: Props) => {

  const [darkMode, setDarkMode] = useState<boolean>(true)

  useEffect(() => {
    const isDarkMode = localStorage.getItem('supabaseDarkMode')
    if (isDarkMode) {
      setDarkMode(isDarkMode === 'true')
      document.documentElement.className = isDarkMode === 'true' ? 'dark' : ''
    }
  }, [])

  const updateTheme = (isDarkMode: boolean) => {
    document.documentElement.className = isDarkMode ? 'dark' : ''
    setDarkMode(isDarkMode)
  }

  return (
    <>
      <Meta />
      <Nav darkMode={darkMode} />
      <div className="min-h-screen bg-gray-100">
        <main>{children}</main>
      </div>
      <Footer darkMode={darkMode} updateTheme={updateTheme}/>
    </>
  )
}

export default Layout
