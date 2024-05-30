'use client'

import SVG from 'react-inlinesvg'
import { useTheme } from 'next-themes'

const HomepageSvgHandler = ({ name }: { name: string }) => {
  const { resolvedTheme } = useTheme()

  return (
    <div>
      <SVG
        className="h-32 w-auto"
        src={`${process.env.NEXT_PUBLIC_BASE_PATH}/img/design-system-marks/${name}--${resolvedTheme}.svg`}
      />
    </div>
  )
}

export { HomepageSvgHandler }
