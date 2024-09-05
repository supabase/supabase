import React from 'react'
import SectionContainer from '~/components/Layouts/SectionContainer'
import BigTabs from '~/components/BigTabs'
import type { Tab } from '~/components/BigTabs'

interface Props {
  title: string | React.ReactNode
  tabs: Tab[]
}

const DashboardFeatures: React.FC<Props> = ({ title, tabs }) => (
  <SectionContainer className="text-center !pb-0" id="dashboard">
    <div className="relative mb-8 lg:mb-0">
      <h3 className="mb-8 text-2xl lg:text-4xl text-foreground-lighter">{title}</h3>
    </div>
    <div className="relative">
      <BigTabs tabs={tabs} />
    </div>
  </SectionContainer>
)

export default DashboardFeatures
