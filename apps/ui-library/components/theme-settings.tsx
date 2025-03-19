'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import SVG from 'react-inlinesvg'
import { RadioGroupLargeItem_Shadcn_, RadioGroup_Shadcn_, Theme, singleThemes } from 'ui'

const ThemeSettings = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  /**
   * Avoid Hydration Mismatch
   * https://github.com/pacocoursey/next-themes?tab=readme-ov-file#avoid-hydration-mismatch
   */
  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  function SingleThemeSelection() {
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

  return (
    <>
      <SingleThemeSelection />
    </>
  )
}

export { ThemeSettings }
