import Head from 'next/head'
import { useRef } from 'react'
import Container from 'components/Container'
import Layout from 'components/Layout'
import CountUp from 'components/CountUp'
import { APP_NAME, DESCRIPTION } from 'lib/constants'
import { AlphaNumbers, IntroductionSegments } from 'data/BetaPage'
import { useRouter } from 'next/router'

const site_title = `${APP_NAME} | We are now in Beta`

// Dark text: text-dark-400
// Light text: text-dark-300

const HamburgerMenu = () => (
  <div className="cursor-pointer">
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

const Hero = () => (
  <div className="w-screen py-16 lg:py-36 bg-dark-800">
    <div className="container mx-auto px-8 lg:px-28 py-20 h-full grid grid-cols-12 gap-4 items-center text-dark-300">
      <div className="col-span-12 md:col-span-9 lg:col-span-8 xl:col-span-6 text-2xl text-white">
        <p className="mb-10">
          Supabase is an opensource Firebase alternative. We're building the features of Firebase
          using enterprise-grade, open source tools.
        </p>
        <p>
          Today, we're moving to <span className="text-brand-700">Beta</span>
        </p>
      </div>
    </div>
  </div>
)

const Introduction = (props: any) => {
  const { scrollTo } = props
  return (
    <div className="bg-gray-50 dark:bg-dark-700">
      <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-4 text-dark-400 dark:text-dark-300">
        <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base mb-20">
          <p>
            After the launch of our{' '}
            <a
              href="https://news.ycombinator.com/item?id=23319901"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              Alpha
            </a>{' '}
            Program in June, we've been fortunate to work with thousands of early adopters on
            improving both our Open Source, and Hosted offerings.
          </p>
        </div>

        <div className="col-span-12 text-base mb-10">
          <p className="w-60 pb-2 border-b-2 border-dark-200 dark:border-dark-400">
            Alpha Program in Numbers
          </p>
        </div>

        <div className="col-span-12 grid grid-cols-12 gap-y-12 lg:gap-y-20 mb-20">
          {AlphaNumbers.map((stat: any, idx: number) => (
            <div
              key={`stat_${idx}`}
              className="col-span-6 sm:col-span-4 grid grid-cols-8 sm:grid-cols-12 gap-x-4 xl:gap-x-6 items-center"
            >
              <div className="col-span-4 sm:col-span-3 xl:col-span-2">
                <div className="w-12 h-12 rounded-md bg-dark-700 flex items-center justify-center bg-gray-900 dark:bg-white">
                  {stat.icon}
                </div>
              </div>
              <div className="col-span-4 sm:col-span-9 xl:col-span-10">
                <p className="text-5xl lg:text-6xl">
                  <CountUp>{stat.value}</CountUp>
                  {stat.unit && <span className="text-2xl ml-1">{stat.unit}</span>}
                </p>
              </div>
              <div className="col-span-12 sm:col-span-10 sm:col-start-4 xl:col-start-3">
                <p className="text-xs lg:text-base text-dark-300 dark:text-dark-400">{stat.name}</p>
              </div>
            </div>
          ))}
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
                    <p className="font-mono text-xs text-dark-300 dark:text-dark-400">{`0${
                      chapter.no
                    }`}</p>
                    <p className="ml-4 transition text-base border-b border-gray-400 hover:text-black">{chapter.name}</p>
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

  const ComparisonChart = () => {
    return (
      <div className="grid grid-cols-12 text-dark-400 dark:text-dark-300 items-center">
        <div className="col-span-12">
          <p className="w-36 pb-2 mb-4">Read (requests/s)</p>
        </div>
        <div className="col-span-12 sm:col-span-10 grid grid-cols-12">
          <div className="col-span-12 grid grid-cols-12 items-center">
            <div className="col-span-4 sm:col-span-2 py-2 border-r border-dark-200 dark:border-dark-400 mr-3">
              Supabase
            </div>
            <div className="col-span-9 py-2">
              <div
                className="bg-brand-600 dark:bg-brand-700 transition-all flex items-center justify-center group rounded-full h-3 hover:h-6"
                style={{ width: '100%' }}
              >
                <p className="transition text-dark-700 opacity-0 group-hover:opacity-100">1167 requests/s</p>
              </div>
            </div>
            <div className="hidden col-span-1 sm:block" />
          </div>
          <div className="col-span-12 grid grid-cols-12 items-center">
            <div className="col-span-4 sm:col-span-2 py-2 border-r border-dark-200 dark:border-dark-400 mr-3">
              Firestore
            </div>
            <div className="col-span-9 py-2">
              <div
                className="bg-dark-300 dark:bg-dark-400 transition-all flex items-center justify-center group rounded-full h-3 hover:h-6"
                style={{ width: '31.36%' }}
              >
                <p className="transition text-dark-700 opacity-0 group-hover:opacity-100">366 requests/s</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-2">
          <p className="text-6xl text-dark-700 sm:text-right">3.2x</p>
          <p className="text-sm sm:text-right -mt-2">faster read requests</p>
        </div>

        <div className="col-span-12 py-5" />

        <div className="col-span-12">
          <p className="w-36 pb-2 mb-4">Write (requests/s)</p>
        </div>
        <div className="col-span-12 sm:col-span-10 grid grid-cols-12">
          <div className="col-span-12 grid grid-cols-12 items-center">
            <div className="col-span-4 sm:col-span-2 py-2 border-r border-dark-200 dark:border-dark-400 mr-3">
              Supabase
            </div>
            <div className="col-span-9 py-2">
              <div
                className="bg-brand-600 dark:bg-brand-700 transition-all flex items-center justify-center group rounded-full h-3 hover:h-6"
                style={{ width: '74.55%' }}
              >
                <p className="transition text-dark-700 opacity-0 group-hover:opacity-100">870 requests/s</p>
              </div>
            </div>
            <div className="hidden col-span-1 sm:block" />
          </div>
          <div className="col-span-12 grid grid-cols-12 items-center">
            <div className="col-span-4 sm:col-span-2 py-2 border-r border-dark-200 dark:border-dark-400 mr-3">
              Firestore
            </div>
            <div className="col-span-9 py-2">
              <div
                className="bg-dark-300 dark:bg-dark-400 transition-all flex items-center justify-center group rounded-full h-3 hover:h-6"
                style={{ width: '23.99%' }}
              >
                <p className="transition text-dark-700 opacity-0 group-hover:opacity-100">280 requests/s</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-2">
          <p className="text-6xl text-dark-700 sm:text-right">3.1x</p>
          <p className="text-sm sm:text-right -mt-2">faster write requests</p>
        </div>
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
              Supabase grew out of a need for a faster and more scalable web-ready datastore.
              Postgres enables our users to handle massive amounts of data without sacrificing read
              and write speed.
            </p>
            <p className="mb-10">
              During our Alpha program we have been obsessively tweaking our stack to tease out
              superior performance. We chose the hyper-scalable{' '}
              <a
                href="https://elixir-lang.org/"
                target="_blank"
                className="text-brand-700 hover:text-brand-800"
              >
                Elixer
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
              We are proud to publish the results of our benchmarks here and we'll continue to seek
              gains throughout our Beta program and beyond. Our{' '}
              <a
                href="https://github.com/supabase/benchmarks/"
                target="_blank"
                className="text-brand-700 hover:text-brand-800"
              >
                benchmarks
              </a>{' '}
              are Open Source, and we are seeking contributors to help maintain our code and improve
              on our methodologies.
            </p>
          </div>
          <div className="col-span-12 mt-10 mb-10">
            <ComparisonChart />
          </div>
          <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
            <p className="mb-10">
              Supabase is now available in 7 different geographic regions, so you can reduce latency
              by deploying in close proximity to your customer base.
            </p>
            <p>
              A key metric in how we measure Supabase is what we call "Time to Value". How fast can
              a user go from sign up, to making their first API request? How fast can they from
              being in Production and generating value for their own customers? We've made several
              case studies available on our website here, with a special focus on how Supabase
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
      <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-300">
        <SectionHeader sectionNumber={2} header="Security" />

        <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8">
          <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
            <p className="mb-10">
              As an infrastructure provider, Security has been a priority from day one. During
              Supabase's Alpha period we experienced a single security breach, which was the result
              of weak customer passwords. An automated brute force attack accessed a handful of our
              customer's databases who had chosen weak passwords. The instances involved were
              destroyed, and the users involved reminded the importance of strong passwords. We now
              require that all database passwords pass a strength test (provided by the excellent{' '}
              <a
                href="https://github.com/dropbox/zxcvbn"
                target="_blank"
                className="text-brand-700 hover:text-brand-800"
              >
                zxcvbn
              </a>
              ).
            </p>
            <p className="mb-5">
              Approaching the launch of our Beta period, we have been working with a number of
              security advisors and specialists globally to put in place several new measures and
              processes:
            </p>
            <ul className="list-disc list-outside ml-6">
              <li className="mb-5">
                Employed DigitalXRAID to run a full Pen Test on both our internal and customer
                infrastructure. In the interest of transparency we are making the summary report
                available here. We have since patched the higher priority issues and are currently
                in the process of resolving the minor and informational issues.
              </li>
              <li className="mb-5">
                Published a disclosure policy to help ethical hackers help us find vulnerabilities
                in our systems. It is availablein the usual place.
              </li>
              <li className="mb-5">
                We now run an ongoing internal Capture the Flag competition, where team members are
                challenged to breach various components of our systems.
              </li>
              <li>
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
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

const Reliability = () => (
  <div id="reliability" className="bg-white dark:bg-dark-800">
    <div className="container mx-auto px-8 lg:px-28 py-12 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-300 ">
      <SectionHeader sectionNumber={3} header="Reliability" />

      <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
        <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
          <p className="mb-5">
            During Alpha we experienced 2 minor incidents related to availability, neither of which
            affected customer access to their data. These were:
          </p>
          <ul className="list-disc list-outside ml-6 mb-10">
            <li className="mb-5">
              A third-party CDN API outage. As a result, subdomains were not created for new
              projects.
            </li>
            <li>
              Cloud resource limits. During peak periods we maxed out the number of Virtual Machines
              we could initiate in a couple of popular regions, these limitations are artificial and
              our Cloud providers quickly lifted them. We also hit the maximum number of subdomains
              that could be issued temporarily
            </li>
          </ul>
          <p className="mb-10">
            Availability is one of our High Priority goals. We're making efforts to maximize uptime
            and ensuring user data is backed up in a secure and encrypted location.
          </p>
          <p className="mb-10">
            We're launching{' '}
            <a href="#" target="_blank" className="text-brand-700 hover:text-brand-800">
              https://status.supabase.io
            </a>{' '}
            to keep track of uptime across all of our services and critical infrastructure.
            (Possibly drop a screen grab here)
          </p>
          <p>
            For our Alpha & Beta Users we take daily backups of your Database free of charge up to
            20GB and store them in an encrypted format. They are available to download at any time
            via the dashboard.
          </p>
        </div>
      </div>
    </div>
  </div>
)

const NewFeaturesAndIntegrations = () => (
  <div id="newFeaturesAndIntegrations" className="bg-gray-50 dark:bg-dark-700">
    <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-300">
      <SectionHeader sectionNumber={4} header="New Features & Integrations" />

      <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
        <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
          <p className="mb-5">
            If you're new to Supabase, here's some of the things you can expect to get when using
            Supabase as your backend and database:
          </p>
          <ul className="">
            <li className="mb-10">
              <p className="w-20 pb-2 mb-2 border-b-2 border-dark-200 dark:border-dark-400">Auth</p>
              <p>
                We provide an easy to use{' '}
                <a
                  href="https://supabase.io/docs/client/auth-signup/"
                  target="_blank"
                  className="text-brand-700 hover:text-brand-800"
                >
                  Javascript
                </a>{' '}
                (and{' '}
                <a
                  href="https://supabase.io/docs/gotrue/server/about/#endpoints"
                  target="_blank"
                  className="text-brand-700 hover:text-brand-800"
                >
                  HTTP
                </a>
                ) interface allowing your Users to sign in and out of your application. You can
                define which rows in your database a given user is allowed to access (e.g. only his
                or her shopping cart), and we even provide confirmation, recovery, and invite email
                templates which you can customize on the dashboard, and we'll send all of your
                transactional emails for you. We support sending your users passwordless links, they
                can use to log them into your app, and even offer several OAuth providers including
                Google, GitHub, and have more on the way.
              </p>
            </li>
            <li className="mb-10">
              <p className="w-20 pb-2 mb-2 border-b-2 border-dark-200 dark:border-dark-400">
                Realtime
              </p>
              <p>
                You can{' '}
                <a
                  href="https://supabase.io/docs/guides/client-libraries/#realtime-changes"
                  target="_blank"
                  className="text-brand-700 hover:text-brand-800"
                >
                  subscribe to changes in your database
                </a>{' '}
                over websockets, so you don't have to continuously poll for new data. Great for
                building chat applications, triggering notifications, or piping data to an analytics
                dashboard as and when it comes into your database.
              </p>
            </li>
            <li className="mb-10">
              <p className="w-24 pb-2 mb-2 border-b-2 border-dark-200 dark:border-dark-400">
                CRUD API
              </p>
              <p>
                You can start interacting with your data directly from your front end application
                without the need for an ORM or building out an API backend. We support GraphQL-like{' '}
                <a
                  href="https://supabase.io/docs/client/select/#query-foreign-tables"
                  target="_blank"
                  className="text-brand-700 hover:text-brand-800"
                >
                  querying of multiple tables
                </a>{' '}
                in a single request, and you can even create and{' '}
                <a
                  href="https://supabase.io/docs/client/rpc/"
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
                If you're unfamiliar with SQL, we provide a set of Quickstart Templates that you can
                start using straight away. Very soon you'll be able to deploy entire apps (front and
                back end) with just the click of a button.
              </p>
            </li>
            <li className="mb-10">
              <p className="w-24 pb-2 mb-2 border-b-2 border-dark-200 dark:border-dark-400">
                Table View
              </p>
              <p>
                View and edit your data like a spreadsheet from within the Supabase dashboard,
                create complex relationships, import and export to csv.
              </p>
            </li>
            <li>
              <p className="w-24 pb-2 mb-2 border-b-2 border-dark-200 dark:border-dark-400">
                SQL Editor
              </p>
              <p>
                No need to install third party SQL tools, you can run queries directly from the
                Supabase Dashbaord.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
)

const BetaPricing = () => (
  <div id="betaPricing" className="bg-white dark:bg-dark-800">
    <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-300">
      <SectionHeader sectionNumber={5} header="Beta Pricing" />

      <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
        <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
          <p className="mb-10">
            We've been working closely with many Open Source projects, Infrastructure Providers, and
            of course our Alpha Users, to provide a predictable and sustainable pricing model.
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
              To grow with our users, providing a pricing model that supports their growth and
              ability to create value for their customers
            </li>
          </ul>
          <p className="mb-10">
            Whilst we're still not at the stage where we can publish a standardized pricing model,
            we are committing to the following initiatives:
          </p>
          <ul className="list-decimal list-outside ml-6 mb-10">
            <li className="mb-5">
              All Alpha Users will receive credits equivalent of 2 years of base tier usage, these
              will automatically be credited to your account if you signed up prior to December
              2020.
            </li>
            <li className="mb-5">
              All Beta Users (new users from today onward) will receive 1 year of base tier usage
              for free.
            </li>
            <li className="mb-5">
              All University (and participating Code Schools) Students will be eligible for 2 years
              of base tier usage (Code Schools contact us here)
              <span className="block text-gray-300 mt-1">
                Details of how to claim for Students will be published shortly
              </span>
            </li>
            <li>
              Early stage startups participating in selected incubator programs can claim additional
              credits which can be applied to products outside of the base tier.
            </li>
          </ul>
          <p>
            The Supabase Base Tier constitutes a Supabase Instance running in a single region, on 2
            vCPUs, 1 GiB Memory, with 2 GB of storage, and daily backups.
          </p>
        </div>
      </div>
    </div>
  </div>
)

const OpenSource = () => (
  <div id="openSource" className="bg-gray-50 dark:bg-dark-700">
    <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-300">
      <SectionHeader sectionNumber={6} header="Open Source" />

      <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
        <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
          <p className="mb-10">
            Great software is multi generational and stretches far beyond any single company.
          </p>
          <p className="mb-10">
            Since Supabase is a collection of many different projects and repos, hosted by us, and
            by members of the community, we rely on making it easier for contributors to get
            involved by making Open Source more accessible.
          </p>
          <p className="mb-10">
            Every dollar that is given to Supabase in GitHub{' '}
            <a
              href="https://github.com/sponsors/supabase/"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              sponsorship
            </a>{' '}
            will be funneled back into the community to support the next generation of Open Source
            maintainers.
          </p>
          <p className="mb-10">
            One of the biggest barriers to Open Source is knowing exactly how you can contribute.
            We're partnering with{' '}
            <a
              href="https://strive.school/"
              target="_blank"
              className="text-brand-700 hover:text-brand-800"
            >
              Strive School
            </a>{' '}
            to educate the next generation of programmers in Open Source by providing tutorials,
            Founder Office Hours, and other free resources.
          </p>
          <p>
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
        </div>
      </div>
    </div>
  </div>
)

// Skip this segment first
const FundingPartners = () => <div></div>

const ScalingOurTeam = () => (
  <div id="scalingOurTeam" className="bg-white dark:bg-dark-800">
    <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-300">
      <SectionHeader sectionNumber={7} header="Scaling Our Team" />

      <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
        <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
          <p>
            We are looking for hires across multiple positions including PostgreSQL engineers, Cloud
            engineers, SRE's, and Developer Advocates. We are a fully remote team, spanning 4
            continents and 10 nationalities. If you are interested and think you can be a factor in
            the success of Supabase, get in touch at
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
    className="border-b-2 border-gray-50 bg-gray-50 dark:bg-dark-700 dark:border-dark-800"
  >
    <div className="container mx-auto px-8 lg:px-28 py-20 grid grid-cols-12 gap-y-10 text-dark-400 dark:text-dark-300">
      <SectionHeader sectionNumber={8} header="What's Next" />

      <div className="col-span-12 grid grid-cols-12 gap-x-2 lg:gap-x-8 mb-10">
        <div className="col-span-12 sm:col-span-9 xl:col-span-7 text-base">
          <p className="mb-5">
            If you watch our repos you'll see that development never stops, we ship every day (and
            night!), and are always improving Supabase based on user feedback. Alongside
            Performance, Security, and Reliability improvements, here are some new features we're
            currently working on for 2021:
          </p>
          <ul className="list-disc list-outside ml-6 mb-10">
            <li className="mb-5">Storage - Making blob storage easier than ever before</li>
            <li className="mb-5">
              Functions - write and deploy serverless functions that have access to your Supabase
              context
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
              for many different languages including Typescript, Python, Dart, C#, and Rust. Come
              and help us bring Supabase to your favourite language or framework.
            </li>
          </ul>
          <p>
            We depend on your feedback to continually improve Supabase.Email us at{' '}
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
  const { basePath } = useRouter()
  const references: any = {
    performance: useRef<HTMLDivElement>(null),
    security: useRef<HTMLDivElement>(null),
    reliability: useRef<HTMLDivElement>(null),
    features: useRef<HTMLDivElement>(null),
    pricing: useRef<HTMLDivElement>(null),
    openSource: useRef<HTMLDivElement>(null),
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
        <div className="shadow-lg py-5 px-5 lg:px-20 sticky inset-0 bg-dark-800 z-50 flex items-center justify-between">
          <img className="h-5" src={`${basePath}/images/logo-dark.png`} />
          <HamburgerMenu />
        </div>
        <Hero />
        <Introduction scrollTo={scrollTo} />
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
        <div ref={references['scaling']}>
          <ScalingOurTeam />
        </div>
        <div ref={references['next']}>
          <WhatsNext />
        </div>
      </Container>
    </Layout>
  )
}

export default Beta
