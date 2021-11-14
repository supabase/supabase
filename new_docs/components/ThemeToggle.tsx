import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { IconSun, IconMoon } from '@supabase/ui'
const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  return (
    <button
      className="w-full flex justify-between"
      onClick={() => setTheme(resolvedTheme == 'dark' ? 'light' : 'dark')}
    >
      {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      {resolvedTheme === 'dark' ? <IconSun /> : <IconMoon />}
    </button>
  )
}

export default ThemeToggle
