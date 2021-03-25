import { useState } from 'react'
import { useRouter } from 'next/router'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ProductHeader from '~/components/Sections/ProductHeader'

import {
  Badge,
  Button,
  IconArrowUpRight,
  IconLock,
  IconShield,
  IconShuffle,
  IconX,
  Space,
  Tabs,
  Typography,
} from '@supabase/ui'

import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore, { Controller } from 'swiper'

// Import Swiper styles
import 'swiper/swiper.min.css'
import ImageCarousel from '~/components/Carousels/ImageCarousel'
import APISection from '~/components/Sections/APISection'
import GithubExamples from '~/components/Sections/GithubExamples'
import SplitCodeBlockCarousel from '~/components/Carousels/SplitCodeBlockCarousel'
import FloatingIcons from '~/components/FloatingIcons'

// data
import ApiExamplesData from 'data/products/database/api-examples'
import ExtensionsExamplesData from 'data/products/database/extensions-examples'

import TableViewCarouselData from 'data/products/database/table-view-carousel.json'
import SqlViewCarouselData from 'data/products/database/sql-view-carousel.json'

import TweetCard from '~/components/TweetCard'
import FeatureColumn from '~/components/FeatureColumn'

import Solutions from 'data/Solutions.json'
import ProductIcon from '~/components/ProductIcon'

// install Swiper's Controller component
// SwiperCore.use([Controller])

