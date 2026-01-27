import { useTheme } from 'next-themes'
import React from 'react'
import { cn } from 'ui'

import DaySection from './components/DaySection'
import { mainDays } from './data'
import SectionContainer from '~/components/Layouts/SectionContainer'

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
