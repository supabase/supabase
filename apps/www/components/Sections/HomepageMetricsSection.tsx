import React from 'react'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface Props {}

function HomepageMetricsSection(props: Props) {
  return (
    <SectionContainer>
      <div className="flex flex-col text-center gap-4 items-center justify-center">
        <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">Metrics</h2>
      </div>
    </SectionContainer>
  )
}

export default HomepageMetricsSection
