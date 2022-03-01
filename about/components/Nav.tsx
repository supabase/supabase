import Link from 'next/link'
import Image from 'next/image'
import DarkModeToggle from './DarkModeToggle'
import { useTheme } from './Provider'

const Nav = () => {
  const { isDarkMode } = useTheme()

  return (
    <div className="flex py-4 px-10 border-b border-solid justify-between">
      <div className="flex items-center">
        <Link href="/">
          <a>
            <img src={isDarkMode ? "/supabase-logo-wordmark--dark.svg" : "/supabase-logo-wordmark--light.svg"} width="120" />
          </a>
        </Link>
      </div>
      <div className="flex items-center space-x-6">
        <Link href="/about">
          <a className="hover:text-brand-600">About</a>
        </Link>
        <Link href="/careers">
          <a className="hover:text-brand-600">Careers</a>
        </Link>
        <DarkModeToggle />
      </div>
    </div>
  )
}

export default Nav