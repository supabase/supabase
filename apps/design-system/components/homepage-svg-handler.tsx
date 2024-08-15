'use client'

import SVG from 'react-inlinesvg'
import { useTheme } from 'next-themes'
import { cn } from 'ui'

const HomepageSvgHandler = ({ name, className }: { name: string; className?: string }) => {
  const { resolvedTheme } = useTheme()

  return (
    <div>
      <SVG
        className={cn('h-32 w-auto', className)}
        src={`${process.env.NEXT_PUBLIC_BASE_PATH}/img/design-system-marks/${name}--${resolvedTheme}.svg`}
      />
    </div>
  )
}

export { HomepageSvgHandler }
