import React, { useState } from 'react'
import Tabs from 'components/AdminAccess/tabs'
import SectionHeader from 'components/UI/SectionHeader'
import { useRouter } from 'next/router'
import SectionContainer from '../Layouts/SectionContainer'
import ImageCarousel from '../Carousels/ImageCarousel'

import TableViewCarouselData from 'data/products/database/table-view-carousel.json'
import { Typography } from '@supabase/ui'

import AdminAccessData from 'data/home/admin-access.json'

const AdminAccess = () => {
  const { basePath } = useRouter()
  const [tabId, setTabId] = useState('tabTableEditor')

  return (
    <SectionContainer>
      <div>
        <Typography.Title level={2} className="mb-16">
          Build your app without leaving the dashboard
        </Typography.Title>
      </div>
      <ImageCarousel content={AdminAccessData} altTabView={true} />
    </SectionContainer>
  )
}

export default AdminAccess
