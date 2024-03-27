import React, { FC } from 'react'
import { mainDays } from './data'

import SectionContainer from '~/components/Layouts/SectionContainer'
import DaySection from './components/DaySection'
import LW11Day1 from '../LW11Day1'
import HackathonCallout from '../HackathonCallout'

const MainStage: FC = () => {
  const [day1, ...days] = mainDays

  return (
    <SectionContainer className="relative !max-w-none !py-0 lg:!container" id="main-stage">
      <LW11Day1 day={day1} className="mb-4 md:mb-8 md:-mx-4" />
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
