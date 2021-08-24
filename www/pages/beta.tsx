import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Container from 'components/Container'
import Layout from '~/components/Layouts/Default'
import CountUp from 'components/CountUp'
import FlyOut from 'components/UI/FlyOut'
import CTABanner from 'components/CTABanner/index'
import { APP_NAME, DESCRIPTION } from 'lib/constants'
import { AlphaNumbers, IntroductionSegments, PerformanceComparisonData } from 'data/BetaPage'
import { render } from 'react-dom'
import Link from 'next/link'
import { addBasePath } from 'next/dist/next-server/lib/router/router'

import { NextSeo } from 'next-seo'
import authors from 'lib/authors.json'

const site_title = `${APP_NAME} | We are now in Beta`

// Dark text: text-dark-400
// Light text: text-dark-300

const NavFlyOutMenu = (props: any) => {
  const { scrollTo } = props
  const segments = IntroductionSegments.map((segment: any) => segment.chapters)

  return (
    <>
      <div className="col-span-12 grid grid-cols-12 items-center border-dark-300 dark:border-dark-400 sm:border-r border-b border-dashed">
        {segments.flat().map((segment: any) => (
          <div
            key={segment.key}
            onClick={() => scrollTo(segment.key)}
            className={`
              col-span-12 lg:col-span-4 px-4 lg:px-6 py-4 lg:py-10 text-dark-300 dark:text-dark-400 cursor-pointer bg-white dark:bg-dark-600
              hover:bg-dark-100 dark:hover:bg-dark-500 border-dark-300 dark:border-dark-400 border-t sm:border-l border-dashed`}
          >
            <p className="flex items-center text-black dark:text-white">
              <span className="font-mono text-xs text-dark-300 dark:text-dark-400 mr-2">
                0{segment.no}
              </span>
              <span>{segment.name}</span>
            </p>
          </div>
        ))}
      </div>
    </>
  )
}

const VideoShot = (props: any) => {
  const { src } = props
  return (
    <div className="p-2 rounded-xl  bg-gradient-to-r from-green-400 via-violet-500 to-blue-500">
      <div className="shadow-lg rounded-md" style={{ height: 'fit-content' }}>
        <div className="w-full rounded-t-md h-5 bg-dark-400 flex items-center justify-start px-2">
          <div className="h-2 w-2 mr-2 rounded-full bg-dark-500" />
          <div className="h-2 w-2 mr-2 rounded-full bg-dark-500" />
          <div className="h-2 w-2 mr-2 rounded-full bg-dark-500" />
        </div>
        <video className="rounded-b-md" src={src} autoPlay loop muted playsInline>
          Your browser does not support the video tag
        </video>
      </div>
    </div>
  )
}

const HamburgerMenu = (props: any) => {
  const { openMenu } = props
  return (
    <div className="cursor-pointer" onClick={openMenu}>
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </div>
  )
}

const SectionHeader = (props: any) => {
  const { sectionNumber, header } = props
  return (
    <div className="col-span-12">
      <span className="block font-mono text-3xl text-dark-300 dark:text-dark-400 mb-3">
        0{sectionNumber}
      </span>
      <h3 className="text-black dark:text-white text-6xl">{header}</h3>
    </div>
  )
}

const Hero = () => {
  const { basePath } = useRouter()
  return (
    <div
      style={{
        backgroundImage: `url('${basePath}/images/beta-hero.png')`,
        backgroundSize: '65%',
        backgroundPosition: '120% 50%',
      }}
      className="py-16 lg:py-36 bg-dark-800 bg-no-repeat"
    >
      <div className="container mx-auto px-8 lg:px-28 py-20 h-full grid grid-cols-12 gap-4 items-center text-dark-300">
        <div className="col-span-12 md:col-span-9 lg:col-span-8 xl:col-span-6 text-white">
          <p className="mb-10 text-4xl">Supabase is an open source Firebase alternative.</p>
          <p className="text-2xl">
            Today, we're moving to <span className="text-brand-700">Beta</span>
          </p>
          <time itemProp="datePublished" dateTime="2020-12-03" className="opacity-50 text-sm">
            Published December 3rd, 2020
          </time>
        </div>
      </div>
    </div>
  )
}

