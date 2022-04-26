import { useEffect } from 'react'
import Nav from 'components/Nav/index'
import Footer from 'components/Footer/index'

type Props = {
  hideHeader?: boolean
  hideFooter?: boolean
  children: React.ReactNode
}

const DefaultLayout = (props: Props) => {
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
    <>
      {!hideHeader && <Nav />}
      <div className="min-h-screen">
        <main>{children}</main>
      </div>
      {!hideFooter && <Footer />}
    </>
  )
}

export default DefaultLayout
