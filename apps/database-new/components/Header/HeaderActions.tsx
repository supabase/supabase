'use client'
import { getAppStateSnapshot, useAppStateSnapshot } from '@/lib/state'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSelectedLayoutSegment } from 'next/navigation'
import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronDown,
  IconClipboard,
  IconDownload,
} from 'ui'
import AvatarDropdown from './AvatarDropdown'
import NoUserDropdown from './NoUserDropdown'
import ThemeSwitcherButton from './ThemeSwitcherButton'

interface HeaderActionsProps {
  user: User | null
}
const HeaderActions = ({ user }: HeaderActionsProps) => {
  const supabase = createClient()
  const router = useRouter()
  const segment = useSelectedLayoutSegment()
  const snap = useAppStateSnapshot()

  const [currentUser, setCurrentUser] = useState<User | null>(user)

  const copyToClipboard = () => {
    const snap = getAppStateSnapshot()
    const focused = window.document.hasFocus()
    if (focused) {
      window.navigator?.clipboard?.writeText(snap.selectedCode)
    } else {
      console.warn('Unable to copy to clipboard')
    }
  }

  const downloadSQL = () => {
    const snap = getAppStateSnapshot()
    const blob = new Blob([snap.selectedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'migration.sql'
    link.href = url
    link.click()
  }

  const loadSQLInSupabase = () => {
    const snap = getAppStateSnapshot()
    window.open(
      `https://supabase.com/dashboard/project/_/sql?content=${encodeURIComponent(
        snap.selectedCode
      )}`,
      '_blank'
    )
  }

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
        <>
          <Button type="default" onClick={() => snap.setHideCode(!snap.hideCode)}>
            {snap.hideCode ? 'Show code' : 'Hide code'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                onClick={() => snap.setHideCode(!snap.hideCode)}
                iconRight={<IconChevronDown />}
              >
                Save schema
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="center">
              <DropdownMenuItem className="space-x-2" onClick={() => copyToClipboard()}>
                <IconClipboard size={14} strokeWidth={2} />
                <p>Copy SQL</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="space-x-2" onClick={() => downloadSQL()}>
                <IconDownload size={14} strokeWidth={2} />
                <p>Download SQL</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="space-x-2" onClick={() => loadSQLInSupabase()}>
                <Image alt="supabase" src="/supabase.png" width={14} height={14} />
                <p>Load SQL in Supabase</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="border-r py-3" />
        </>
      )}

      <Button type="default" className="hidden xl:block">
        <Link href="/new">New conversation</Link>
      </Button>

      <ThemeSwitcherButton />

      {currentUser ? (
        <AvatarDropdown currentUser={currentUser} signout={signout} />
      ) : (
        <NoUserDropdown />
      )}
    </div>
  )
}

export default HeaderActions
