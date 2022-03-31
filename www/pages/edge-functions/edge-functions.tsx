import {
  Badge,
  Button,
  IconArrowUpRight,
  IconCode,
  IconFastForward,
  IconGlobe,
  IconLock,
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
import ScrollableCodeBlock from '~/components/ScrollableCodeBlock'
import APISection from '~/components/Sections/APISection'
import GithubExamples from '~/components/Sections/GithubExamples'
import ProductHeader from '~/components/Sections/ProductHeader'
import TweetCard from '~/components/TweetCard'

// install Swiper's Controller component
// SwiperCore.use([Controller])

const featureBlocks = [
  {
    title: 'Instant deployment',
    description: 'Deploy Edge Functions in seconds',
    highlightLines: '8',
    icon: <IconFastForward />,
  },
  {
    title: 'Global',
    description: 'Deployed to 29 regions worldwide',
    highlightLines: '8',
    icon: <IconGlobe />,
  },
  {
    title: 'Typescript ready',
    description: 'TypeScript, WASM, ES Modules',
    highlightLines: '8',
    img: 'typescript.svg',
  },
  {
    title: 'Async triggers',
    description: 'Invoke Edge Functions based on any event in your database',
    highlightLines: '28',
    badge: 'Coming soon',
  },
]

const featureHighlights = [
  {
    title: 'Run a function from anywhere',
    description: `It's as easy as running serve()`,
    highlightLines: '1,5',
  },
  {
    title: 'Set authentication',
    description: 'Use the JWT token to set the authentication of the user',
    highlightLines: '15..20',
  },
  {
    title: 'Use anything from Supabase',
    description:
      'supabase-js can interact with any part of the Supabase stack from Edge Functions, while respecting auth row level security policies.',
    highlightLines: '22..27',
  },
  {
    title: 'Use secrets to store senstive keys',
    description:
      'Set and edit secrets via the CLI, which can then be accessed via enviroment variables.',
    highlightLines: '7..13',
  },
  {
    title: 'No limits',
    description: `You're can empowered to run whatever logic you like using any data from the Supabase database.`,
    highlightLines: '29..39',
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

  const [currentSelection, setCurrentSelection] = useState(featureHighlights[0].highlightLines)

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
            <div className="block w-full header--light" key="light">
              <Image
                src={`${basePath}/images/product/database/header--light-2.png`}
                alt="database header"
                layout="responsive"
                width="1680"
                height="1116"
              />
            </div>,
            <div className="w-full mr-0 header--dark dark:block" key="dark">
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
          <div className="col-span-12 mb-10 space-y-12 lg:mb-0 lg:col-span-3 ">
            <div className="grid grid-cols-4 gap-8 rounded">
              {featureBlocks.map((item) => {
                return (
                  <div className="flex flex-col gap-4 px-8 py-6 border rounded group bg-scale-100 dark:bg-scale-300">
                    {item.img ? (
                      <img
                        src={`/images/product/functions/${item.img}`}
                        className="w-12 h-12 rounded-md"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-12 h-12 transition-all border rounded-md bg-scale-300 dark:bg-scale-500 text-scale-1200 group-hover:text-brand-900 group-hover:scale-105">
                        {item.icon ? item.icon : <IconCode strokeWidth={2} />}
                      </div>
                    )}
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
          <div className="col-span-12 mb-10 space-y-12 lg:mb-0 lg:col-span-3 ">
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-32 items-center">
              <div className="flex flex-col lg:col-span-5 gap-8">
                <div>
                  <h3 className="h2">Anatomy of the Edge</h3>
                  <p className="p">
                    Create asynchronous tasks within minutes using Supabase Functions with easy
                    access to the rest of the Supabase Ecosystem.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {featureHighlights.map((feat, i) => {
                    const active = currentSelection == feat.highlightLines
                    return (
                      <button
                        key={`featureHighlighted-${i}`}
                        className={
                          'group transition-all border px-6 py-4 text-left rounded-md bg-scale-200 hover:bg-scale-100 hover:dark:bg-scale-300 hover:boder' +
                          (active
                            ? ' bg-white dark:bg-scale-400 border-scale-500'
                            : ' border-scale-300')
                        }
                        onClick={() => setCurrentSelection(feat.highlightLines)}
                      >
                        <div
                          className={
                            'transition-colors ' +
                            (active
                              ? ' text-scale-1200'
                              : ' text-scale-900 group-hover:text-scale-1200')
                          }
                        >
                          {feat.title}
                        </div>
                        <div
                          className={
                            'transition-colors text-sm ' +
                            (active
                              ? ' text-scale-1100'
                              : ' text-scale-800 group-hover:text-scale-1100 ')
                          }
                        >
                          {feat.description}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="lg:col-span-7 overflow-hidden">
                <ScrollableCodeBlock
                  lang="ts"
                  highlightLines={currentSelection ? currentSelection : undefined}
                  showToolbar
                  hideCopy
                >
                  {`import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe?target=deno&no-check'
import { Customer } from 'types'

serve(async (req) => {
  try {
    // create a supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    // create a stripe client
    const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY'))

    // Get the authorization header from the request.
    const authHeader = req.headers.get('Authorization')!
    // Client now respects auth policies for this user
    supabaseClient.auth.setAuth(authHeader)
    // set the user profile
    const user = supabase.auth.user()

    // Retrieve user metadata that only the user is allowed to select
    const { data, error } = await supabaseClient
      .from<Customer>('user_profiles')
      .select('address, tax, billing_email, phone')

    if (error) throw error

    const customer = await stripe.customers.create({
      description: 'My First Stripe Customer (created by a Supabase edge function)',
      phone: data.phone,
      address: data.address,
      email: user.email,
    })

    return new Response(JSON.stringify(customer), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 400 })
  }
})`}
                </ScrollableCodeBlock>
              </div>
            </div>
          </div>
        </SectionContainer>

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
                <div className="flex col-span-12 mt-0 lg:col-span-6 xl:col-span-12 xl:mb-8">
                  <p>
                    <p className="m-0 text-scale-1100">Libraries coming soon:</p>
                  </p>
                  <div className="ml-1 space-x-1">
                    <Badge dot={false}>Python</Badge>
                    <Badge dot={false}>Dart</Badge>
                    <Badge dot={false}>C#</Badge>
                    <Badge dot={false}>Kotlin</Badge>
                  </div>
                </div>
                <div className="hidden col-span-12 lg:col-span-6 xl:col-span-10 xl:block" key={1}>
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
              <div className="border-t border-b border-gray-100 section--bg dark:border-gray-600"></div>
            </div>
            <div className="pt-12 pb-0 section-container">
              <FloatingIcons />
              <div className="overflow-x-hidden">
                <SectionContainer className="pb-8 mb-0 lg:pt-32">
                  <GithubExamples />
                </SectionContainer>
              </div>
            </div>
          </div>
        </div>

        <SectionContainer className="lg:py-48">
          <div className="grid grid-cols-12 lg:gap-16">
            <div className="col-span-12 mb-8 lg:col-span-6 xl:col-span-5">
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
            <div className="col-span-12 mt-8 lg:mt-0 lg:col-span-6 lg:col-start-7">
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
