import Link from 'next/link'
import Image from 'next/image'
import DarkModeToggle from './DarkModeToggle'
import { useTheme } from './Provider'

const Nav = () => {
  const { isDarkMode } = useTheme()

  return (
    <div className="flex p-4">
      <div className=''>
        <Link href="/">
          <img src={isDarkMode ? "/supabase-logo-wordmark--dark.svg" : "/supabase-logo-wordmark--light.svg"} width="100" />
        </Link>
      </div>
      <div>
        <Link href="/about">
          <a>About</a>
        </Link>
        <Link href="/careers">
          <a>Careers</a>
        </Link>
        <DarkModeToggle />
      </div>
    </div>
  )
}

export default Nav