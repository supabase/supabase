import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Check, Sparkles, Timer } from 'lucide-react'
import { CubeIcon } from '@heroicons/react/outline'
import { Button, cn, Image } from 'ui'

import MainProducts from '../MainProducts'
import { frameworks } from 'components/Hero/HeroFrameworks'

import type { TwoColumnsSectionProps } from '~/components/Solutions/TwoColumnsSection'
import type { PlatformSectionProps } from 'components/Solutions/PlatformSection'
import type { TwitterSocialSectionProps } from 'components/TwitterSocialSection'
import {
  FrameworkLink,
  getEditors,
  type FeaturesSection,
  type HeroSection,
  type Metadata,
} from './solutions.utils'
import type { MPCSectionProps } from 'components/Solutions/MPCSection'

import { PRODUCT_SHORTNAMES } from 'shared-data/products'
import { tweets } from 'shared-data'
import { useBreakpoint } from 'common'
import { useSendTelemetryEvent } from 'lib/telemetry'

const AuthVisual = dynamic(() => import('components/Products/AuthVisual'))
const ComputePricingCalculator = dynamic(
  () => import('components/Pricing/ComputePricingCalculator')
)
const FunctionsVisual = dynamic(() => import('components/Products/FunctionsVisual'))
const RealtimeVisual = dynamic(() => import('components/Products/RealtimeVisual'))

