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
            src={`${basePath}/images/product/database/header--light.png`}
          />,
          <img
            className="w-full header--dark mr-0 dark:block"
            src={`${basePath}/images/product/database/header--light.png`}
          />,
        ]}
      />

      <SectionContainer>
        <div className="grid grid-cols-12">
          <div className="col-span-3">
            <p className="mb-4">
              <Space>
                <img src={`${basePath}/images/product/auth/google-icon.svg`} width={21} />
                <img src={`${basePath}/images/product/auth/facebook-icon.svg`} width={21} />
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32.58 31.77"
                    width={21}
                    className="text-gray-800 dark:text-white"
                  >
                    <path
                      fill="currentColor"
                      d="M16.29,0a16.29,16.29,0,0,0-5.15,31.75c.82.15,1.11-.36,1.11-.79s0-1.41,0-2.77C7.7,29.18,6.74,26,6.74,26a4.36,4.36,0,0,0-1.81-2.39c-1.47-1,.12-1,.12-1a3.43,3.43,0,0,1,2.49,1.68,3.48,3.48,0,0,0,4.74,1.36,3.46,3.46,0,0,1,1-2.18c-3.62-.41-7.42-1.81-7.42-8a6.3,6.3,0,0,1,1.67-4.37,5.94,5.94,0,0,1,.16-4.31s1.37-.44,4.48,1.67a15.41,15.41,0,0,1,8.16,0c3.11-2.11,4.47-1.67,4.47-1.67A5.91,5.91,0,0,1,25,11.07a6.3,6.3,0,0,1,1.67,4.37c0,6.26-3.81,7.63-7.44,8a3.85,3.85,0,0,1,1.11,3c0,2.18,0,3.94,0,4.47s.29.94,1.12.78A16.29,16.29,0,0,0,16.29,0Z"
                    />
                  </svg>
                </div>
                <img src={`${basePath}/images/product/auth/gitlab-icon.svg`} width={21} />
                <img src={`${basePath}/images/product/auth/bitbucket-icon.svg`} width={21} />
              </Space>
            </p>
            <Typography.Title level={4}>All the social providers</Typography.Title>
            <Typography.Text>
              <p className="text-lg">
                We provide all the popular social logins you expect. Google, Facebook, Github,
                Azure, Gitlab and Bitbucket.
              </p>
              <Space>
                <img src={`${basePath}/images/product/auth/twitter-icon.svg`} width={21} />
                <p className="m-0">
                  <span className="text-gray-800 dark:text-white">Twitter</span> coming soon
                </p>
              </Space>
            </Typography.Text>
          </div>
          <div className="col-span-3 col-start-5">
            <p className="mb-4">
              <IconLock />
            </p>
            <Typography.Title level={4}>Fully integrated</Typography.Title>
            <Typography.Text>
              <p className="text-lg">
                Auth built into your project, no external services (liek auth0)ZERO setup.
              </p>
              <p>
                Send authentication emails from your own custom domain.Set up once and all email
                templates will come from your desired email address.
              </p>
            </Typography.Text>
          </div>
          <div className="col-span-3 col-start-9">
            <p className="mb-4">
              <IconShield />
            </p>
            <Typography.Title level={4}>Own your data</Typography.Title>
            <Typography.Text>
              <p className="text-lg">
                Use media in your project without needing to reply on external services or learn new
                frameworks.
              </p>
              <p>Supabase is GDPR / CPA Compliant</p>
            </Typography.Text>
          </div>
        </div>
      </SectionContainer>

      {/* <SectionContainer>÷ */}
      <div className="grid">
        <SectionContainer className="text-center pb-8">
          <div className="grid grid-cols-12">
            <div className="col-span-8 col-start-3">
              <Typography.Title level={2}>Easy to use dashboard</Typography.Title>
              <Typography.Text>
                <p className="text-lg">
                  Use your database the way you want, with an interactive dashboard for both
                  spreadsheet style tables and also a full SQL editor.
                </p>
              </Typography.Text>
            </div>
          </div>
        </SectionContainer>
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
        speed={400}
        allowTouchMove={false}
      >
        <div className="grid grid-cols-12">
          <SwiperSlide>
            <SectionContainer className="pt-16">
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
            <SectionContainer className="pt-16">
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
              <SectionContainer className="mb-0 pb-8">
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
              <p className="text-lg">
                Your PostgreSQL database can be extended with any PostgreSQL extension.
              </p>
              <p>
                Install any extension you like, and even add your own as long as it's written in
                SQL.
              </p>
            </Typography.Text>
            <FeatureColumn
              title="40+ preinstalled extensions"
              text="We only show a few of the extensions supported by Supabase here, but we preinstall many more that you can use right away."
            />
            <Button size="small" className="mt-4" type="default" icon={<IconArrowUpRight />}>
              Expore documentation
            </Button>
          </div>
          <div className="mt-8 lg:mt-0 col-span-12 lg:col-span-6 lg:col-start-7">
            <SplitCodeBlockCarousel content={ExtensionsExamplesData} />
          </div>
        </div>
      </SectionContainer>
    </DefaultLayout>
  )
}

export default Database
