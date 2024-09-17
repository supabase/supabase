import React from 'react'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TabsWithHighlights from '~/components/TabsWithHighlights'
import type { Tab } from '~/components/TabsWithHighlights'

interface Props {
  title: string | React.ReactNode
  tabs: Tab[]
}

const DashboardFeatures: React.FC<Props> = ({ title, tabs }) => (
  <SectionContainer className="text-center" id="dashboard">
    <h3 className="mb-8 text-2xl lg:text-4xl text-foreground-lighter">{title}</h3>
    <TabsWithHighlights tabs={tabs} />
  </SectionContainer>
)

export default DashboardFeatures
