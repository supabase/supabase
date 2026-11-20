'use client'

import { useTheme } from 'next-themes'
import SVG from 'react-inlinesvg'
import { cn } from 'ui'

import { BASE_PATH } from '@/lib/constants'

const HomepageSvgHandler = ({ name, className }: { name: string; className?: string }) => {
  const { resolvedTheme } = useTheme()

  return (
    <div>
      <SVG
        className={cn('h-32 w-auto', className)}
        src={`${BASE_PATH}/img/design-system-marks/${name}--${resolvedTheme}.svg`}
      />
    </div>
  )
}

export { HomepageSvgHandler }
