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
    title: 'Database webhooks',
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
          subheader={[subtitle]}
          image={[
            <div className="header--light block w-full" key="light">
              <Image
                src={`${basePath}/images/product/functions/functions-hero.png`}
                alt="database header"
                layout="responsive"
                width="1680"
                height="1116"
              />
            </div>,
            <div className="header--dark mr-0 w-full dark:block" key="dark">
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
          <div className="col-span-12 mb-10 space-y-12 lg:col-span-3 lg:mb-0 ">
            <div className="grid gap-8 rounded md:grid-cols-2 xl:grid-cols-4">
              {featureBlocks.map((item) => {
                return (
                  <div className="bg-scale-100 dark:bg-scale-300 group flex flex-col gap-4 rounded border px-8 py-6">
                    <div className="bg-scale-300 dark:bg-scale-500 text-scale-1200 group-hover:text-brand-900 flex h-12 w-12 items-center justify-center rounded-md border transition-all group-hover:scale-105">
                      {item.icon ? item.icon : <IconCode strokeWidth={2} />}
                    </div>

                    <div>
                      <h3 className="text-scale-1200 text-lg">{item.title}</h3>
                      <p className="text-scale-900 text-sm">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </SectionContainer>

        <SectionContainer>
          <div className="col-span-12 mb-10 space-y-12 lg:col-span-3 lg:mb-0 ">
            <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-16">
              <div className="flex flex-col gap-8 lg:col-span-5">
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
                          'bg-scale-200 hover:bg-scale-100 hover:dark:bg-scale-300 group rounded-md border px-6 py-4 text-left transition-all hover:border' +
                          (active
                            ? ' dark:bg-scale-400 border-scale-500 bg-white'
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
                            'text-sm transition-colors ' +
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
              <div className="overflow-hidden lg:col-span-7">
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
                <div className="col-span-12 mt-0 flex lg:col-span-6 xl:col-span-12 xl:mb-8">
                  <p>
                    <p className="text-scale-1100 m-0">Libraries coming soon:</p>
                  </p>
                  <div className="ml-1 space-x-1">
                    <Badge dot={false}>Python</Badge>
                    <Badge dot={false}>Dart</Badge>
                    <Badge dot={false}>C#</Badge>
                    <Badge dot={false}>Kotlin</Badge>
                  </div>
                </div>
                <div
                  className="col-span-12 hidden lg:col-span-6 xl:col-span-10 xl:block"
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
