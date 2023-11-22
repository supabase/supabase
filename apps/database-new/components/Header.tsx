'use client'
import Link from 'next/link'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { useTheme } from 'next-themes'
import { LogIn, LogOut, MessagesSquare, Moon, Plus, Sun, User2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { UserMessage } from '@/lib/types'
import { Separator } from '@ui/components/Modal/Modal'

interface HeaderProps {
  selectedMessage?: UserMessage
  hideCode: boolean
  setHideCode: (value: boolean) => void
  showAllThreads: () => void
}

const Header = ({ selectedMessage, hideCode, setHideCode, showAllThreads }: HeaderProps) => {
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // [Joshen] Fetch user profile here
  const isLoggedIn = false

  return (
    <div className="bg-background border flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-1.5 font-mono">
          <span>database</span>
          <div className="w-1.5 h-1.5 rounded-full bg-purple-900"></div>
          <span>new</span>
        </div>
        {selectedMessage !== undefined && (
          <div className="border-l text-sm px-4">{selectedMessage.text}</div>
        )}
      </div>
      <div className="flex items-center gap-x-2">
        <Button type="default" onClick={() => setHideCode(!hideCode)}>
          {hideCode ? 'Show code' : 'Hide code'}
        </Button>

        {/* [Joshen] Hidden for now */}
        {/* <Button type="default" onClick={() => showAllThreads()}>
          Show all threads
        </Button> */}

        <div className="border-r py-3" />

        <Button type="default">
          <Link href="/new">New conversation</Link>
        </Button>

        <Button
          type="outline"
          className="px-1"
          icon={mounted && resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          onClick={() => (resolvedTheme === 'dark' ? setTheme('light') : setTheme('dark'))}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild className="flex">
            <Button type="outline" className="px-1" icon={<User2 size={16} />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-48">
            {isLoggedIn ? (
              <>
                <DropdownMenuItem className="space-x-2" onClick={() => {}}>
                  <MessagesSquare size={14} />
                  <p>View past conversations</p>
                </DropdownMenuItem>
                <Separator />
                <DropdownMenuItem className="space-x-2" onClick={() => {}}>
                  <LogOut size={14} />
                  <p>Sign out</p>
                </DropdownMenuItem>
              </>
            ) : (
              <div className="flex flex-col gap-y-2 p-2">
                <div className="text-xs">
                  Sign in to <span className="text-foreground">database.new</span> to save your
                  conversations!
                </div>
                <Button type="default" icon={<LogIn size={14} />}>
                  Sign in
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default Header
