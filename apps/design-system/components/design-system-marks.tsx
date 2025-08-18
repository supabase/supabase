'use client'

import SVG from 'react-inlinesvg'
import { useTheme } from 'next-themes'

function DesignSystemMarks() {
  const { resolvedTheme } = useTheme()

  const isDark = resolvedTheme?.includes('dark')

  return (
    <SVG
      className="h-4 w-auto"
      src={`${process.env.NEXT_PUBLIC_BASE_PATH}/img/design-system-marks/design-system-marks--${isDark ? 'dark' : 'light'}.svg`}
    />
  )
}

export { DesignSystemMarks }
