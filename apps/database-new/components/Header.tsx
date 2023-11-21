'use client'
import Link from 'next/link'
import { Button } from 'ui'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

interface HeaderProps {
  hideChat: boolean
  setHideChat: (value: boolean) => void
}

const Header = ({ hideChat, setHideChat }: HeaderProps) => {
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="bg-background border flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-1.5 font-mono">
          <span>database</span>
          <div className="w-1.5 h-1.5 rounded-full bg-purple-900"></div>
          <span>new</span>
        </div>
        <Button type="default" onClick={() => setHideChat(!hideChat)}>
          {hideChat ? 'Show chat' : 'Hide chat'}
        </Button>
      </div>
      <div className="flex items-center gap-x-4">
        <Button type="default">
          <Link href="/new">New conversation</Link>
        </Button>

        {mounted && (
          <Button
            type="outline"
            className="px-1"
            icon={resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            onClick={() => (resolvedTheme === 'dark' ? setTheme('light') : setTheme('dark'))}
          />
        )}
      </div>
    </div>
  )
}

export default Header
