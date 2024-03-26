import { createClient } from '@/lib/supabase/server'
import { User2 } from 'lucide-react'
import { cookies } from 'next/headers'
import { Suspense } from 'react'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'
import AvatarDropdown from './AvatarDropdown'
import NoUserDropdown from './NoUserDropdown'

const EmptyUserButton = () => (
  <Button type="outline" className="p-1.5 rounded-full" icon={<User2 size={16} />} />
)

export function UserDropdown() {
  return (
    <Suspense fallback={<EmptyUserButton />}>
      <Dropdowns />
    </Suspense>
  )
}

async function Dropdowns() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild className="flex">
        {user ? (
          <button
            title="User dropdown menu"
            className="border border-foreground-lighter rounded-full w-[30px] h-[30px] bg-no-repeat bg-center bg-cover"
            style={{ backgroundImage: `url('${user.user_metadata.avatar_url}')` }}
          />
        ) : (
          <EmptyUserButton />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-64">
        {user ? <AvatarDropdown user={user} /> : <NoUserDropdown />}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserDropdown
