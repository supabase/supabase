import Head from 'next/head'
import Container from 'components/Container'
import Layout from 'components/Layout'
import CountUp from 'components/CountUp'

import { APP_NAME, DESCRIPTION } from 'lib/constants'

import { AlphaNumbers, IntroductionSegments } from 'data/BetaPage'

const site_title = `${APP_NAME} | We are now in Beta`

type SectionHeaderProps = {
  sectionNumber: number,
  header: string
}

const SectionHeader = (props: SectionHeaderProps) => {
  const { sectionNumber, header } = props
  return (
    <div className="col-span-12">
      <span className="block font-mono text-3xl text-dark-300 mb-3">0{sectionNumber}</span>
      <h3 className="text-6xl">{header}</h3>
    </div>
  )
}

const Hero = () => (
  <div className="w-screen h-screen bg-dark-500 flex items-center justify-center text-white">
    TBD, scroll down first
  </div>
)

const Introduction = () => (
  <div className="bg-gray-50">
    <div className="container mx-auto px-28 py-20 grid grid-cols-12 gap-4">

      <div className="col-span-7 text-base mb-20">
        <p>
          After the launch of our <span className="text-brand-700">Alpha</span> Program
          in June, we've been fortunate to work with thousands of early adopters
          on improving both our Open Source, and Hosted offerings.
        </p>
      </div>

      <div className="col-span-12 text-base mb-10">
        <p className="w-60 pb-2 border-b-2 border-dark-100">
          Alpha Program in Numbers
        </p>
      </div>

      <div className="col-span-12 grid grid-cols-12 gap-y-20 mb-20">
        {AlphaNumbers.map((stat: any, idx: number) => (
          <div key={`stat_${idx}`} className="col-span-4 grid grid-cols-12 gap-x-6 items-center">
            <div className="col-span-2">
              <div className="w-12 h-12 rounded-md bg-dark-700 flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
            <div className="col-span-10">
              <p className="text-6xl">
                <CountUp>{stat.value}</CountUp>
                {stat.unit && <span className="text-2xl ml-1">{stat.unit}</span>}
              </p>
            </div>
            <div className="col-span-10 col-start-3">
              <p className="text-dark-300">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="col-span-12 grid grid-cols-12 gap-y-10">
        {IntroductionSegments.map((segment: any, segmentIdx: number) => (
          <>
            <div key={`introSegment_${segmentIdx}`} className="col-span-4">
              {segment.description}
            </div>
            <div className="col-span-2" />
            <div className="col-span-6 flex flex-col">
              {segment.chapters.map((chapter: string, idx: number) => (
                <div className="flex items-center mb-5">
                  <p className="font-mono text-xs text-dark-300">{`0${idx + 1}`}</p>
                  <p className="ml-4 text-base border-b border-gray-400 cursor-pointer">{chapter}</p>
                </div>
              ))}
            </div>
          </>
        ))}
      </div>

    </div>
  </div>
)

const Performance = () => (
  <div className="bg-white">
    <div className="container mx-auto px-28 py-20 grid grid-cols-12 gap-y-10">
      <SectionHeader sectionNumber={1} header="Performance" />
      
      <div className="col-span-12 grid grid-cols-12 gap-x-8 mb-10">
        <div className="col-span-7 text-base">
          <p className="mb-10">
            Supabase grew out of a need for a faster and more scalable web-ready datastore.
            Postgres enables our users to handle massive amounts of data without sacrificing read and write speed.
          </p>
          <p className="mb-10">
            During our Alpha program we have been obsessively tweaking our stack to tease out superior performance.
            We chose the hyper-scalable <a href="#" className="text-brand-700">Elixer</a> to handle our <a href="#" className="text-brand-700">Realtime engine</a>,
            and have supported the <a href="#" className="text-brand-700">PostgREST</a> team while they improved the
            performance of their auto-generated CRUD APIs.
          </p>
          <p>
            We are proud to publish the results of our benchmarks here and we'll continue to seek gains throughout
            our Beta program and beyond. Our <a href="#" className="text-brand-700">benchmarks</a> are Open Source,
            and we are seeking contributors to help maintain our code and improve on our methodologies.
          </p>
        </div>
      </div>

      <div className="col-span-12 bg-dark-200 flex items-center justify-center py-64 text-center mb-10">
        Benchmark graph goes here
      </div>

      <div className="col-span-12 grid grid-cols-12 gap-x-8">
        <div className="col-span-7 text-base">
          <p className="mb-10">
          Supabase is now available in 7 different geographic regions, so you can reduce latency by deploying in close
          proximity to your customer base.
          </p>
          <p className="mb-10">
          A key metric in how we measure Supabase is what we call "Time to Value". How fast can a user go from sign up,
          to making their first API request? How fast can they from being in Production and generating value for their
          own customers? We've made several case studies available on our website here, with a special focus on how Supabase
          enables them to build and scale their product in as little time as possible.
          </p>
        </div>
        <div className="col-span-6"></div>
      </div>

    </div>
  </div>
)

const Security = () => (
  <div className="bg-gray-50">
    <div className="container mx-auto px-28 py-12">
      <SectionHeader sectionNumber={2} header="Security" />
    </div>
  </div>
)

const Reliability = () => (
  <div className="bg-white">
    <div className="container mx-auto px-28 py-12">
      <SectionHeader sectionNumber={3} header="Reliability" />
    </div>
  </div>
)

const NewFeaturesAndIntegrations = () => (
  <div className="bg-white">
    <div className="container mx-auto px-28 py-12">
      <SectionHeader sectionNumber={4} header="New Features & Integrations" />
    </div>
  </div>
)

const BetaPricing = () => (
  <div className="bg-gray-50">
    <div className="container mx-auto px-28 py-12">
      <SectionHeader sectionNumber={5} header="Beta Pricing" />
    </div>
  </div>
)

const OpenSource = () => (
  <div className="bg-white">
    <div className="container mx-auto px-28 py-12">
      <SectionHeader sectionNumber={6} header="Open Source" />
    </div>
  </div>
)

// Skip this segment first
const FundingPartners = () => (
  <div></div>
)

const ScalingOurTeam = () => (
  <div className="bg-gray-50">
    <div className="container mx-auto px-28 py-12">
      <SectionHeader sectionNumber={8} header="Scaling Our Team" />
    </div>
  </div>
)

const WhatsNext = () => (
  <div className="bg-white">
    <div className="container mx-auto px-28 py-12">
      <SectionHeader sectionNumber={9} header="What's Next" />
    </div>
  </div>
)

const Beta = () => {
  return (
    <Layout hideHeader={true}>
      <Head>
        <title>{site_title}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta name="og:title" property="og:title" content={site_title} />
        <meta name="og:description" property="og:description" content={DESCRIPTION} />
        <meta property="og:site_name" content="" />
        <meta property="og:url" content="/public/og/og-image.jpg" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="" />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:site" content={site_title} />
        <meta name="twitter:creator" content="supabase_io" />
        <link rel="icon" type="image/png" href="/public/favicon/favicon.ico" />
        <link rel="apple-touch-icon" href="/public/favicon/favicon.ico" />
        <meta property="og:image" content="/public/og/og-image.jpg" />
        <meta name="twitter:image" content="/public/og/og-image.jpg" />
      </Head>
      <Container>
        <Hero />
        <Introduction />
        <Performance />
        <Security />
        <Reliability />
        <NewFeaturesAndIntegrations />
        <BetaPricing />
        <OpenSource />
        <ScalingOurTeam />
        <WhatsNext />
      </Container>
    </Layout>
  )
}

export default Beta