const data: () => {
  metadata: Metadata
  heroSection: HeroSection
  why: FeaturesSection
  platform: PlatformSectionProps
  twitterSocialSection: TwitterSocialSectionProps
  platformStarterSection: TwoColumnsSectionProps
  mcp: MPCSectionProps
} = () => {
  const isXs = useBreakpoint(640)
  const editors = getEditors(isXs)
  const sendTelemetryEvent = useSendTelemetryEvent()

  return {
    metadata: {
      metaTitle: 'Supabase for Beginners',
      metaDescription:
        'Supabase gives you the tools to easily manage databases, authentication, and backend infrastructure so you can build faster.',
    },
    heroSection: {
      id: 'hero',
      title: 'Supabase for Beginner Developers',
      h1: (
        <>
          <span className="block text-foreground">Build in a weekend</span>
          <span className="text-brand block md:ml-0">Scale to millions</span>
        </>
      ),
      subheader: [
        <>
          Learning to build a full-stack application is exciting. Supabase gives you the tools,
          documentation, and community that makes managing databases, authentication, and backend
          infrastructure a lot less overwhelming. Ship faster and learn by doing with Supabase.
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
              properties: { buttonLocation: 'Solutions: Beginners page hero' },
            }),
        },
      ],
    },
    why: {
      id: 'why-supabase',
      label: '',
      heading: (
        <>
          Why <span className="text-foreground">developers of all skill levels</span> choose
          Supabase
        </>
      ),
      subheading:
        'Supabase is the Postgres development platform that powers a new generation of developer tools. Give your users an integrated, scalable backend that lets them focus on building without worrying about infrastructure.',
      features: [
        {
          id: 'get-to-market-faster',
          icon: Timer,
          heading: 'Instant backend',
          subheading:
            'Deploy a database in seconds. Choose your front-end framework and platform. Start coding and learning. With Supabase, batteries are always included.',
        },
        {
          id: 'the-tools-you-need-at-a-great-price',
          icon: CubeIcon,
          heading: 'Everything you need to learn and build',
          subheading:
            'Supabase offers a fully integrated suite of tools including authentication, storage, edge functions, real-time subscriptions, and vector search. Use one or all.',
        },
        {
          id: 'scalable-and-dependable',
          icon: (props: any) => (
            <svg
              width="23"
              height="23"
              viewBox="0 0 40 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              {...props}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.43881 3.75378C4.10721 1.93324 5.84055 0.723145 7.77992 0.723145H15.6033V0.734736H17.0394C23.8756 0.734736 29.4173 6.27652 29.4173 13.1127V20.1749C29.4173 20.7272 28.9696 21.1749 28.4173 21.1749C27.8651 21.1749 27.4173 20.7272 27.4173 20.1749V13.1127C27.4173 7.38109 22.771 2.73474 17.0394 2.73474H15.4396C15.3877 2.73474 15.3366 2.73078 15.2868 2.72314H7.77992C6.6793 2.72314 5.6956 3.40989 5.31627 4.44308L2.7812 11.3479C2.37375 12.4577 2.69516 13.7038 3.58855 14.4781L5.32807 15.9856C6.12772 16.6786 6.58711 17.6847 6.58709 18.7428L6.58706 21.5134C6.58702 23.8192 8.45627 25.6885 10.7621 25.6885C11.4007 25.6885 11.9184 25.1708 11.9184 24.5322L11.9185 12.1874C11.9185 9.59233 12.955 7.10481 14.7977 5.27761C15.1899 4.88873 15.823 4.8914 16.2119 5.28357C16.6008 5.67574 16.5981 6.3089 16.2059 6.69777C14.742 8.14943 13.9185 10.1257 13.9185 12.1874L13.9184 24.5323C13.9184 26.2754 12.5053 27.6885 10.7621 27.6885C7.35169 27.6885 4.58701 24.9238 4.58706 21.5134L4.58709 18.7428C4.5871 18.2647 4.37953 17.8101 4.01822 17.497L2.27871 15.9894C0.757203 14.6708 0.209829 12.5486 0.90374 10.6586L3.43881 3.75378ZM16.539 18.5225C17.0348 18.2791 17.634 18.4838 17.8773 18.9796C19.1969 21.6686 21.9313 23.3727 24.9267 23.3726L32.8043 23.3726C33.3566 23.3725 33.8043 23.8203 33.8043 24.3725C33.8044 24.9248 33.3566 25.3725 32.8044 25.3726L29.4081 25.3726C29.4142 25.4172 29.4173 25.4628 29.4173 25.5091C29.4173 29.0627 26.1868 31.4165 22.6091 31.4165C19.2966 31.4165 16.5385 29.0518 15.9271 25.9188C15.8213 25.3767 16.175 24.8516 16.717 24.7458C17.2591 24.64 17.7843 24.9936 17.89 25.5357C18.3217 27.7475 20.2716 29.4165 22.6091 29.4165C25.447 29.4165 27.4173 27.6256 27.4173 25.5091C27.4173 25.4628 27.4205 25.4172 27.4266 25.3726L24.9267 25.3726C21.1684 25.3727 17.7375 23.2346 16.0818 19.8607C15.8385 19.3649 16.0432 18.7658 16.539 18.5225Z"
                fill="currentColor"
              />
              <path
                d="M21.7224 13.0006C21.7224 13.6338 22.2358 14.1472 22.869 14.1472C23.5022 14.1472 24.0156 13.6338 24.0156 13.0006C24.0156 12.3674 23.5022 11.854 22.869 11.854C22.2358 11.854 21.7224 12.3674 21.7224 13.0006Z"
                fill="currentColor"
              />
            </svg>
          ),
          heading: 'Scalable and dependable',
          subheading:
            'Supabase is just Postgres, the world’s most popular and dependable database. When you’re ready to grow, Supabase will be there for you.',
        },
      ],
    },
    platform: {
      id: 'postgres-platform',
      title: (
        <>
          Supabase helps you <span className="text-foreground">build</span>
        </>
      ),
      subheading:
        'Supabase includes everything you need to create the perfect app for your brand, business, or just for fun.',
      className: cn(
        '[&_div.grid]:sm:divide-x [&_div.grid]:divide-y',
        '[&_div.grid>div:nth-child(2n+2)]:sm:!border-l-0',
        '[&_div.grid>div:nth-child(2n+2)]:lg:!border-l',
        '[&_div.grid>div:nth-child(3n+3)]:lg:!border-l-0',
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
              A fully managed database that’s simple
              <br className="hidden lg:block" /> for creators and{' '}
              <span className="text-foreground">trusted by enterprises</span>.
            </>
          ),
          className: 'sm:col-span-2 flex-col lg:flex-row px-4 lg:pr-0',
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
          id: 'apis',
          title: 'Auto-generated APIs',
          icon: 'M4.13477 12.8129C4.13477 14.1481 4.43245 15.4138 4.96506 16.5471M12.925 4.02271C11.5644 4.02271 10.276 4.33184 9.12614 4.88371M21.7152 12.8129C21.7152 11.4644 21.4115 10.1867 20.8688 9.0447M12.925 21.6032C14.2829 21.6032 15.5689 21.2952 16.717 20.7454M16.717 20.7454C17.2587 21.5257 18.1612 22.0366 19.1831 22.0366C20.84 22.0366 22.1831 20.6935 22.1831 19.0366C22.1831 17.3798 20.84 16.0366 19.1831 16.0366C17.5263 16.0366 16.1831 17.3798 16.1831 19.0366C16.1831 19.6716 16.3804 20.2605 16.717 20.7454ZM4.96506 16.5471C4.16552 17.086 3.63965 17.9999 3.63965 19.0366C3.63965 20.6935 4.98279 22.0366 6.63965 22.0366C8.2965 22.0366 9.63965 20.6935 9.63965 19.0366C9.63965 17.3798 8.2965 16.0366 6.63965 16.0366C6.01951 16.0366 5.44333 16.2248 4.96506 16.5471ZM9.12614 4.88371C8.58687 4.08666 7.67444 3.56274 6.63965 3.56274C4.98279 3.56274 3.63965 4.90589 3.63965 6.56274C3.63965 8.2196 4.98279 9.56274 6.63965 9.56274C8.2965 9.56274 9.63965 8.2196 9.63965 6.56274C9.63965 5.94069 9.45032 5.36285 9.12614 4.88371ZM20.8688 9.0447C21.6621 8.50486 22.1831 7.59464 22.1831 6.56274C22.1831 4.90589 20.84 3.56274 19.1831 3.56274C17.5263 3.56274 16.1831 4.90589 16.1831 6.56274C16.1831 8.2196 17.5263 9.56274 19.1831 9.56274C19.8081 9.56274 20.3884 9.37165 20.8688 9.0447Z',
          subheading: (
            <>
              <span className="text-foreground">Learn SQL when you’re ready.</span> In the meantime,
              Supabase generates automatic APIs to make coding a lot easier.
            </>
          ),
          image: (
            <Image
              draggable={false}
              src={{
                dark: '/images/solutions/neon/auto-generated-apis-dark.png',
                light: '/images/solutions/neon/auto-generated-apis-light.png',
              }}
              alt="Auto Generated APIs"
              width={100}
              height={100}
              quality={100}
            />
          ),
        },
        {
          id: 'rbac',
          title: 'Role-Based Access Control',
          icon: 'M17.6874 22.888V20.3886C17.6874 17.5888 15.4178 15.3192 12.618 15.3192C9.8182 15.3192 7.54852 17.5888 7.54852 20.3886V22.888M21.5531 11.5235C21.8189 14.1669 20.9393 16.9038 18.9141 18.9289C18.5359 19.3072 18.1328 19.6455 17.7101 19.9438M20.8038 8.70448C20.3598 7.71036 19.7299 6.77911 18.9141 5.96334C15.3338 2.38299 9.52889 2.38299 5.94855 5.96334C4.17501 7.73687 3.28 10.0562 3.26352 12.3807M24.0875 13.1161L23.2046 12.2332C22.3264 11.355 20.9026 11.355 20.0244 12.2332L19.1415 13.1161M0.875198 10.9503L1.75809 11.8331C2.63629 12.7113 4.06012 12.7113 4.93832 11.8331L5.82121 10.9503M7.49904 20.4919C5.77226 19.4557 4.37848 17.8555 3.62143 15.8584M15.6799 12.1942C15.6799 13.9201 14.2808 15.3192 12.5549 15.3192C10.829 15.3192 9.42993 13.9201 9.42993 12.1942C9.42993 10.4683 10.829 9.06917 12.5549 9.06917C14.2808 9.06917 15.6799 10.4683 15.6799 12.1942Z',
          subheading: <>Secure your data properly.</>,
          image: (
            <Image
              draggable={false}
              src={{
                dark: '/images/solutions/neon/rbac-dark.png',
                light: '/images/solutions/neon/rbac-light.png',
              }}
              alt="Role Based Access Control diagram"
              width={100}
              height={100}
              quality={100}
              containerClassName="md:mb-4 -mt-12 sm:mt-0"
            />
          ),
        },
        {
          id: 'authentication',
          title: 'Authentication',
          icon: MainProducts[PRODUCT_SHORTNAMES.AUTHENTICATION].icon,
          subheading: (
            <>
              Let your users{' '}
              <span className="text-foreground">login with email, Google, Apple, GitHub</span>, and
              more. Secure and trusted.
            </>
          ),
          image: <AuthVisual className="2xl:!-bottom-20" />,
        },
        {
          id: 'storage',
          title: 'Storage',
          icon: MainProducts[PRODUCT_SHORTNAMES.STORAGE].icon,
          subheading: (
            <>
              <span className="text-foreground">Affordable and fast,</span> for all the videos and
              images you need in your app.
            </>
          ),
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
          id: 'realtime',
          title: 'Realtime',
          icon: MainProducts[PRODUCT_SHORTNAMES.REALTIME].icon,
          subheading: (
            <>
              Build immersive{' '}
              <span className="text-foreground">multi-player, collaborative experiences</span>.
            </>
          ),
          image: (
            <RealtimeVisual className="[&_.visual-overlay]:bg-[linear-gradient(to_top,transparent_0%,transparent_50%,hsl(var(--background-default))_75%)]" />
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
          id: 'edge-functions',
          title: 'Edge Functions',
          icon: MainProducts[PRODUCT_SHORTNAMES.FUNCTIONS].icon,
          subheading: <>Custom backend logic when you want to dive into code.</>,
          image: <FunctionsVisual className="" />,
        },
        {
          id: 'foreign-data-wrappers',
          title: 'Foreign Data Wrappers',
          icon: 'M10.2805 18.2121C11.2419 18.6711 12.3325 18.8932 13.4711 18.8084C15.2257 18.6776 16.7596 17.843 17.8169 16.6015M8.21496 8.36469C9.27117 7.14237 10.7928 6.322 12.5311 6.19248C13.7196 6.10392 14.8558 6.34979 15.8474 6.85054M17.8169 16.6015L20.5242 19.3223C22.1857 17.5141 23.1562 15.1497 23.1562 12.5005C23.1562 6.89135 18.6091 2.34424 13 2.34424C10.9595 2.34424 9.16199 2.87659 7.57035 3.91232C8.35717 3.56865 9.22613 3.37801 10.1396 3.37801C12.6236 3.37801 14.7783 4.78762 15.8474 6.85054M17.8169 16.6015V16.6015C16.277 15.059 16.3448 12.5527 16.5387 10.3817C16.5557 10.191 16.5644 9.99794 16.5644 9.80282C16.5644 8.73844 16.3056 7.73451 15.8474 6.85054M13 22.6567C7.39086 22.6567 2.84375 18.1096 2.84375 12.5005C2.84375 9.84123 3.8026 7.48969 5.4753 5.67921L8.21496 8.42354V8.42354C9.76942 9.98064 9.69844 12.5133 9.51947 14.7062C9.50526 14.8803 9.49802 15.0564 9.49802 15.2341C9.49802 18.7705 12.3648 21.6373 15.9012 21.6373C16.8116 21.6373 17.6776 21.4473 18.4618 21.1048C16.8609 22.1588 15.06 22.6567 13 22.6567Z',
          subheading: (
            <>
              Pull data from{' '}
              <span className="text-foreground">Stripe, Google Sheets, Airtable, HubSpot</span>, and
              more, as if they were part of Supabase natively.
            </>
          ),
          image: (
            <Image
              draggable={false}
              src={{
                dark: '/images/solutions/neon/foreign-data-wrappers-dark.png',
                light: '/images/solutions/neon/foreign-data-wrappers-light.png',
              }}
              alt="Foreign Data Wrappers"
              containerClassName="md:mb-4"
              width={100}
              height={100}
              quality={100}
            />
          ),
        },
        {
          id: 'deployment',
          title: 'Instant and secure deployment',
          icon: 'M12.5 1.5625C6.45939 1.5625 1.5625 6.45939 1.5625 12.5C1.5625 18.5406 6.45939 23.4375 12.5 23.4375C18.5406 23.4375 23.4375 18.5406 23.4375 12.5C23.4375 9.90692 22.5351 7.52461 21.0273 5.64995L11.6145 15.0627L9.61957 13.0677M12.6068 5.82237C8.92939 5.82237 5.94826 8.80351 5.94826 12.4809C5.94826 16.1583 8.92939 19.1395 12.6068 19.1395C16.2842 19.1395 19.2654 16.1583 19.2654 12.4809C19.2654 11.1095 18.8507 9.83483 18.14 8.77557',
          subheading: (
            <>
              <span className="text-foreground">No need to set up servers,</span> manage DevOps, or
              tweak security settings.
            </>
          ),
          image: (
            <>
              <Image
                draggable={false}
                src={{
                  dark: '/images/index/products/realtime-dark.svg',
                  light: '/images/index/products/realtime-light.svg',
                }}
                alt="background grid"
                containerClassName="absolute inset-0 rotate-180 not-sr-only"
                width={100}
                height={100}
                quality={100}
              />
              <div
                className="
            absolute pointer-events-none
            w-full h-full
            inset-0 top-auto
            bg-[linear-gradient(to_top,transparent_0%,transparent_50%,hsl(var(--background-default))_75%)]
          "
              />
              <Image
                draggable={false}
                src={{
                  dark: '/images/solutions/neon/slonik-dark.svg',
                  light: '/images/solutions/neon/slonik-light.svg',
                }}
                alt="Postgres slonik elephant"
                width={100}
                height={100}
                quality={100}
              />
            </>
          ),
        },
        {
          id: 'pricing',
          title: 'Pricing for builders',
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
              <div className="absolute inset-0 w-full lg:w-[700px] px-4 pt-1.5 pb-0 lg:p-6 2xl:p-8 lg:pr-0">
                <ComputePricingCalculator disableInteractivity />
              </div>
            </div>
          ),
        },
      ],
    },
    twitterSocialSection: {
      heading: 'Fun projects built with Supabase',
      subheading: 'Discover what our community has to say about their Supabase experience.',
      ctas: (
        <>
          <Button asChild size="small" type="default">
            <Link
              href="https://github.com/supabase/supabase/discussions"
              target="_blank"
              tabIndex={-1}
            >
              GitHub discussions
            </Link>
          </Button>
          <Button asChild type="default" size="small">
            <Link href={'https://discord.supabase.com/'} target="_blank" tabIndex={-1}>
              Discord
            </Link>
          </Button>
        </>
      ),
      tweets: tweets.slice(0, 18),
    },
    platformStarterSection: {
      id: 'platform-starter',
      heading: (
        <>
          <span className="text-foreground block">Choose your platform</span> to start building in
          seconds
        </>
      ),
      headingRight: (
        <>
          Or, start with <span className="text-foreground">Supabase AI Prompts</span>{' '}
          <Sparkles size={24} className="inline text-foreground" />
        </>
      ),
      docsUrl: 'https://supabase.com/docs/guides/getting-started/ai-prompts',
      leftFooter: (
        <div className="grid grid-cols-5 divide-x divide-y rounded-lg overflow-hidden border">
          {frameworks.map((framework) => (
            <FrameworkLink key={framework.name} framework={framework} />
          ))}
        </div>
      ),
      aiPrompts: [
        {
          id: 'auth-setup',
          title: 'Bootstrap Next.js app with Supabase Auth',
          code: `1. Install @supabase/supabase-js and @supabase/ssr packages.
2. Set up environment variables.
3. Write two utility functions with \u0060createClient\u0060 functions to create a browser client and a server client. 
4. Hook up middleware to refresh auth tokens
`,
          language: 'markdown',
          docsUrl:
            'https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth',
        },
        {
          id: 'edge-functions',
          title: 'Writing Supabase Edge Functions',
          code: `1. Try to use Web APIs and Deno’s core APIs instead of external dependencies (eg: use fetch instead of Axios, use WebSockets API instead of node-ws)
2. If you are reusing utility methods between Edge Functions, add them to 'supabase/functions/_shared' and import using a relative path. Do NOT have cross dependencies between Edge Functions.
3. Do NOT use bare specifiers when importing dependecnies. If you need to use an external dependency, make sure it's prefixed with either 'npm:' or 'jsr:'. For example, '@supabase/supabase-js' should be written as 'npm:@supabase/supabase-js'.
4. For external imports, always define a version. For example, 'npm:@express' should be written as 'npm:express@4.18.2'.
5. For external dependencies, importing via 'npm:' and 'jsr:' is preferred. Minimize the use of imports from @'deno.land/x' , 'esm.sh' and @'unpkg.com' . If you have a package from one of those CDNs, you can replace the CDN hostname with 'npm:' specifier.
`,
          language: 'markdown',
          docsUrl: 'https://supabase.com/docs/guides/getting-started/ai-prompts/edge-functions',
        },
        {
          id: 'declarative-db-schema',
          title: 'Declarative Database Schema',
          code: `Mandatory Instructions for Supabase Declarative Schema Management
## 1. **Exclusive Use of Declarative Schema**
-**All database schema modifications must be defined within '.sql' files located in the 'supabase/schemas/' directory.`,
          language: 'markdown',
          docsUrl:
            'https://supabase.com/docs/guides/getting-started/ai-prompts/declarative-database-schema',
        },
        {
          id: 'rls-policies',
          title: 'Create RLS policies',
          code: `You're a Supabase Postgres expert in writing row level security policies. Your purpose is to generate a policy with the constraints given by the user. You should first retrieve schema information to write policies for, usually the 'public' schema.
The output should use the following instructions:

- The generated SQL must be valid SQL.`,
          language: 'markdown',
          docsUrl:
            'https://supabase.com/docs/guides/getting-started/ai-prompts/database-rls-policies',
        },
      ],
    },
    mcp: {
      id: 'mcp',
      heading: (
        <div className="text-foreground-lighter">
          Supabase MCP server works seamlessly with{' '}
          <span className="text-foreground">your favorite AI code editor</span>
        </div>
      ),
      ctaLabel: 'Connect your AI tools',
      documentationLink: '/docs/guides/getting-started/mcp',
      frameworks: editors,
      apiExamples: [
        {
          lang: 'json',
          title: 'macOS',
          code: `{
"mcpServers": {
  "supabase": {
    "command": "npx",
    "args": [
      "-y",
      "@supabase/mcp-server-supabase@latest",
      "--read-only",
      "--project-ref=<project-ref>"
    ],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "<personal-access-token>"
    }
  }
}
}`,
        },
        {
          lang: 'json',
          title: 'Windows',
          code: `{
"mcpServers": {
  "supabase": {
    "command": "cmd",
    "args": [
      "/c",
      "npx",
      "-y",
      "@supabase/mcp-server-supabase@latest",
      "--read-only",
      "--project-ref=<project-ref>"
    ],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "<personal-access-token>"
    }
  }
}
}`,
        },
        {
          lang: 'json',
          title: 'Windows (WSL)',
          code: `{
"mcpServers": {
  "supabase": {
    "command": "wsl",
    "args": [
      "npx",
      "-y",
      "@supabase/mcp-server-supabase@latest",
      "--read-only",
      "--project-ref=<project-ref>"
    ],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "<personal-access-token>"
    }
  }
}
}`,
        },
        {
          lang: 'json',
          title: 'Linux',
          code: `{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=<project-ref>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<personal-access-token>"
      }
    }
  }
}`,
        },
      ],
    },
  }
}

export default data
