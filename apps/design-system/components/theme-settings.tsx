'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import SVG from 'react-inlinesvg'
import { RadioGroup_Shadcn_, RadioGroupLargeItem_Shadcn_, singleThemes, Theme } from 'ui'

function SingleThemeSelection({
  theme,
  setTheme,
}: {
  theme: string | undefined
  setTheme: (theme: string) => void
}) {
  return (
    <form className="py-8">
      <RadioGroup_Shadcn_
        name="theme"
        onValueChange={setTheme}
        aria-label="Choose a theme"
        defaultValue={theme}
        value={theme}
        className="flex flex-wrap gap-3"
      >
        {singleThemes.map((theme: Theme) => (
          <RadioGroupLargeItem_Shadcn_ key={theme.value} value={theme.value} label={theme.name}>
            <SVG src={`${process.env.NEXT_PUBLIC_BASE_PATH}/img/themes/${theme.value}.svg`} />
          </RadioGroupLargeItem_Shadcn_>
        ))}
      </RadioGroup_Shadcn_>
    </form>
  )
}

const ThemeSettings = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      <SingleThemeSelection theme={theme} setTheme={setTheme} />
    </>
  )
}

export { ThemeSettings }
