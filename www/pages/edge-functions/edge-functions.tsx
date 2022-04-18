import { Badge, IconCode, IconFastForward, IconGlobe, IconRefreshCcw } from '@supabase/ui'
import UseCaseExamples from 'data/products/functions/usecase-examples'
import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState } from 'react'
import 'swiper/swiper.min.css'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ScrollableCodeBlock from '~/components/ScrollableCodeBlock'
import FunctionsUsecases from '~/components/Sections/FunctionsUsecases'
import ProductHeader from '~/components/Sections/ProductHeader'

const featureBlocks = [
  {
    title: 'Instant deployment',
    description: 'Deploy Edge Functions in seconds',
    highlightLines: '8',
    icon: <IconFastForward strokeWidth={1.5} />,
  },
  {
    title: 'Global',
    description: 'Deployed to 29 regions worldwide',
    highlightLines: '8',
    icon: <IconGlobe strokeWidth={1.5} />,
  },
  {
    title: 'Typescript ready',
    description: 'TypeScript, WASM, ES Modules',
    highlightLines: '8',
    icon: <IconCode strokeWidth={1.5} />,
  },
  {
    title: 'Async triggers',
    description: 'Invoke Edge Functions based on any event in your database',
    highlightLines: '28',
    icon: <IconRefreshCcw strokeWidth={1.5} />,
    badge: 'Coming soon',
  },
]

const featureHighlights = [
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
    title: 'Use secrets to store sensitive keys',
    description:
      'Set and edit secrets via the CLI, which can then be accessed via environment variables.',
    highlightLines: '7..13',
  },
  {
    title: 'No limits',
    description: `You're empowered to run any logic you like using any data from the Supabase database.`,
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
          url: `https://supabase.com/edge-functions`,
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
          h1={[
            <span key={'database-h1'}>
              Serverless Edge Functions
              <br /> that automatically scale
            </span>,
          ]}
          subheader={[subtitle, 'PostgreSQL is one of the worlds most scalable databases.']}
          image={[
            <div className="block w-full header--light" key="light">
              <Image
                src={`${basePath}/images/product/functions/functions-hero.png`}
                alt="database header"
                layout="responsive"
                width="1680"
                height="1116"
              />
            </div>,
            <div className="w-full mr-0 header--dark dark:block" key="dark">
              <Image
                src={`${basePath}/images/product/functions/functions-hero.png`}
                alt="database header"
                layout="responsive"
                width="1680"
                height="1116"
              />
            </div>,
          ]}
          documentation_url={'/docs/guides/functions'}
        />

        <SectionContainer>
          <div className="col-span-12 mb-10 space-y-12 lg:mb-0 lg:col-span-3 ">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 rounded">
              {featureBlocks.map((item) => {
                return (
                  <div className="flex flex-col gap-4 px-8 py-6 border rounded group bg-scale-100 dark:bg-scale-300">
                    <div className="flex items-center justify-center w-12 h-12 transition-all border rounded-md bg-scale-300 dark:bg-scale-500 text-scale-1200 group-hover:text-brand-900 group-hover:scale-105">
                      {item.icon ? item.icon : <IconCode strokeWidth={2} />}
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
          <div className="col-span-12 mb-10 space-y-12 lg:mb-0 lg:col-span-3 ">
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-32 items-center">
              <div className="flex flex-col lg:col-span-5 gap-8">
                <div>
                  <h3 className="h3">Anatomy of an Edge Function</h3>
                  <p className="p">
                    Asynchronous tasks within minutes using Supabase Functions with simple
                    authenticated access to the rest of the Supabase Ecosystem.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {featureHighlights.map((feat, i) => {
                    const active = currentSelection == feat.highlightLines
                    return (
                      <button
                        key={`featureHighlighted-${i}`}
                        className={
                          'group transition-all border px-6 py-4 text-left rounded-md bg-scale-200 hover:bg-scale-100 hover:dark:bg-scale-300 hover:border' +
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
                  highlightLines={currentSelection}
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
    const authHeader = req.headers.get('Authorization').replace("Bearer ","")
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

        <SectionContainer className="-mb-16">
          <FunctionsUsecases
            // @ts-ignore
            content={UseCaseExamples}
            title="Use functions for every server side function"
            text={[
              <p key={0}>
                Edge Functions are perfect for running code for sensitive use cases or interacting
                with 3rd party services.
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
                <div
                  className="col-span-12 lg:col-span-6 xl:col-span-10 hidden xl:block"
                  key={1}
                ></div>
              </div>,
            ]}
            documentation_link={'/docs/guides/functions'}
          />
        </SectionContainer>

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default Database
