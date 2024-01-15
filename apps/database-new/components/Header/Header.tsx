import HeaderActions from './HeaderActions'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import CurrentThreadName from './CurrentThreadName'
import Link from 'next/link'
import UserDropdown from './UserDropdown'

const Header = async () => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

        <CurrentThreadName />
      </div>
      <div className="flex gap-3">
        <HeaderActions user={user} />
        <UserDropdown />
      </div>
    </nav>
  )
}

export default Header
