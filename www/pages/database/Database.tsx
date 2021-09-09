import {
  Badge,
  Button,
  IconArrowUpRight,
  IconShuffle,
  IconX,
  Space,
  Tabs,
  Typography,
} from '@supabase/ui'
// data
import ApiExamplesData from 'data/products/database/api-examples'
import ExtensionsExamplesData from 'data/products/database/extensions-examples'
import SqlViewCarouselData from 'data/products/database/sql-view-carousel.json'
import TableViewCarouselData from 'data/products/database/table-view-carousel.json'
import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
// Import Swiper styles
import 'swiper/swiper.min.css'
import ImageCarousel from '~/components/Carousels/ImageCarousel'
import SplitCodeBlockCarousel from '~/components/Carousels/SplitCodeBlockCarousel'
import FeatureColumn from '~/components/FeatureColumn'
import FloatingIcons from '~/components/FloatingIcons'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ProductIcon from '~/components/ProductIcon'
import APISection from '~/components/Sections/APISection'
import GithubExamples from '~/components/Sections/GithubExamples'
import ProductHeader from '~/components/Sections/ProductHeader'
import TweetCard from '~/components/TweetCard'

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

  const meta_title = 'Database | Open source SQL Database'
  const meta_description =
    'With supabase’s APIs and easy to use dashboard, it makes designing relational databases easy.'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.io/auth`,
          images: [
            {
              url: `https://supabase.io${basePath}/images/product/database/database-og.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <ProductHeader
          icon={Solutions['database'].icon}
          title={Solutions['database'].name}
          h1={[
            <span key={'database-h1'}>
              Open Source SQL Database
              <br /> (without the hassle)
            </span>,
          ]}
          subheader={[
            'Every Supabase project is a dedicated PostgreSQL database, trusted by millions of developers.',
            'PostgreSQL is one of the worlds most scalable databases.',
          ]}
          image={[
            <div className="w-full header--light block">
              <Image
                src={`${basePath}/images/product/database/header--light-2.png`}
                alt="database header"
                layout="responsive"
                width="1680"
                height="1116"
              />
            </div>,
            <div className="w-full header--dark mr-0 dark:block">
              <Image
                src={`${basePath}/images/product/database/header--dark-2.png`}
                alt="database header"
                layout="responsive"
                width="1680"
                height="1116"
              />
            </div>,
          ]}
        />

        <SectionContainer>
          <div className="grid grid-cols-12">
            <div className="mb-10 lg:mb-0 col-span-12 lg:col-span-3">
              <Typography.Text>
                <p className="mb-4">
                  <Space>
                    <ProductIcon icon={Solutions['database'].icon} />
                    <IconX />
                    <img
                      src={`${basePath}/images/product/database/postgresql-icon.svg`}
                      width={30}
                    />
                  </Space>
                </p>
              </Typography.Text>
              <Typography.Title level={4}>Just Postgres</Typography.Title>
              <Typography.Text>
                <p className="text-base lg:text-lg">
                  Every Supabase project is a dedicated Postgres database.
                </p>
                <p>
                  100% portable. Bring your existing Postgres database, or migrate away at any time.
                </p>
              </Typography.Text>
            </div>
            <div className="mb-10 lg:mb-0 col-span-12 lg:col-span-3 lg:col-start-5">
              <Typography.Text>
                <p className="mb-4">
                  <Space>
                    <ProductIcon icon={Solutions['database'].icon} />
                    <IconX />
                    <ProductIcon icon={Solutions['authentication'].icon} />
                  </Space>
                </p>
              </Typography.Text>
              <Typography.Title level={4}>Built-in Auth</Typography.Title>
              <Typography.Text>
                <p className="text-base lg:text-lg">
                  Leveraging PostgreSQL's proven Row Level Security.
                </p>
                <p>
                  Integrated with JWT authentication which controls exactly what your users can
                  access.
                </p>
              </Typography.Text>
            </div>
            <div className="col-span-12 lg:col-span-3 lg:col-start-9">
              <Typography.Text>
                <p className="mb-4">
                  <Space>
                    <ProductIcon icon={Solutions['database'].icon} />
                    <IconX />
                    <ProductIcon icon={'M13 10V3L4 14h7v7l9-11h-7z'} />
                  </Space>
                </p>
              </Typography.Text>
              <Typography.Title level={4}>Realtime enabled</Typography.Title>
              <Typography.Text>
                <p className="text-base lg:text-lg">Data-change listeners over websockets.</p>
                <p>Subscribe and react to database changes, milliseconds after they happen.</p>
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
                  The simplicity of a Table Editor, or the power of a SQL editor. Your choice.
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
            <SwiperSlide key={0}>
              <SectionContainer className="pt-16 pb-0">
                <ImageCarousel
                  content={TableViewCarouselData}
                  footer={[
                    <TweetCard
                      handle="@Elsolo244"
                      img_url={`${basePath}/images/twitter-profiles/v6citnk33y2wpeyzrq05_400x400.jpeg`}
                      quote="Where has
                @supabase
                been all my life? 😍"
                    />,
                  ]}
                />
              </SectionContainer>
            </SwiperSlide>
            <SwiperSlide key={1}>
              <SectionContainer className="pt-16 pb-0">
                <ImageCarousel
                  content={SqlViewCarouselData}
                  footer={[
                    <TweetCard
                      handle="@jim_bisenius"
                      img_url={`${basePath}/images/twitter-profiles/rLgwUZSB_400x400.jpg`}
                      quote="@MongoDB or @MySQL?!?! Please, let me introduce you to @supabase and the wonderful world of @PostgreSQL before it's too late!!"
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
                We introspect your database and provide instant APIs. Focus on building your
                product, while Supabase handles the CRUD.
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
                  {/* <TweetCard
                    handle="@eunjae_lee"
                    img_url="https://pbs.twimg.com/profile_images/1188191474401320965/eGjSYbQd_400x400.jpg"
                    quote="So they just help me use @PostgreSQL better. They don't try to invent a wheel and trap me
          in it. Whereas they provide a good abstraction overall, they also provide a raw access to
          the database."
                  /> */}
                </div>
              </div>,
            ]}
            documentation_link={'https://supabase.io/docs/guides/database'}
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
                <p className="lg:text-lg">Supabase works natively with Postgres extensions.</p>
                <p>
                  Choose from a huge collection of Postgres extensions, enabled with a single click.
                </p>
              </Typography.Text>
              <FeatureColumn
                title="40+ preinstalled extensions"
                text="We only show a few of the extensions supported by supabase here, but we preinstall many more that you can use right away."
              />
              <Link
                href="https://supabase.io/docs/guides/database"
                as="https://supabase.io/docs/guides/database"
              >
                <a>
                  <Button size="small" className="mt-4" type="default" icon={<IconArrowUpRight />}>
                    Explore documentation
                  </Button>
                </a>
              </Link>
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
    </>
  )
}

export default Database
