import { useEffect, useState } from 'react'
import { Menu } from '@supabase/ui'
import { useTheme } from 'next-themes'
import { IconSun, IconMoon } from '@supabase/ui'
const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted ? (
    <button
      className="w-full flex justify-between"
      onClick={() => setTheme(resolvedTheme == 'dark' ? 'light' : 'dark')}
    >
      {resolvedTheme == 'dark' ? <span>Light Mode</span> : <span>Dark Mode</span>}
      {resolvedTheme == 'dark' ? <IconSun /> : <IconMoon />}
    </button>
  ) : (
    <span />
  )
}

export default ThemeToggle
