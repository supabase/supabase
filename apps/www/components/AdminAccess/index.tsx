import React from 'react'
import ImageCarousel from '~/components/Carousels/ImageCarousel'
import SectionContainer from '~/components/Layouts/SectionContainer'

import AdminAccessData from 'data/home/admin-access.json'

const AdminAccess = () => {
  return (
    <SectionContainer>
      <div className="mb-16">
        <h2 className="h3">Build your app without leaving the dashboard</h2>
      </div>
      <ImageCarousel content={AdminAccessData} altTabView={true} />
    </SectionContainer>
  )
}

export default AdminAccess
