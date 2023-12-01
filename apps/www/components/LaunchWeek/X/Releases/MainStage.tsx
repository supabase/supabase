import * as React from 'react'
import { mainDays as days } from './data'

import SectionContainer from '~/components/Layouts/SectionContainer'
import DaySection from './components/DaySection'

export default function MainStage() {
  return (
    <>
      <SectionContainer className="!max-w-none !py-0 lg:!container">
        {days.map((day) => (
          <DaySection day={day} key={day.dd} />
        ))}
      </SectionContainer>
    </>
  )
}