const Introduction = () => {
  return (
    <div className="bg-dark-900">
      <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-4 text-dark-300">
        <div className="col-span-12 sm:col-span-9 xl:col-span-8">
          <p>
            <span className="text-2xl block text-white">
              After the launch of our{' '}
              <a
                href="https://news.ycombinator.com/item?id=23319901"
                target="_blank"
                className="text-brand-700 hover:text-brand-800"
              >
                Alpha
              </a>{' '}
              Program in June,
            </span>
          </p>
        </div>
        <div className="col-span-12 sm:col-span-9 xl:col-span-6 text-base mb-20">
          <p>
            we've been fortunate to work with thousands of early adopters on improving both our Open
            Source, and Hosted offerings. Companies like{' '}
            <a
              href="/blog/2020/12/02/case-study-xendit"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              Xendit
            </a>
            ,{' '}
            <a
              href="/blog/2020/12/02/case-study-monitoro"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              Monitoro
            </a>
            , and{' '}
            <a
              href="/blog/2020/12/02/case-study-tayfa"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              TAYFA
            </a>{' '}
            are using Supabase to ship more products, faster.
          </p>
        </div>

        <div className="col-span-12 text-base mb-10">
          <p className="w-60 pb-2 border-b-2 border-dark-200 dark:border-dark-400">
            Alpha Program in Numbers
          </p>
        </div>

        <div
          id="alphaNumbers"
          className="col-span-12 grid grid-cols-12 gap-y-12 lg:gap-y-20 mb-20 gap-x-3 sm:gap-x-0"
        >
          {AlphaNumbers.map((stat: any, idx: number) => (
            <div
              key={`stat_${idx}`}
              className="col-span-6 sm:col-span-4 grid grid-cols-8 sm:grid-cols-12 gap-x-1 md:gap-x-0 xl:gap-x-6 items-center"
            >
              <div className="col-span-4 sm:col-span-4 md:col-span-3 xl:col-span-2">
                <div className="w-12 h-12 rounded-md bg-dark-700 flex items-center justify-center dark:bg-white">
                  {stat.icon}
                </div>
              </div>
              <div className="col-span-7 sm-col-span-8 md:col-span-9 xl:col-span-10">
                <p className="text-5xl lg:text-6xl">
                  <CountUp triggerAnimOnScroll={true} referenceElId="alphaNumbers">
                    {stat.value}
                  </CountUp>
                  {stat.unit && <span className="text-2xl ml-1">{stat.unit}</span>}
                </p>
              </div>
              <div className="col-span-12 sm:col-span-9 md:col-span-10 col-start-0 sm:col-start-5 md:col-start-4 xl:col-start-3">
                <p className="text-xs lg:text-base text-dark-300 dark:text-dark-400">{stat.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const TableOfContents = (props: any) => {
  const { scrollTo } = props
  return (
    <div className="bg-gray-50 dark:bg-dark-700 text-dark-400 dark:text-dark-200">
      <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-4">
        <div className="col-span-12 text-base mb-10">
          <p className="text-2xl text-black dark:text-white">
            Supabase <span className="text-brand-600 dark:text-brand-700">Beta</span> is starting
            now.
          </p>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-y-10">
          {IntroductionSegments.map((segment: any, segmentIdx: number) => (
            <div key={`introSegment_${segmentIdx}`} className="col-span-12 grid grid-cols-12">
              <div className="col-span-12 mb-10 sm:col-span-5 xl:col-span-4 sm:mb-0">
                <p>{segment.description}</p>
              </div>
              <div className="hidden sm:block sm:col-span-1 xl:col-span-2" />
              <div className="col-span-12 sm:col-span-6 flex flex-col">
                {segment.chapters.map((chapter: any, idx: number) => (
                  <div
                    key={`section_select_${idx}`}
                    className="flex items-center mb-5 cursor-pointer"
                    onClick={() => scrollTo(chapter.key)}
                  >
                    <p className="font-mono text-xs text-dark-300 dark:text-dark-400">{`0${chapter.no}`}</p>
                    <p className="ml-4 transition text-base border-b border-gray-400 hover:text-black dark:hover:text-white">
                      {chapter.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const Performance = () => {
  const Bar = (props: any) => {
    const { color, finalPercentage, duration = 2000 } = props
    const countTo = parseInt(finalPercentage, 10)
    const [count, setCount] = useState<number>(0)
    const [animTriggered, setAnimTriggered] = useState<boolean>(false)

    const easeOutQuad = (t: number) => t * (2 - t)
    const frameDuration = 1000 / 60

    useEffect(() => {
      let frame = 0
      const totalFrames = Math.round(duration / frameDuration)

      async function handleScroll() {
        const reference = document.getElementById('performanceCharts')
        if (reference && !animTriggered) {
          const yOffset = reference.getBoundingClientRect().top - window.innerHeight + 20
          if (yOffset <= 0) {
            setAnimTriggered(true)
            setCount(0)
            const counter = setInterval(() => {
              frame++
              const progress = easeOutQuad(frame / totalFrames)
              setCount(countTo * progress)

              if (frame === totalFrames) clearInterval(counter)
            }, frameDuration)
          }
        }
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }, [animTriggered])

    return <div className={`${color} rounded-full h-3`} style={{ width: `${count.toFixed(2)}%` }} />
  }

  const ComparisonChart = () => {
    const maxValue = 1600
    return (
      <div id="performanceCharts">
        {PerformanceComparisonData.map((metric: any) => {
          const multiplier = (metric.stats[0].value / metric.stats[1].value).toFixed(1)
          return (
            <div key={`${metric.key}`} className="mb-10 text-dark-400 dark:text-dark-300">
              <p className="sm:w-36 pb-2 mb-4">{metric.title}</p>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="w-full sm:w-5/6">
                  {metric.stats.map((stat: any, idx: number) => (
                    <div key={`metric_${metric.key}_${idx}`} className="flex items-center">
                      <p className="w-20 lg:w-24 border-r py-2 pr-4 mr-4 text-left sm:text-right">
                        {stat.name}
                      </p>
                      <Bar
                        color={
                          stat.name === 'Supabase'
                            ? 'bg-brand-600 dark:bg-brand-700'
                            : 'bg-dark-300 dark:bg-dark-400'
                        }
                        finalPercentage={Math.ceil((stat.value / maxValue) * 100)}
                      />
                      <p className="ml-2">{stat.value}/s</p>
                    </div>
                  ))}
                </div>
                <div className="text-left sm:w-1/6 sm:text-right flex flex-col">
                  <p className="text-6xl text-dark-700 dark:text-dark-100">{multiplier}x</p>
                  <p className="text-sm -mt-2">more {metric.key}s per second</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div id="performance" className="bg-white dark:bg-dark-800">
      <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-300">
        <SectionHeader sectionNumber={1} header="Performance" />

        <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10 items-center">
          <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
            <p className="mb-10">
              We started Supabase to give developers a web-ready database that is delightful to use,
              without sacrificing speed and scale. Postgres makes this possible, handling massive
              amounts of data without sacrificing read and write speed.
            </p>
            <p className="mb-10">
              We tweaked our stack obsessively during our Alpha program to tease out superior
              performance. We chose the hyper-scalable{' '}
              <a
                href="https://elixir-lang.org/"
                target="_blank"
                className="text-brand-700 hover:text-brand-800"
              >
                Elixir
              </a>{' '}
              to handle our{' '}
              <a
                href="https://github.com/supabase/realtime"
                target="_blank"
                className="text-brand-700 hover:text-brand-800"
              >
                Realtime engine
              </a>
              , and have supported the{' '}
              <a
                href="https://postgrest.org/en/v7.0.0/"
                target="_blank"
                className="text-brand-700 hover:text-brand-800"
              >
                PostgREST
              </a>{' '}
              team while they improved the performance of their auto-generated CRUD APIs.
            </p>
            <p className="text-dark-400 dark:text-dark-300">
              We're publishing the results of our benchmarks here and we'll continue to seek gains
              throughout our Beta program and beyond. Our{' '}
              <a
                href="https://github.com/supabase/benchmarks/"
                target="_blank"
                className="text-brand-700 hover:text-brand-800"
              >
                benchmarks
              </a>{' '}
              are open source so that the community can better our methodologies and identify areas
              of improvement for the tools which we support at Supabase.
            </p>
          </div>
          <div className="col-span-12 mt-10 mb-10">
            <ComparisonChart />
          </div>
          <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
            <p className="mb-10">
              Benchmarks were run from a neutral host (Digital Ocean Droplet 4 GB Memory / 80 GB
              Disk / SGP1 - Ubuntu 20.04 (LTS) x64) against a table/collection pre-populated with 1
              million rows. The Supabase database and API used are each running on AWS EC2 t3a.micro
              instances.
            </p>
            <p className="mb-10">
              Supabase is available in 7 different geographic regions. We're adding more regions as
              we build up multi-cloud support. Soon we'll offer read-replicas to scale your database
              right to the edge - reducing latency and giving your users a better experience.
            </p>
            <p>
              One of our key metrics at Supabase is "Time to Value". How fast can a user go from
              sign up, to making their first API request? How fast can they go from development to
              production? We've built several case studies on our blog, demonstrating how Supabase
              enables them to build and scale their product in as little time as possible.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const Security = () => {
  return (
    <div id="security" className="bg-gray-50 dark:bg-dark-700">
      <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-200">
        <SectionHeader sectionNumber={2} header="Security" />

        <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8">
          <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
            <p className="mb-10">
              As an infrastructure provider, security has been a priority from day one. While we had
              to resolve brute force attacks on our customers' databases, we internally run pen
              tests to ensure that our own systems are air-tight.
            </p>
            <p className="mb-10">
              Approaching the launch of our Beta period, we worked with security advisors and
              specialists globally to enforce new measures and processes:
            </p>
            <ul className="list-disc list-outside ml-6">
              <li className="mb-5">
                Employed DigitalXRAID to run a full Pen Test on both our internal and customer
                infrastructure. We immediately patched one medium priority issue and are currently
                in the process of resolving the minor and informational issues.
              </li>
              <li className="mb-5">
                Published a disclosure policy so that ethical hackers can help us find
                vulnerabilities in our systems. We've received reports from this initiative already,
                and we'll continue to formalise our bounty program throughout the Beta.
              </li>
              <li className="mb-5">
                We now run an ongoing internal Capture the Flag competition, where team members are
                challenged to breach various components of our systems.
              </li>
              <li className="mb-5">
                Adopted the{' '}
                <a
                  href="https://snyk.io/"
                  target="_blank"
                  className="text-brand-700 hover:text-brand-800"
                >
                  Snyk
                </a>{' '}
                dependency monitor as part of our SSDLC on several key component of our system, to
                help locate potential vulnerabilities in third party Open Source dependencies.
              </li>
              <li>
                Worked with several of the open source tools that we use to improve their own
                security. For example, PostgREST{' '}
                <a
                  href="https://github.com/PostgREST/postgrest/pull/1600#issuecomment-735257952"
                  target="_blank"
                  className="text-brand-700 hover:text-brand-800"
                >
                  now uses
                </a>{' '}
                "parametrized" inputs, where they were previously "escaped".
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

const Reliability = () => {
  const { basePath } = useRouter()
  return (
    <div id="reliability" className="bg-white dark:bg-dark-800">
      <div className="container mx-auto px-8 lg:px-28 py-12 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-300 ">
        <SectionHeader sectionNumber={3} header="Reliability" />

        <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
          <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
            <p className="mb-5">
              During Alpha we experienced 2 availability incidents, neither affecting customer
              access to their data. These were:
            </p>
            <ul className="list-disc list-outside ml-6 mb-10">
              <li className="mb-5">
                A third-party CDN API outage. As a result, subdomains were not created for new
                projects.
              </li>
              <li>
                Cloud resource limits. We maxed out our Virtual Machines limits in some popular
                regions, and we hit the maximum number of subdomains allowed by our DNS provider.
                These limitations are artificial and our cloud providers quickly lifted them.
              </li>
            </ul>
            <p className="mb-10">
              Availability is one of our highest priority goals. We're continuing efforts to
              maximize uptime and ensure user data is backed up in a secure and encrypted location.
            </p>
            <p className="mb-10">
              We're launching{' '}
              <a
                href="https://status.supabase.io"
                target="_blank"
                className="text-brand-700 hover:text-brand-800"
              >
                https://status.supabase.io
              </a>{' '}
              to keep track of uptime across all of our services and critical infrastructure.
            </p>
            <div className="mb-10">
              <VideoShot src={`${basePath}/videos/statusPage.mp4`} />
            </div>
            <p>
              For our Alpha & Beta Users we take free, encrypted daily database backups up to 20GB.
              They are available to download at any time via the dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const NewFeaturesAndIntegrations = () => {
  const { basePath } = useRouter()
  return (
    <div id="newFeaturesAndIntegrations" className="bg-gray-50 dark:bg-dark-700">
      <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-200">
        <SectionHeader sectionNumber={4} header="New Features & Integrations" />

        <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
          <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
            <p className="mb-5">
              If you're new to Supabase, here's a few of the things you get when you choose us as
              your backend.
            </p>
            <ul className="">
              <li className="mb-10">
                <p className="w-20 pb-2 mb-2 border-b-2 border-dark-200 dark:border-dark-400">
                  Auth
                </p>
                <p className="mb-5">
                  If you're new to Supabase, here's a few of the things you get when you choose us
                  as your backend. We provide{' '}
                  <a
                    href="/docs/reference/javascript/auth-signup"
                    target="_blank"
                    className="text-brand-700 hover:text-brand-800"
                  >
                    JavaScript
                  </a>{' '}
                  (and{' '}
                  <a
                    href="/docs/gotrue/server/about#endpoints"
                    target="_blank"
                    className="text-brand-700 hover:text-brand-800"
                  >
                    HTTP
                  </a>
                  ) APIs for your users to sign in and out of your application. You can define the
                  rows in your database that logged-in users can access (e.g. only his or her
                  shopping cart). We even provide account confirmation, recovery, and invite email
                  templates which you can customize on the dashboard, and we handle the
                  transactional emails for you. We support passwordless links, and we offer several
                  OAuth providers including Google, GitHub, with more on the way.
                </p>
                <VideoShot src={`${basePath}/videos/tabAuthRules.mp4`} />
              </li>
              <li className="mb-10">
                <p className="w-20 pb-2 mb-2 border-b-2 border-dark-200 dark:border-dark-400">
                  Realtime
                </p>
                <p>
                  You can{' '}
                  <a
                    href="/docs/guides/client-libraries#realtime-changes"
                    target="_blank"
                    className="text-brand-700 hover:text-brand-800"
                  >
                    subscribe to changes in your database
                  </a>{' '}
                  over websockets, receiving your data in realtime. Companies are using Supabase to
                  build chat applications, trigger notifications, and pipe data to analytics
                  dashboards whenever it changes in their database.
                </p>
              </li>
              <li className="mb-10">
                <p className="w-24 pb-2 mb-2 border-b-2 border-dark-200 dark:border-dark-400">
                  CRUD API
                </p>
                <p>
                  You can use your database immediately, without an ORM or an API backend. We
                  support GraphQL-like{' '}
                  <a
                    href="/docs/reference/javascript/select#query-foreign-tables"
                    target="_blank"
                    className="text-brand-700 hover:text-brand-800"
                  >
                    querying from multiple tables
                  </a>{' '}
                  in a single request, and you can even{' '}
                  <a
                    href="/docs/reference/javascript/rpc"
                    target="_blank"
                    className="text-brand-700 hover:text-brand-800"
                  >
                    invoke complex functions
                  </a>
                  .
                </p>
              </li>
              <li className="mb-10">
                <p className="w-44 pb-2 mb-2 border-b-2 border-dark-200 dark:border-dark-400">
                  Quickstart Templates
                </p>
                <p>
                  If you're unfamiliar with SQL, we provide a set of Quickstart Templates to get you
                  building quickly. Very soon you'll be able to deploy entire apps (front and back
                  end) with just the click of a button.
                </p>
              </li>
              <li className="mb-10">
                <p className="w-24 pb-2 mb-2 border-b-2 border-dark-200 dark:border-dark-400">
                  Table View
                </p>
                <p className="mb-5">
                  View and edit your data like a spreadsheet from within the Supabase dashboard.
                  Build your schema, create complex relationships, and import and export to csv.
                </p>
                <VideoShot src={`${basePath}/videos/tabTableEditor.mp4`} />
              </li>
              <li>
                <p className="w-24 pb-2 mb-2 border-b-2 border-dark-200 dark:border-dark-400">
                  SQL Editor
                </p>
                <p className="mb-5">
                  No need to install third party SQL tools, you can run queries directly from the
                  Supabase Dashboard.
                </p>
                <VideoShot src={`${basePath}/videos/tabSqlEditor.mp4`} />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

const BetaPricing = () => (
  <div id="betaPricing" className="bg-white dark:bg-dark-800">
    <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-300">
      <SectionHeader sectionNumber={5} header="Beta Pricing" />

      <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
        <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
          <p className="mb-10">For up to date pricing info see: https://supabase.io/pricing</p>
          <p className="mb-10">
            We're working closely with many open source projects, infrastructure providers, and of
            course our Alpha Users, to provide a predictable and sustainable pricing model.
          </p>
          <p className="mb-5">Our key aims going into this exercise were:</p>
          <ul className="list-disc list-outside ml-6 mb-10">
            <li className="mb-5">
              To continue offering free Supabase instances for Students, Hobbyists, and Early
              Adopters
            </li>
            <li className="mb-5">
              To price based on <span className="italic">predictable</span> metrics (no shock bills
              at the end of the month)
            </li>
            <li>
              To grow with our users, providing a pricing model that supports their growth and allow
              them to create value for their customers
            </li>
          </ul>
          <p className="mb-10">We are committing to the following initiatives:</p>
          <ul className="list-decimal list-outside ml-6 mb-10">
            <li className="mb-5">
              All Alpha Users will receive credits equivalent of 2 years of base tier usage. These
              will automatically be credited to your account if you signed up prior to December
              2020.
            </li>
            <li className="mb-5">
              All Beta Users (new users from December 2020) will receive 1 year of base tier usage
              for free.
            </li>
            <li className="mb-5">
              University (and participating code school) Students will be eligible for 2 years of
              base tier usage (Code Schools can contact{' '}
              <a
                href="mailto:rory@supabase.io"
                target="_blank"
                className="text-brand-700 hover:text-brand-800"
              >
                rory@supabase.io
              </a>
              )
            </li>
            <li>
              Early stage startups participating in selected incubator programs can claim additional
              credits which can be applied to products outside of the base tier.
            </li>
          </ul>
          <p>
            The Supabase Base Tier is now called the Supabase Pro tier as per the{' '}
            <a href="https://supabase.io/pricing" className="text-brand-700 hover:text-brand-800">
              pricing page
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  </div>
)

const OpenSource = () => (
  <div id="openSource" className="bg-gray-50 dark:bg-dark-700">
    <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-200">
      <SectionHeader sectionNumber={6} header="Open Source" />

      <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
        <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
          <p className="mb-10">
            Great software is multi generational and stretches beyond any single company.
          </p>
          <p className="mb-10">
            Supabase is a collection of many projects, and we rely on making contributors to help us
            build and improve. Because of this, we aim to make open source more accessible and
            attractive to anyone who wants to contribute.
          </p>
          <p className="mb-10">
            Every dollar that is given to Supabase in{' '}
            <a
              href="https://github.com/sponsors/supabase/"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              sponsorship
            </a>{' '}
            will be funneled back to the community to support the next generation of Open Source
            maintainers.
          </p>
          <p className="mb-10">
            One of the biggest barriers to Open Source is knowing exactly how to get started. We're{' '}
            <a
              href="/blog/2020/12/02/supabase-striveschool"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              partnering with Strive School
            </a>{' '}
            to educate the next generation of programmers in Open Source - providing tutorials,
            Founder Office Hours, and other free resources.
          </p>
          <p className="mb-10">
            If you teach programming, and you're interested in offering OSS tuition to your
            students, we're actively looking for more education partners. Email{' '}
            <a
              href="mailto:rory@supabase.io"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              rory@supabase.io
            </a>{' '}
            to find out more.
          </p>
          <p>
            Come and get involved in{' '}
            <a
              href="https://github.com/supabase"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              our GitHub.
            </a>{' '}
          </p>
        </div>
      </div>
    </div>
  </div>
)

const FundingPartners = () => (
  <div id="fundingPartners" className="bg-white dark:bg-dark-800">
    <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-300">
      <SectionHeader sectionNumber={7} header="Funding Partners" />
      <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
        <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
          <p className="mb-10">
            Building a platform that can offer all the amazing features of Firebase will take
            resources - more than most open source tools. Ours will be a long journey and it will
            require the help of many experienced engineers.
          </p>
          <p className="mb-10">
            The partners we choose for this journey must be aligned with our ethos as an open source
            company. In a few weeks we'll release the full details of our Seed round. Today, we're
            happy to announce one key partner who needs no introduction: Mozilla.
          </p>
          <p className="mb-10">
            Open source is at the very core of what Mozilla do - we're humbled and excited to work
            with them.
          </p>
          <p>
            Follow us on{' '}
            <a
              href="https://twitter.com/supabase"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              Twitter
            </a>{' '}
            and we'll let you know when we announce the details of the round.
          </p>
        </div>
      </div>
    </div>
  </div>
)

const ScalingOurTeam = () => (
  <div id="scalingOurTeam" className="bg-gray-50 dark:bg-dark-700">
    <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-200">
      <SectionHeader sectionNumber={8} header="Scaling Our Team" />

      <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
        <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
          <p className="mb-10">
            We are extremely proud of our team. We're a mix of 11 engineers, from 8 different
            countries. Half of the team are previous founders - collectively we've founded 15
            companies, generating millions in revenue.
          </p>
          <p className="mb-10">
            We're also passionate about tech and open source. We hire open source maintainers to
            work full time on the products we use, and we spend every Friday dogfooding Supabase to
            make it better.
          </p>
          <p>
            We are hiring across multiple positions including PostgreSQL engineers, Cloud engineers,
            SRE's, and Developer Advocates. We are a fully remote team, spanning 4 continents and 10
            nationalities. If you are interested and think you can be a factor in the success of
            Supabase, get in touch at{' '}
            <a
              href="mailto:work@supabase.io"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              work@supabase.io
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  </div>
)

const WhatsNext = () => (
  <div
    id="whatsNext"
    className="border-b-2 border-gray-50 bg-white dark:bg-dark-800 dark:border-dark-800"
  >
    <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-300">
      <SectionHeader sectionNumber={9} header="What's Next" />

      <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
        <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
          <p className="mb-5">
            If you watch our repos you'll see that development never stops, we ship every day (and
            night!). We're constantly improving Supabase based on user feedback. Alongside
            performance, security, and reliability improvements, here are some new features we're
            working on for 2021:
          </p>
          <ul className="list-disc list-outside ml-6 mb-10">
            <li className="mb-5">Storage - Making blob storage easier than ever before</li>
            <li className="mb-5">
              Functions - write and deploy serverless functions that have access to your Supabase
              context
            </li>
            <li className="mb-5">
              Local Emulator - Making local development more accessible with a quick start CLI for
              any environment
            </li>
            <li className="mb-5">
              High Availability - Database and API replicas spread globally to serve a global user
              base
            </li>
            <li className="mb-5">
              Multicloud - Spread your Supabase instances across multiple datacenter providers to
              protect against outages
            </li>
            <li className="mb-5">
              Self Hosted - 'Bring your own cloud' is essential for some businesses, and so we're
              working on easy-deploy tooling for customers with this requirement
            </li>
            <li>
              More client libraries - members of the community are helping us build client libraries
              for many different languages including TypeScript, Python, Dart, C#, and Rust. Come
              and help us bring Supabase to your favorite language or framework.
            </li>
          </ul>
          <p className="mb-10">
            We depend on your feedback to continually improve Supabase. Email us at{' '}
            <a
              href="mailto:beta@supabase.io"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              beta@supabase.io
            </a>{' '}
            or join the{' '}
            <a
              href="https://github.com/supabase/supabase/discussions"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              discussion
            </a>{' '}
            on GitHub to let us know how we can help you build things faster.
          </p>
        </div>
      </div>
    </div>
  </div>
)

const Beta = () => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const { basePath } = useRouter()

  const references: any = {
    performance: useRef<HTMLDivElement>(null),
    security: useRef<HTMLDivElement>(null),
    reliability: useRef<HTMLDivElement>(null),
    features: useRef<HTMLDivElement>(null),
    pricing: useRef<HTMLDivElement>(null),
    openSource: useRef<HTMLDivElement>(null),
    fundingPartners: useRef<HTMLDivElement>(null),
    scaling: useRef<HTMLDivElement>(null),
    next: useRef<HTMLDivElement>(null),
  }

  const scrollTo = (key: string) => {
    if (references[key]) {
      references[key].current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <Layout hideHeader={true}>
      <Head>
        <title>{site_title}</title>
        <meta name="og:title" property="og:title" content={site_title} />
        <meta name="twitter:site" content={site_title} />
        <meta name="twitter:text:title" content={site_title} />
      </Head>
      <NextSeo
        title={site_title}
        openGraph={{
          title: site_title,
          description: DESCRIPTION,
          url: `https://supabase.io/beta`,
          type: 'article',
          article: {
            //
            // to do: add expiration and modified dates
            // https://github.com/garmeeh/next-seo#article
            publishedTime: '2020-12-03T00:00:00Z',
            //
            // to do: author urls should be internal in future
            // currently we have external links to github profiles
            authors: [authors['supabase'].authorURL],
            tags: ['beta'],
          },
          images: [
            {
              url: 'https://supabase.io/new/og/og-image.jpg',
            },
          ],
        }}
      />
      <Container>
        <div className="sticky inset-0 z-50">
          <div className="shadow-lg py-5 px-5 xl:px-20 bg-dark-800 flex items-center justify-between">
            <Link href="/">
              <a>
                <img className="h-5" src={`${basePath}/images/logo-dark.png`} />
              </a>
            </Link>
            <HamburgerMenu openMenu={() => setMenuOpen(!menuOpen)} />
          </div>
          <FlyOut
            open={menuOpen}
            handleCancel={() => setMenuOpen(false)}
            className="lg:col-span-1"
            singleBgColor={true}
          >
            <NavFlyOutMenu scrollTo={scrollTo} />
          </FlyOut>
        </div>
        <Hero />
        <Introduction />
        <TableOfContents scrollTo={scrollTo} />
        <div ref={references['performance']}>
          <Performance />
        </div>
        <div ref={references['security']}>
          <Security />
        </div>
        <div ref={references['reliability']}>
          <Reliability />
        </div>
        <div ref={references['features']}>
          <NewFeaturesAndIntegrations />
        </div>
        <div ref={references['pricing']}>
          <BetaPricing />
        </div>
        <div ref={references['openSource']}>
          <OpenSource />
        </div>
        <div ref={references['fundingPartners']}>
          <FundingPartners />
        </div>
        <div ref={references['scaling']}>
          <ScalingOurTeam />
        </div>
        <div ref={references['next']}>
          <WhatsNext />
        </div>
        <CTABanner darkerBg={true} />
      </Container>
    </Layout>
  )
}

export default Beta
