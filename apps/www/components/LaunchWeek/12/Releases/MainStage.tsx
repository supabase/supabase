import React from 'react'
import { mainDays } from './data'

import SectionContainer from '~/components/Layouts/SectionContainer'
import DaySection from './components/DaySection'
import { cn } from 'ui'
import { useTheme } from 'next-themes'

const MainStage = ({ className }: { className?: string }) => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme?.includes('dark')
  const days = mainDays(isDark!)

  return (
    <SectionContainer
      className={cn('relative !max-w-none !py-0 lg:!container', className)}
      id="main-stage"
    >
      <div>
        {days.map((day) => (
          <DaySection day={day} key={day.dd} />
        ))}
      </div>
    </SectionContainer>
  )
}

export default MainStage
