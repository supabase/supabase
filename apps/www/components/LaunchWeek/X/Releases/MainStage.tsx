import React, { FC } from 'react'
import { mainDays as days } from './data'

import SectionContainer from '~/components/Layouts/SectionContainer'
import DaySection from './components/DaySection'
import { TextLink } from 'ui'

const MainStage: FC = () => (
  <SectionContainer className="relative !max-w-none !py-0 lg:!container" id="main-stage">
    <h3 className="absolute -top-14 text-foreground uppercase font-mono pb-4 md:pb-8 text-lg tracking-[0.1rem]">
      Main Stage
    </h3>
    <div className="font-mono uppercase tracking-[1px] py-8 border-t border-[#111718] text-[#575E61] scroll-mt-16 flex flex-col md:flex-row justify-between gap-2">
      <div className="!text-foreground [&_*]:text-foreground text-sm flex flex-col sm:flex-row sm:items-center sm:gap-3">
        Hackathon finished
      </div>
      <div className="!m-0 flex items-center">
        <TextLink
          label="See the winners"
          url="/blog/supabase-hackathon-lwx"
          target="_blank"
          hasChevron
          className="m-0"
        />
      </div>
    </div>
    <div>
      {days.map((day) => (
        <DaySection day={day} key={day.dd} />
      ))}
    </div>
  </SectionContainer>
)

export default MainStage
