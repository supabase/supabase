import React from 'react'
import SectionContainer from '../Layouts/SectionContainer'
import ImageCarousel from '../Carousels/ImageCarousel'

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
