'use client'
import { useAppStateSnapshot } from '@/lib/state'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter, useSelectedLayoutSegment } from 'next/navigation'
import { useState } from 'react'
import { Button } from 'ui'
import AvatarDropdown from './AvatarDropdown'
import NoUserDropdown from './NoUserDropdown'
import SaveSchemaDropdown from './SaveSchemaDropdown'
import ThemeSwitcherButton from './ThemeSwitcher'
import ToggleCodeEditorButton from './ToggleCodeEditorButton'

interface HeaderActionsProps {
  user: User | null
}
const HeaderActions = ({ user }: HeaderActionsProps) => {
  const supabase = createClient()
  const router = useRouter()
  const segment = useSelectedLayoutSegment()

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
      {segment && segment.includes('thread') && (
        <div className="hidden xl:flex items-center gap-x-2">
          <ToggleCodeEditorButton />
          <SaveSchemaDropdown />
          <div className="border-r py-3" />
        </div>
      )}

      <Button type="default" className="hidden xl:block">
        <Link href="/">New conversation</Link>
      </Button>

      {/* {currentUser ? (
        <AvatarDropdown currentUser={currentUser} signout={signout} />
      ) : (
        <NoUserDropdown />
      )} */}
    </div>
  )
}

export default HeaderActions
