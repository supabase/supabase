import {
  Badge,
  Button,
  IconArrowUpRight,
  IconCode,
  IconShuffle,
  IconX,
  Radio,
  Space,
  Tabs,
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
import CodeBlock from '~/components/CodeBlock/CodeBlock'
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

const featureHighlights = [
  {
    title: 'Title of thing',
    description: 'Title of thing adasd adsdsdasdasd dsadasda adsdds',
  },
  {
    title: 'Title of thing',
    description: 'Title of thing adasd adsdsdasdasd dsadasda adsdds',
  },
  {
    title: 'Title of thing',
    description: 'Title of thing adasd adsdsdasdasd dsadasda adsdds',
  },
  {
    title: 'Title of thing',
    description: 'Title of thing adasd adsdsdasdasd dsadasda adsdds',
  },
  {
    title: 'Title of thing',
    description: 'Title of thing adasd adsdsdasdasd dsadasda adsdds',
  },
  {
    title: 'Title of thing',
    description: 'Title of thing adasd adsdsdasdasd dsadasda adsdds',
  },
]

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

  const title = 'Serverless Edge Functions that automatically scale'
  const subtitle = `Execute your code closest to your users with fast deploy times and low latency.`
  const meta_title = `${title}`
  const meta_description = subtitle

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/auth`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/product/database/database-og.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <ProductHeader
          icon={Solutions['edge-functions'].icon}
          title={Solutions['edge-functions'].name}
          h1={[<span key={'database-h1'}>{title}</span>]}
          subheader={[subtitle, 'PostgreSQL is one of the worlds most scalable databases.']}
          image={[
            <div className="w-full header--light block" key="light">
              <Image
                src={`${basePath}/images/product/database/header--light-2.png`}
                alt="database header"
                layout="responsive"
                width="1680"
                height="1116"
              />
            </div>,
            <div className="w-full header--dark mr-0 dark:block" key="dark">
              <Image
                src={`${basePath}/images/product/database/header--dark-2.png`}
                alt="database header"
                layout="responsive"
                width="1680"
                height="1116"
              />
            </div>,
          ]}
          documentation_url={'/docs/guides/database'}
        />

        <SectionContainer>
          <div
            className="mb-10 lg:mb-0 col-span-12 lg:col-span-3
          space-y-12
          "
          >
            <div className="grid grid-cols-12 gap-32">
              <div className="col-span-5 flex flex-col gap-8">
                <div>
                  <h3 className="h3">Anotomy of the Edge</h3>
                  <p className="p">
                    Create asynchronous tasks within minutes using Supabase Functions with easy
                    access to the rest of the Supabase Ecosystem.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button className="border rounded-md bg-scale-200 text-left px-6 py-4">
                    <div className="text-scale-1200">Title is here</div>
                    <div className="text-scale-1100">Description in here</div>
                  </button>
                  <button className="border rounded-md bg-scale-200 text-left px-6 py-4">
                    <div className="text-scale-1200">Title is here</div>
                    <div className="text-scale-1100">Description in here</div>
                  </button>
                  <button className="border rounded-md bg-scale-200 text-left px-6 py-4">
                    <div className="text-scale-1200">Title is here</div>
                    <div className="text-scale-1100">Description in here</div>
                  </button>
                  <button className="border rounded-md bg-scale-200 text-left px-6 py-4">
                    <div className="text-scale-1200">Title is here</div>
                    <div className="text-scale-1100">Description in here</div>
                  </button>
                </div>
              </div>
              <div className="col-span-7 overflow-hidden">
                <CodeBlock
                  showToolbar
                  hideCopy
                  style={{ maxHeight: '520px' }}
                  className=" translate-y-14"
                >{`import Container from 'components/Container'
import Layout from '~/components/Layouts/Default'
import Hero from 'components/Hero'

import Features from 'components/Features/index'
import BuiltExamples from 'components/BuiltWithSupabase/index'
// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'

type Props = {}

const Index = ({}: Props) => {
  return (
    <>
      <Layout>
        <Container>
          <Hero />
          <Features />
          <TwitterSocialSection />
          <BuiltExamples />
          <MadeForDevelopers />
          <AdminAccess />
          <CaseStudies />
          <CTABanner />
        </Container>
      </Layout>
    </>
  )
}

export default Index
`}</CodeBlock>
              </div>
            </div>
          </div>
        </SectionContainer>

        <SectionContainer>
          <div
            className="mb-10 lg:mb-0 col-span-12 lg:col-span-3
          space-y-12
          "
          >
            <div className="text-center">
              <h3 className="h2">This is a title</h3>
              <p className="p">This is a title</p>
            </div>

            <div className="grid grid-cols-3 gap-8 rounded">
              {featureHighlights.map((item) => {
                return (
                  <div
                    className="group px-8 py-6 bg-scale-100 border dark:bg-scale-300 rounded 
            flex flex-col gap-4"
                  >
                    <div
                      className="
                    h-12 w-12 bg-scale-300 border dark:bg-scale-500 rounded-md text-scale-1200 flex items-center justify-center
                    transition-all
                    group-hover:text-brand-900 group-hover:scale-105
                    "
                    >
                      <IconCode strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-lg text-scale-1200">{item.title}</h3>
                      <p className="text-sm text-scale-900">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </SectionContainer>

        <SectionContainer>
          <div className="grid grid-cols-12">
            <div className="mb-10 lg:mb-0 col-span-12 lg:col-span-3">
              <div className="mb-4 flex items-center space-x-2">
                <ProductIcon icon={Solutions['database'].icon} />
                <IconX />
                <img src={`${basePath}/images/product/database/postgresql-icon.svg`} width={30} />
              </div>
              <h4 className="h4">Just Postgres</h4>
              <p className="p">Every Supabase project is a dedicated Postgres database.</p>
              <p className="p text-sm">
                100% portable. Bring your existing Postgres database, or migrate away at any time.
              </p>
            </div>
            <div className="mb-10 lg:mb-0 col-span-12 lg:col-span-3 lg:col-start-5">
              <div className="mb-4 flex items-center space-x-2">
                <ProductIcon icon={Solutions['database'].icon} />
                <IconX />
                <ProductIcon icon={Solutions['authentication'].icon} />
              </div>

              <h4 className="h4">Built-in Auth</h4>
              <p className="p">Leveraging PostgreSQL's proven Row Level Security.</p>
              <p className="p text-sm">
                Integrated with JWT authentication which controls exactly what your users can
                access.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-3 lg:col-start-9">
              <div className="mb-4 flex items-center space-x-2">
                <ProductIcon icon={Solutions['database'].icon} />
                <IconX />
                <ProductIcon icon={'M13 10V3L4 14h7v7l9-11h-7z'} />
              </div>

              <h4 className="h4">Realtime enabled</h4>
              <p className="p">Data-change listeners over websockets.</p>
              <p className="p text-sm">
                Subscribe and react to database changes, milliseconds after they happen.
              </p>
            </div>
          </div>
        </SectionContainer>

        {/* <SectionContainer>÷ */}
        <SectionContainer className="text-center md:pb-0 lg:pb-0">
          <div className="grid grid-cols-12">
            <div className="col-span-12 lg:col-span-8 lg:col-start-3">
              <h2 className="h3">Easy to use dashboard</h2>

              <p className="p">
                The simplicity of a Table Editor, or the power of a SQL editor. Your choice.
              </p>
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
                      key="@Elsolo244"
                      img_url={`${basePath}/images/twitter-profiles/v6citnk33y2wpeyzrq05_400x400.jpeg`}
                      quote="Where has @supabase been all my life? 😍"
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
                      key="@jim_bisenius"
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
              <p key={0}>
                We introspect your database and provide instant APIs. Focus on building your
                product, while Supabase handles the CRUD.
              </p>,
            ]}
            footer={[
              <div className="grid grid-cols-12" key={0}>
                <div className="mt-0 col-span-12 lg:col-span-6 xl:col-span-12 xl:mb-8 flex">
                  <p>
                    <p className="m-0 text-scale-1100">Libraries coming soon:</p>
                  </p>
                  <div className="space-x-1 ml-1">
                    <Badge dot={false}>Python</Badge>
                    <Badge dot={false}>Dart</Badge>
                    <Badge dot={false}>C#</Badge>
                    <Badge dot={false}>Kotlin</Badge>
                  </div>
                </div>
                <div className="col-span-12 lg:col-span-6 xl:col-span-10 hidden xl:block" key={1}>
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
            documentation_link={'/docs/guides/database'}
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
              <h2 className="h3">Extend your database</h2>

              <p className="p">Supabase works natively with Postgres extensions.</p>
              <p className="p">
                Choose from a huge collection of Postgres extensions, enabled with a single click.
              </p>

              <FeatureColumn
                title="40+ preinstalled extensions"
                text="We only show a few of the extensions supported by supabase here, but we preinstall many more that you can use right away."
              />
              <Link href="/docs/guides/database" passHref>
                <Button as="a" size="small" type="default" icon={<IconArrowUpRight />}>
                  Explore documentation
                </Button>
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