function Database() {
  // base path for images
  const { basePath } = useRouter()

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
        icon={Solutions['database'].icon}
        title={Solutions['database'].name}
        h1={[
          <span>
            Open source SQL Database
            <br /> (without the hassle)
          </span>,
        ]}
        subheader={[
          'Every supabase project has a dedicated PostgreSQL database, trusted by millions of developers, with built in row level security.',
          'PostgreSQL is the industry standard database used by AWS architecture, data scientists and backend engineers. ',
        ]}
        image={[
          <img
            className="w-full header--light block"
            src={`${basePath}/images/product/database/header--light-2.png`}
          />,
          <img
            className="w-full header--dark mr-0 dark:block"
            src={`${basePath}/images/product/database/header--dark-2.png`}
          />,
        ]}
      />

      <SectionContainer>
        <div className="grid grid-cols-12">
          <div className="mb-10 lg:mb-0 col-span-12 lg:col-span-3">
            <p className="mb-4">
              <Space>
                <ProductIcon icon={Solutions['database'].icon} />
                <IconX />
                <img src={`${basePath}/images/product/database/postgresql-icon.svg`} width={30} />
              </Space>
            </p>
            <Typography.Title level={4}>PostgreSQL Relational</Typography.Title>
            <Typography.Text>
              <p className="text-base lg:text-lg">
                Our database is PostgreSQL, which is an open source object-relational database.
              </p>
              <p>
                With supabase’s APIs and easy to use dashboard, it makes designing relational
                databases easy.
              </p>
            </Typography.Text>
          </div>
          <div className="mb-10 lg:mb-0 col-span-12 lg:col-span-3 lg:col-start-5">
            <p className="mb-4">
              <Space>
                <ProductIcon icon={Solutions['database'].icon} />
                <IconX />
                <ProductIcon icon={Solutions['authentication'].icon} />
              </Space>
            </p>
            <Typography.Title level={4}>Auth</Typography.Title>
            <Typography.Text>
              <p className="text-base lg:text-lg">Auth permissions built in with supabase Auth</p>
              <p>Control exactly which user roles can read or write what rows in your database.</p>
            </Typography.Text>
          </div>
          <div className="col-span-12 lg:col-span-3 lg:col-start-9">
            <p className="mb-4">
              <IconShuffle />
            </p>
            <Typography.Title level={4}>Realtime</Typography.Title>
            <Typography.Text>
              <p className="text-base lg:text-lg">
                We built realtime functionality right into the database.
              </p>
              <p>
                Our powerful APIs allow you to watch for specific row and column changes so you can
                easily make smart apps quicker.
              </p>
            </Typography.Text>
          </div>
        </div>
      </SectionContainer>

      {/* <SectionContainer>÷ */}
      <SectionContainer className="text-center md:pb-0 lg:pb-0">
        <div className="grid grid-cols-12">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3">
            <Typography.Title level={2}>Easy to use dashboard</Typography.Title>
            <Typography.Text>
              <p className="text-base lg:text-lg">
                Use your database the way you want, with an interactive dashboard for both
                spreadsheet style tables and also a full SQL editor.
              </p>
            </Typography.Text>
          </div>
        </div>
      </SectionContainer>
      <div className="grid">
        <div className={'dashboard-tabs sbui-tabs--underline-alt'}>
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
        speed={300}
        allowTouchMove={false}
      >
        <div className="grid grid-cols-12">
          <SwiperSlide>
            <SectionContainer className="pt-16 pb-0">
              <ImageCarousel
                content={TableViewCarouselData}
                footer={[
                  <TweetCard
                    handle="@Elsolo244"
                    img_url="https://pbs.twimg.com/profile_images/2486328968/v6citnk33y2wpeyzrq05_400x400.jpeg"
                    quote="Where has
                @supabase_io
                been all my life? 😍"
                  />,
                ]}
              />
            </SectionContainer>
          </SwiperSlide>
          <SwiperSlide>
            <SectionContainer className="pt-16 pb-0">
              <ImageCarousel
                content={SqlViewCarouselData}
                footer={[
                  <TweetCard
                    handle="@jim_bisenius"
                    img_url="https://pbs.twimg.com/profile_images/1372987165869760513/rLgwUZSB_400x400.jpg"
                    quote="@MongoDB or @MySQL?!?! Please, let me introduce you to @supabase_io and the wonderful world of @PostgreSQL before it's too late!!"
                  />,
                ]}
              />
            </SectionContainer>
          </SwiperSlide>
        </div>
      </Swiper>

      <SectionContainer className="-mb-48">
        <APISection
          // @ts-ignore
          content={ApiExamplesData}
          title="Never write an API again"
          text={[
            <p>
              We inspect your database and provide APIs instantly so you can stop building
              repetitive CRUD endpoints and focus on your product.
            </p>,
          ]}
          footer={[
            <div className="grid grid-cols-12">
              <div className="mt-0 col-span-12 lg:col-span-6 xl:col-span-12 xl:mb-8">
                <Space>
                  <Typography.Text type="secondary">
                    <p className="m-0">Libraries coming soon:</p>{' '}
                  </Typography.Text>
                  <Badge dot={false} color="blue">
                    Python
                  </Badge>
                  <Badge dot={false} color="blue">
                    Dart
                  </Badge>
                  <Badge dot={false} color="blue">
                    C#
                  </Badge>
                  <Badge dot={false} color="blue">
                    Kotlin
                  </Badge>
                </Space>
              </div>
              <div className="col-span-12 lg:col-span-6 xl:col-span-10 hidden xl:block">
                <TweetCard
                  handle="@eunjae_lee"
                  img_url="https://pbs.twimg.com/profile_images/1188191474401320965/eGjSYbQd_400x400.jpg"
                  quote="So they just help me use @PostgreSQL better. They don't try to invent a wheel and trap me
          in it. Whereas they provide a good abstraction overall, they also provide a raw access to
          the database."
                />
              </div>
            </div>,
          ]}
        />
      </SectionContainer>

      <div className="relative">
        <div className="section--masked">
          <div className="section--bg-masked">
            <div className="section--bg border-t border-b border-gray-100 dark:border-gray-600"></div>
          </div>
          <div className="section-container pt-12 pb-0">
            <FloatingIcons />
            <div className="overflow-x-hidden">
              <SectionContainer className="mb-0 pb-8 lg:pt-32">
                <GithubExamples />
              </SectionContainer>
            </div>
          </div>
        </div>
      </div>

      <SectionContainer className="lg:py-48">
        <div className="grid grid-cols-12 lg:gap-16">
          <div className="col-span-12 lg:col-span-6 xl:col-span-5 mb-8">
            <Typography.Title level={2}>Extend your database</Typography.Title>
            <Typography.Text className="block mb-8">
              <p className="lg:text-lg">
                Your PostgreSQL database can be extended with any PostgreSQL extension.
              </p>
              <p>
                Install any extension you like, and even add your own as long as it's written in
                SQL.
              </p>
            </Typography.Text>
            <FeatureColumn
              title="40+ preinstalled extensions"
              text="We only show a few of the extensions supported by supabase here, but we preinstall many more that you can use right away."
            />
            <Button size="small" className="mt-4" type="default" icon={<IconArrowUpRight />}>
              Expore documentation
            </Button>
          </div>
          <div className="mt-8 lg:mt-0 col-span-12 lg:col-span-6 lg:col-start-7">
            <SplitCodeBlockCarousel
              // @ts-ignore
              content={ExtensionsExamplesData}
            />
          </div>
        </div>
      </SectionContainer>
    </DefaultLayout>
  )
}

export default Database
