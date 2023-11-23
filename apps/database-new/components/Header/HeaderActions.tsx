'use client'
import { User } from '@supabase/supabase-js'
import { Button } from 'ui'
import ThemeSwitcherButton from './ThemeSwitcherButton'
import AvatarDropdown from './AvatarDropdown'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useSelectedLayoutSegment } from 'next/navigation'
import { useAppStateSnapshot } from '@/lib/state'

interface HeaderActionsProps {
  user: User | null
}
const HeaderActions = ({ user }: HeaderActionsProps) => {
  const supabase = createClient()
  const router = useRouter()
  const segment = useSelectedLayoutSegment()
  const snap = useAppStateSnapshot()

  const [currentUser, setCurrentUser] = useState<User | null>(user)

  async function signout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.log('Error logging out:', error.message)
      return
    }

    router.push('/')
    setCurrentUser(null)
  }

  return (
    <div className="flex items-center gap-x-2">
      <Button type="default">
        <Link href="/new">New conversation</Link>
      </Button>
      {segment && segment.includes('thread') && (
        <>
          <Button type="default" onClick={() => snap.setHideCode(!snap.hideCode)}>
            {snap.hideCode ? 'Show code' : 'Hide code'}
          </Button>
          <div className="border-r py-3" />
        </>
      )}

      <ThemeSwitcherButton />

      {currentUser ? (
        <AvatarDropdown currentUser={currentUser} signout={signout} />
      ) : (
        <Button type="default">
          <Link href="/login">Login</Link>
        </Button>
      )}
    </div>
  )
}

export default HeaderActions
