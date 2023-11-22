'use client'
import { Button } from 'ui'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export default function ThemeSwitcherButton() {
  const { setTheme, resolvedTheme } = useTheme()
  return (
    <Button
      type="outline"
      className="px-1"
      icon={resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
      onClick={() => (resolvedTheme === 'dark' ? setTheme('light') : setTheme('dark'))}
    />
  )
}
