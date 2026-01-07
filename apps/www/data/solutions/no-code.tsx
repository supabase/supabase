import dynamic from 'next/dynamic'
import { Check, PointerIcon, TrendingUp, ZapIcon } from 'lucide-react'
import { cn, Image } from 'ui'

import MainProducts from '../MainProducts'

import type { TwoColumnsSectionProps } from '~/components/Solutions/TwoColumnsSection'
import type { PlatformSectionProps } from 'components/Solutions/PlatformSection'
import type { FeaturesSection, HeroSection, Metadata } from './solutions.utils'
import type { Quotes } from './solutions.utils'

import { PRODUCT_SHORTNAMES } from 'shared-data/products'
import { useSendTelemetryEvent } from 'lib/telemetry'

const AuthVisual = dynamic(() => import('components/Products/AuthVisual'))
const ComputePricingCalculator = dynamic(
  () => import('components/Pricing/ComputePricingCalculator')
)
const FunctionsVisual = dynamic(() => import('components/Products/FunctionsVisual'))
const RealtimeVisual = dynamic(() => import('components/Products/RealtimeVisual'))
const AIBuildersLogos = dynamic(() => import('components/Solutions/AIBuildersLogos'))

const data: () => {
  metadata: Metadata
  heroSection: HeroSection
  quotes: Quotes
  why: FeaturesSection
  platform: PlatformSectionProps
  platformStarterSection: TwoColumnsSectionProps
} = () => {
  const sendTelemetryEvent = useSendTelemetryEvent()

  return {
    metadata: {
      metaTitle: 'Supabase for building Apps',
      metaDescription: 'Your app, your vision. Supabase powers the rest.',
    },
    heroSection: {
      id: 'hero',
      title: 'Supabase for building Apps',
      h1: (
        <>
          <span className="block text-foreground">Your app, your vision.</span>
          <span className="block md:ml-0">Supabase powers the rest.</span>
        </>
      ),
      subheader: [
        <>
          You don’t need to be a developer to build something incredible. Supabase provides a
          complete backend that’s easy to use with your favorite app builder tools. When you’re
          ready to scale, Supabase is there to scale with you. <br />
          Build in a weekend, scale to millions.
        </>,
      ],
      image: undefined,
      ctas: [
        {
          label: 'Start your project',
          href: 'https://supabase.com/dashboard',
          type: 'primary' as any,
          onClick: () =>
            sendTelemetryEvent({
              action: 'start_project_button_clicked',
              properties: { buttonLocation: 'Solutions: No Code page hero' },
            }),
        },
      ],
    },
    quotes: {
      id: 'quotes',
      items: [
        {
          icon: '/images/logos/publicity/lovable.svg',
          avatar: '/images/avatars/anton-osika.jpg',
          author: 'Anton Osika',
          authorTitle: 'Lovable - CEO',
          quote: (
            <>
              We chose Supabase because it's{' '}
              <span className="text-foreground">extremely user friendly</span> and{' '}
              <span className="text-foreground">
                covers all the needs to build full-stack applications
              </span>
              .
            </>
          ),
        },
        {
          icon: '/images/logos/publicity/bolt.svg',
          avatar: '/images/avatars/eric-simons.jpg',
          author: 'Eric Simmons',
          authorTitle: 'Bolt.new - CEO',
          quote: (
            <>
              Supabase is awesome. Supabase is the{' '}
              <span className="text-foreground">key database integration</span> that we
              have...because it’s the{' '}
              <span className="text-foreground">
                best product in the world for storing and retrieving data
              </span>
              .
            </>
          ),
        },
        {
          icon: '/images/logos/publicity/v0.svg',
          avatar: '/images/avatars/guillermo-rauch.jpg',
          author: 'Guillermo Rauch',
          authorTitle: 'Vercel (v0) - CEO',
          quote: (
            <>
              <span className="text-foreground">v0 integrates with Supabase seamlessly.</span> If
              you ask v0 to generate an application and it needs Supabase,{' '}
              <span className="text-foreground">
                you’ll be prompted to create a Supabase account right there in the application
              </span>
              .
            </>
          ),
        },
      ],
    },
    why: {
      id: 'why-supabase',
      label: '',
      heading: (
        <>
          Why <span className="text-foreground">no-code app builders</span> choose Supabase
        </>
      ),
      subheading:
        'Keep your focus where it belongs: building great monetizable apps for your business or hobby. Supabase handles everything else: no servers to manage, no database to configure, no security settings to tweak. Just point, click, and build.',
      features: [
        {
          id: 'easy-to-use',
          icon: ZapIcon,
          heading: 'Easy to use',
          subheading:
            'Supabase is easy to use and set up. Instantly deploy a database for free, and affordably scale as you grow.',
        },
        {
          id: 'point-and-click-backend',
          icon: PointerIcon,
          heading: 'Point and click backend',
          subheading:
            'Supabase includes everything you need for a great app: user logins, storage, edge functions, real-time subscriptions, and vector search. Use one or all.',
        },
        {
          id: 'scalable',
          icon: TrendingUp,
          heading: 'Scales when you need it',
          subheading:
            'Supabase is just Postgres, with all the performance, high availability, and flexibility you need when your app goes viral and hits it big.',
        },
      ],
    },
    platform: {
      id: 'postgres-platform',
      title: (
        <>
          Supabase is the Back-End for <span className="text-foreground">Everyone</span>
        </>
      ),
      subheading:
        'Supabase includes everything you need to create the perfect app for your brand, business, or just for fun.',
      className: cn(
        '[&_div.grid]:sm:divide-x [&_div.grid]:divide-y',
        '[&_div.grid>div:nth-child(2n+1)]:sm:!border-l-0',
        '[&_div.grid>div:nth-child(2n+2)]:sm:!border-l',
        '[&_div.grid>div:nth-child(2n+2)]:lg:!border-l',
        '[&_div.grid>div:nth-child(3n+3)]:lg:!border-l-0',
        '[&_div.grid>div:nth-child(2n+3)]:lg:!border-l',
        '[&_div.grid>div:nth-child(2)]:lg:!border-t-0'
      ),
      features: [
        {
          id: 'database',
          title: 'Database',
          isDatabase: true,
          icon: MainProducts[PRODUCT_SHORTNAMES.DATABASE].icon,
          subheading: (
            <>
              A fully managed database that’s simple for creators and{' '}
              <span className="text-foreground">trusted by enterprises</span>.
            </>
          ),
          className: 'lg:col-span-2 flex-col lg:flex-row px-4 lg:pr-0',
          image: (
            <div className="relative w-full max-w-xl pt-8">
              <div className="w-full h-full rounded-t-lg lg:rounded-tr-none overflow-hidden border-t border-l border-r lg:border-r-0 bg-surface-75">
                <table className="min-w-full m-0">
                  <thead className="p-0">
                    <tr className="border-b">
                      <th className="py-2 px-4 text-left text-xs font-mono font-normal tracking-widest text-[#A0A0A0]">
                        NAME
                      </th>
                      <th className="py-2 px-4 text-left text-xs font-mono font-normal tracking-widest text-[#A0A0A0]">
                        PUBLICATION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface-100">
                    {[
                      { name: 'Jon Meyers', pub: 'All', active: false },
                      { name: 'Chris Martin', pub: 'All', active: true },
                      { name: 'Amy Quek', pub: 'No', active: false },
                      { name: 'Riccardo Bussetti', pub: 'No', active: false },
                      { name: 'Beng Eu', pub: 'All', active: false },
                      { name: 'Tyler Hillery', pub: 'All', active: false },
                    ].map((row) => (
                      <tr
                        key={row.name}
                        className="group/row hover:bg-selection hover:text-foreground transition-colors cursor-pointer"
                      >
                        <td className="py-2 px-4 whitespace-nowrap">{row.name}</td>
                        <td className="py-2 px-4 whitespace-nowrap">{row.pub}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className="
                  absolute pointer-events-none
                  w-full h-full
                  inset-0 top-auto
                  bg-[linear-gradient(to_bottom,transparent_0%,hsl(var(--background-default))_100%)]
                "
              />
            </div>
          ),
          highlights: (
            <ul className="hidden lg:flex flex-col gap-1 text-sm">
              <li>
                <Check className="inline text-foreground-light h-4 w-4" /> 100% portable
              </li>
              <li>
                <Check className="inline text-foreground-light h-4 w-4" /> Built-in Auth with RLS
              </li>
              <li>
                <Check className="inline text-foreground-light h-4 w-4" /> Easy to extend
              </li>
            </ul>
          ),
        },
        {
          id: 'authentication',
          title: 'Authentication',
          icon: MainProducts[PRODUCT_SHORTNAMES.AUTHENTICATION].icon,
          subheading: (
            <>
              Let your users{' '}
              <span className="text-foreground">
                login with email, Google, Apple, GitHub, and more
              </span>
              . Secure and trusted.
            </>
          ),
          className: '!border-l-0 sm:!border-l sm:!border-t-0',
          image: <AuthVisual className="2xl:!-bottom-20" />,
        },
        {
          id: 'realtime',
          title: 'Realtime',
          icon: MainProducts[PRODUCT_SHORTNAMES.REALTIME].icon,
          subheading: (
            <>
              Build immersive{' '}
              <span className="text-foreground">multi-player, collaborative experiences</span>.
            </>
          ),
          className: '!border-l-0 sm:!border-l',
          image: (
            <RealtimeVisual className="[&_.visual-overlay]:bg-[linear-gradient(to_top,transparent_0%,transparent_50%,hsl(var(--background-default))_75%)]" />
          ),
        },
        {
          id: 'edge-functions',
          title: 'Edge Functions',
          icon: MainProducts[PRODUCT_SHORTNAMES.FUNCTIONS].icon,
          subheading: <>Custom backend logic when you want to dive into code.</>,
          className: '!border-l-0 sm:!border-l lg:!border-l-0',
          image: <FunctionsVisual className="" />,
        },
        {
          id: 'storage',
          title: 'Storage',
          icon: MainProducts[PRODUCT_SHORTNAMES.STORAGE].icon,
          subheading: (
            <>
              <span className="text-foreground">Affordable and fast</span>, for all the videos and
              images you need in your app.
            </>
          ),
          className: '!border-l-0 lg:!border-l',
          image: (
            <Image
              draggable={false}
              src={{
                dark: '/images/solutions/neon/storage-dark.png',
                light: '/images/solutions/neon/storage-light.png',
              }}
              alt="Storage"
              width={1000}
              height={1000}
              quality={100}
              containerClassName="md:mb-4"
              className="opacity-[0.99]"
              style={{
                imageRendering: 'revert-layer',
              }}
            />
          ),
        },
        {
          id: 'vectors',
          title: 'AI Ready',
          icon: 'M4.13477 12.8129C4.13477 14.1481 4.43245 15.4138 4.96506 16.5471M12.925 4.02271C11.5644 4.02271 10.276 4.33184 9.12614 4.88371M21.7152 12.8129C21.7152 11.4644 21.4115 10.1867 20.8688 9.0447M12.925 21.6032C14.2829 21.6032 15.5689 21.2952 16.717 20.7454M16.717 20.7454C17.2587 21.5257 18.1612 22.0366 19.1831 22.0366C20.84 22.0366 22.1831 20.6935 22.1831 19.0366C22.1831 17.3798 20.84 16.0366 19.1831 16.0366C17.5263 16.0366 16.1831 17.3798 16.1831 19.0366C16.1831 19.6716 16.3804 20.2605 16.717 20.7454ZM4.96506 16.5471C4.16552 17.086 3.63965 17.9999 3.63965 19.0366C3.63965 20.6935 4.98279 22.0366 6.63965 22.0366C8.2965 22.0366 9.63965 20.6935 9.63965 19.0366C9.63965 17.3798 8.2965 16.0366 6.63965 16.0366C6.01951 16.0366 5.44333 16.2248 4.96506 16.5471ZM9.12614 4.88371C8.58687 4.08666 7.67444 3.56274 6.63965 3.56274C4.98279 3.56274 3.63965 4.90589 3.63965 6.56274C3.63965 8.2196 4.98279 9.56274 6.63965 9.56274C8.2965 9.56274 9.63965 8.2196 9.63965 6.56274C9.63965 5.94069 9.45032 5.36285 9.12614 4.88371ZM20.8688 9.0447C21.6621 8.50486 22.1831 7.59464 22.1831 6.56274C22.1831 4.90589 20.84 3.56274 19.1831 3.56274C17.5263 3.56274 16.1831 4.90589 16.1831 6.56274C16.1831 8.2196 17.5263 9.56274 19.1831 9.56274C19.8081 9.56274 20.3884 9.37165 20.8688 9.0447Z',
          subheading: (
            <>
              When you’re ready to explore vectors and{' '}
              <span className="text-foreground">the power of AI</span>, Supabase is there with
              industry-standard tools to guide you.
            </>
          ),
          className: '!border-l-0 lg:!border-l',
          image: (
            <Image
              draggable={false}
              src={{
                dark: '/images/solutions/neon/vectors-dark.png',
                light: '/images/solutions/neon/vectors-light.png',
              }}
              alt="Vector embeddings"
              width={100}
              height={100}
              quality={100}
            />
          ),
        },
        {
          id: 'pricing',
          title: 'Pricing for builders',
          className: 'sm:col-span-2 flex-col',
          icon: (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.00391 1.67476C4.95842 1.67476 1.67891 4.95427 1.67891 8.99975C1.67891 13.0452 4.95842 16.3248 9.00391 16.3248C13.0494 16.3248 16.3289 13.0452 16.3289 8.99975C16.3289 4.95427 13.0494 1.67476 9.00391 1.67476ZM1.32891 8.99975C1.32891 4.76097 4.76512 1.32476 9.00391 1.32476C13.2427 1.32476 16.6789 4.76097 16.6789 8.99975C16.6789 13.2385 13.2427 16.6748 9.00391 16.6748C4.76512 16.6748 1.32891 13.2385 1.32891 8.99975Z"
                fill="black"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.90901 5.90877C6.33097 5.48681 6.90326 5.24976 7.5 5.24976H12C12.4142 5.24976 12.75 5.58554 12.75 5.99976C12.75 6.41397 12.4142 6.74976 12 6.74976H7.5C7.30109 6.74976 7.11032 6.82877 6.96967 6.96943C6.82902 7.11008 6.75 7.30084 6.75 7.49976C6.75 7.69867 6.82902 7.88943 6.96967 8.03009C7.11032 8.17074 7.30109 8.24976 7.5 8.24976H10.5C11.0967 8.24976 11.669 8.48681 12.091 8.90877C12.5129 9.33072 12.75 9.90302 12.75 10.4998C12.75 11.0965 12.5129 11.6688 12.091 12.0907C11.669 12.5127 11.0967 12.7498 10.5 12.7498H6C5.58579 12.7498 5.25 12.414 5.25 11.9998C5.25 11.5855 5.58579 11.2498 6 11.2498H10.5C10.6989 11.2498 10.8897 11.1707 11.0303 11.0301C11.171 10.8894 11.25 10.6987 11.25 10.4998C11.25 10.3008 11.171 10.1101 11.0303 9.96943C10.8897 9.82877 10.6989 9.74976 10.5 9.74976H7.5C6.90326 9.74976 6.33097 9.5127 5.90901 9.09075C5.48705 8.66879 5.25 8.09649 5.25 7.49976C5.25 6.90302 5.48705 6.33072 5.90901 5.90877Z"
                fill="currentColor"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.99609 3.75C9.41031 3.75 9.74609 4.08579 9.74609 4.5V13.5C9.74609 13.9142 9.41031 14.25 8.99609 14.25C8.58188 14.25 8.24609 13.9142 8.24609 13.5V4.5C8.24609 4.08579 8.58188 3.75 8.99609 3.75Z"
                fill="currentColor"
              />
            </svg>
          ),
          subheading: (
            <>
              <span className="text-foreground">A generous free tier</span>, plus fair, flexible
              pricing when you’re ready to scale.
            </>
          ),
          image: (
            <div className="relative w-full h-full">
              <div className="absolute inset-0 w-full px-4 pt-1.5 pb-0 lg:p-6 2xl:p-8">
                <ComputePricingCalculator disableInteractivity />
              </div>
            </div>
          ),
        },
      ],
    },
    platformStarterSection: {
      id: 'platform-starter',
      heading: <span className="text-foreground">Start building in seconds</span>,
      subheading: 'Choose your platform to get started:',
      leftFooter: (
        <AIBuildersLogos className="lg:pt-4 xl:grid xl:grid-cols-3 max-w-none xl:gap-8 2xl:gap-x-20" />
      ),
      className:
        'lg:mb-24 [&>div.grid]:lg:grid-cols-5 [&_.col-left]:lg:col-span-2 [&_.col-right]:lg:col-span-3',
      aiPrompts: [
        {
          id: 'internal-crm',
          title: 'Internal CRM for High-Touch Client Services',
          code: `Build an internal CRM that tracks interactions with clients in a service business (e.g. agency, law firm, consultancy). Include a client directory with contact info and tags, a timeline of interactions (calls, meetings, emails), and a task management feature per client. Add a pipeline view for sales or project stages. Use Supabase Auth for role-based access and row-level security to restrict views by user.`,
          language: 'markdown',
          copyable: true,
        },
        {
          id: 'customer-feedback',
          title: 'Customer Feedback Collection and Tagging System',
          code: `Create a tool to collect and tag customer feedback from multiple sources like support tickets, surveys, and interviews. Allow team members to log new feedback with sentiment, category, and product area. Summarize trends in charts (e.g. top requests, most common bugs). Use Supabase as the backend with triggers to notify product owners when thresholds are met. Optional: add AI-powered tagging for fast triage.`,
          language: 'markdown',
          copyable: true,
        },
        {
          id: 'onboarding-portal',
          title: 'Automated Onboarding Portal for New Hires',
          code: `Build a customizable portal for onboarding new employees in a remote company. Show personalized checklists by role, with links to key docs, Slack channels, and tool logins. Let managers monitor completion status. Include a welcome board where coworkers can leave greetings. Use Supabase to manage checklists, users, and messages. Add role-based views for HR vs. employee.`,
          language: 'markdown',
          copyable: true,
        },
        {
          id: 'recurring-revenue',
          title: 'Recurring Revenue Dashboard for Indie SaaS',
          code: `Create a financial dashboard for indie founders to track recurring revenue. Include metrics like MRR, ARR, churn, and LTV. Add charts for monthly trends. Let users manually enter Stripe or PayPal data, or auto-sync via webhook. Use Supabase to store data with per-user access control. Configure Slack integration for daily digests.`,
          language: 'markdown',
          copyable: true,
        },
        {
          id: 'custom-client-portal',
          title: 'Custom Client Portal for Freelancers',
          code: `Build a secure portal where freelancers can share files, invoices, and project updates with clients. Each client should log in and only see their own dashboard. Include a file upload section, embedded payment buttons, and a timeline of status updates. Use Supabase for data storage and row-level security.`,
          language: 'markdown',
          copyable: true,
        },
        {
          id: 'compliance-tracker',
          title: 'Compliance Tracker for Early-Stage Startups',
          code: `Create a dashboard for startups to track legal, security, and HR compliance tasks. Let users define tasks, assign owners, set due dates, and upload supporting documents. Group tasks by category (e.g. Security, Legal) and show progress bars. Use Supabase for storing task data and documents.`,
          language: 'markdown',
          copyable: true,
        },
      ],
    },
  }
}

export default data
