import { useState } from 'react'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ProductHeader from '~/components/Sections/ProductHeader'

import { Button, Tabs, Typography } from '@supabase/ui'

import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore, { Controller } from 'swiper'

// Import Swiper styles
import 'swiper/swiper.min.css'
import ImageCarousel from '~/components/Carousels/ImageCarousel'
import APISection from '~/components/Sections/APISection'
import GithubExamples from '~/components/Sections/GithubExamples'
import SplitCodeBlockCarousel from '~/components/Carousels/SplitCodeBlockCarousel'
import FloatingIcons from '~/components/FloatingIcons'

// install Swiper's Controller component
// SwiperCore.use([Controller])

function Database() {
  const [dashboardSwiper, setDashboardSwiper] = useState(undefined)
  const [dashboardSwiperActiveIndex, setDashboardSwiperActiveIndex] = useState(0)

  function handleDashboardSwiperNav(e: number) {
    setDashboardSwiperActiveIndex(e)
    // @ts-ignore
    dashboardSwiper.slideTo(e)
  }

  return (
    <DefaultLayout>
      <ProductHeader
        h1={[
          <span>
            A Database ready for millions
            <br /> and the weekend project
          </span>,
        ]}
        subheader={[
          'A postgres SQL database, trusted by 100,000s of developers, with built in row level security hosted on a dedicated instance.',
          'It is the industry standard database used by AWS architecture, data scientists and backend engineers.',
        ]}
      />

      {/* <SectionContainer>÷ */}
      <div className="grid">
        <SectionContainer className="text-center pb-8">
          <div className="grid grid-cols-12">
            <div className="col-span-8 col-start-3">
              <Typography.Title level={2}>Easy to update, maintain and grow </Typography.Title>
              <Typography.Text>
                <p className="text-lg">
                  Let your international customers pay with their preferred payment method, and
                  improve conversion. Stripe supports 135+ currencies and offers a unified API for
                  cards, wallets, bank debits, and more.
                </p>
              </Typography.Text>
            </div>
          </div>
        </SectionContainer>
        <div className={'dashboard-tabs'}>
          <Tabs
            size="xlarge"
            activeId={dashboardSwiperActiveIndex.toString()}
            onChange={(e: string) => handleDashboardSwiperNav(Number(e))}
            type="underlined"
            tabBarStyle={{
              marginBottom: 0,
              // borderBottom: '1px solid #dedede',
            }}
            // block
          >
            <Tabs.Panel id="0" label="Table editor">
              <span></span>
            </Tabs.Panel>
            <Tabs.Panel id="1" label="SQL editor">
              <span></span>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>

      <Swiper
        // @ts-ignore
        onSwiper={setDashboardSwiper}
        style={{ overflow: 'hidden' }}
        initialSlide={0}
        spaceBetween={0}
        slidesPerView={1}
        speed={800}
        allowTouchMove={false}
      >
        <div className="grid grid-cols-12">
          <SwiperSlide>
            <SectionContainer className="pt-16">
              <ImageCarousel />
            </SectionContainer>
          </SwiperSlide>
          <SwiperSlide>
            <SectionContainer className="pt-16">
              <ImageCarousel />
            </SectionContainer>
          </SwiperSlide>
        </div>
      </Swiper>
      <SectionContainer className="-mb-48">
        <APISection />
      </SectionContainer>

      <div className="relative">
        <div className="section--masked">
          <div className="section--bg-masked">
            <div className="section--bg border-t border-b border-gray-100 dark:border-gray-600"></div>
          </div>
          <div className="section-container pt-12 pb-0">
            <FloatingIcons />
            <div className="overflow-x-hidden">
              <SectionContainer className="mb-0 pb-8">
                <GithubExamples />
              </SectionContainer>
            </div>
          </div>
        </div>
      </div>

      <SectionContainer>
        <div className="grid grid-cols-12 lg:gap-16">
          <div className="col-span-12 lg:col-span-5 mb-8">
            <Typography.Title level={2}>No middleware user permission</Typography.Title>
            <p className="text-lg">
              Restrict user access with row level security, even without prior knowledge of SQL.
              Control who can create, edit and delete specific rows in your database.
            </p>
            <p>
              Set up user profiles in your app using methods such as auth.user() so you can spend
              more time building an app, rather than user profile forms.
            </p>
            <Button size="small" className="mt-4">
              Expore documentation
            </Button>
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <SplitCodeBlockCarousel />
          </div>
        </div>
      </SectionContainer>
    </DefaultLayout>
  )
}

export default Database
