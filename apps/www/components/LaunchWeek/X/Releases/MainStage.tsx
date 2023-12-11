import React, { FC } from 'react'
import { mainDays as days } from './data'

import SectionContainer from '~/components/Layouts/SectionContainer'
import DaySection from './components/DaySection'

const MainStage: FC = () => (
  <SectionContainer className="relative !max-w-none !py-0 lg:!container" id="main-stage">
    <h3 className="absolute -top-14 text-foreground uppercase font-mono pb-4 md:pb-8 text-lg tracking-[0.1rem]">
      Main Stage
    </h3>
    <div>
      {days.map((day) => (
        <DaySection day={day} key={day.dd} />
      ))}
    </div>
  </SectionContainer>
)

export default MainStage
