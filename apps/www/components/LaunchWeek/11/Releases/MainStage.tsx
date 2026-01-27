import { useTheme } from 'next-themes'
import React from 'react'
import { cn } from 'ui'

import HackathonCallout from '../HackathonCallout'
import LW11Day1 from '../LW11Day1'
import DaySection from './components/DaySection'
import { mainDays } from './data'
import SectionContainer from '~/components/Layouts/SectionContainer'

const MainStage = ({ className }: { className?: string }) => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme?.includes('dark')
  const [day1, ...days] = mainDays(isDark!)

  return (
    <SectionContainer
      className={cn('relative !max-w-none !py-0 lg:!container', className)}
      id="main-stage"
    >
      <LW11Day1 day={day1} className="!border-t-0" cardClassName="md:-mx-4" />
      <HackathonCallout />
      <div>
        {days.map((day) => (
          <DaySection day={day} key={day.dd} />
        ))}
      </div>
    </SectionContainer>
  )
}

export default MainStage
