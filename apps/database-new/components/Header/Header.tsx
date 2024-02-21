import Link from 'next/link'

import HeaderActions from './HeaderActions'
import UserDropdown from './UserDropdown'

const Header = async () => {
  return (
    <nav
      role="navigation"
      className="bg-background border flex items-center justify-between px-4 min-h-[50px]"
    >
      <div className="flex items-center gap-x-4">
        <Link href="/">
          <div className="flex items-center gap-x-1.5 font-mono">
            <span>database</span>
            <div className="w-1.5 h-1.5 rounded-full bg-dbnew"></div>
            <span>design</span>
          </div>
        </Link>
      </div>
      <div className="flex gap-3">
        <HeaderActions />
        <UserDropdown />
      </div>
    </nav>
  )
}

export default Header
