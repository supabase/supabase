import { useState, useEffect } from 'react'
import Nav from 'components/Nav/index'
import Footer from 'components/Footer/index'

type Props = {
  hideHeader?: boolean
  hideFooter?: boolean
  children: React.ReactNode
}

const MODE_STORAGE_KEY = 'supabaseDarkMode'
const DARK_COLOR_SCHEME_CLASSNAME = 'dark'
// Prevents flash of dark if the user is on light theme by injecting the right classname while the page loads.
// rather than after the page hydrates. Defaults to dark.
const setInitialTheme = `
function getUserPreference() {
  try {
    return window.localStorage.getItem('${MODE_STORAGE_KEY}') === 'true' 
      ? '${DARK_COLOR_SCHEME_CLASSNAME}' : ''
  } catch (err) {}
  return '${DARK_COLOR_SCHEME_CLASSNAME}'
}
document.documentElement.className = getUserPreference()
`

const DefaultLayout = (props: Props) => {
  const { hideHeader = false, hideFooter = false, children } = props
  const initialMode =
    typeof window != 'undefined' ? window.localStorage.getItem(MODE_STORAGE_KEY) === 'true' : true
  const [darkMode, setDarkMode] = useState<boolean>(initialMode)

  const updateTheme = (isDarkMode: boolean) => {
    document.documentElement.className = isDarkMode ? DARK_COLOR_SCHEME_CLASSNAME : ''
    window.localStorage.setItem(MODE_STORAGE_KEY, isDarkMode.toString())
    setDarkMode(isDarkMode)
  }

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
      {!hideHeader && <Nav darkMode={darkMode} />}
      <div className="min-h-screen bg-white dark:bg-gray-800">
        <main>{children}</main>
      </div>
      {!hideFooter && <Footer darkMode={darkMode} updateTheme={updateTheme} />}
    </>
  )
}

export default DefaultLayout
