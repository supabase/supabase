'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from 'ui'

export default function ThemeSwitcherButton() {
  // To circumvent hydration errors
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    mounted && (
      <Button
        type="outline"
        className="px-1"
        icon={resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
        onClick={() => (resolvedTheme === 'dark' ? setTheme('light') : setTheme('dark'))}
      />
    )
  )
}
