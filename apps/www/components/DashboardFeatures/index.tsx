import React from 'react'
import SectionContainer from '../Layouts/SectionContainer'
import BigTabs from '../BigTabs'

const DashboardFeatures = (props: any) => {
  const { title, tabs } = props

  return (
    <SectionContainer className="text-center">
      <div className="relative mb-8 lg:mb-16">
        <h3 className="mb-8 text-2xl lg:text-4xl text-scale-1200">{title}</h3>
      </div>
      <div className="relative">
        <BigTabs tabs={tabs} />
      </div>
    </SectionContainer>
  )
}

export default DashboardFeatures
