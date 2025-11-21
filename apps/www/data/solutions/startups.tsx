import dynamic from 'next/dynamic'
import {
  Check,
  ClipboardCheck,
  FolderLock,
  HeartPulse,
  InfoIcon,
  Lightbulb,
  List,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  UserX,
} from 'lucide-react'
import { CubeIcon } from '@heroicons/react/outline'
import { cn, IconPartners, Image } from 'ui'

import MainProducts from '../MainProducts'
import { TwoColumnsSectionProps } from '~/components/Solutions/TwoColumnsSection'
import RealtimeLogs from 'components/Products/Functions/RealtimeLogs'
import { frameworks } from 'components/Hero/HeroFrameworks'

import type { DXSectionProps } from 'components/Solutions/DeveloperExperienceSection'
import type { ResultsSectionProps } from 'components/Solutions/ResultsSection'
import type { PlatformSectionProps } from 'components/Solutions/PlatformSection'
import {
  FrameworkLink,
  type FrameworkLinkProps,
  type FeaturesSection,
  type HeroSection,
  type Metadata,
} from './solutions.utils'
import type { FeatureGridProps } from 'components/Solutions/FeatureGrid'
import type { SecuritySectionProps } from 'components/Enterprise/Security'
import type { MPCSectionProps } from 'components/Solutions/MPCSection'

import { PRODUCT_SHORTNAMES } from 'shared-data/products'
import { useBreakpoint } from 'common'
import { useSendTelemetryEvent } from 'lib/telemetry'
import { companyStats } from '../company-stats'

const AuthVisual = dynamic(() => import('components/Products/AuthVisual'))
const FunctionsVisual = dynamic(() => import('components/Products/FunctionsVisual'))
const RealtimeVisual = dynamic(() => import('components/Products/RealtimeVisual'))

const data: () => {
  metadata: Metadata
  heroSection: HeroSection
  why: FeaturesSection
  platform: PlatformSectionProps
  developerExperience: DXSectionProps
  resultsSection: ResultsSectionProps
  featureGrid: FeatureGridProps
  securitySection: SecuritySectionProps
  platformStarterSection: TwoColumnsSectionProps
  mcp: MPCSectionProps
} = () => {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const isXs = useBreakpoint(640)
  const editors = getEditors(isXs)

  return {
    metadata: {
      metaTitle: 'Supabase for Startups',
      metaDescription: 'Build fast. Scale easily. Trust your stack.',
    },
    heroSection: {
      id: 'hero',
      title: 'Supabase for Startups',
      h1: (
        <>
          <span className="block text-foreground">Build fast. Scale easily.</span>
          <span className="block md:ml-0">Trust your stack.</span>
        </>
      ),
      subheader: [
        <>
          The Postgres development platform. Supabase is the powerful, scalable backend that lets
          you focus on building a great, differentiated product instead of being stuck building
          infrastructure.
        </>,
      ],
      image: undefined,
      ctas: [
        {
          label: 'Start your company',
          href: 'https://supabase.com/dashboard',
          type: 'primary' as any,
          onClick: () =>
            sendTelemetryEvent({
              action: 'start_project_button_clicked',
              properties: { buttonLocation: 'Solutions: Developers page hero' },
            }),
        },
      ],
    },
    why: {
      id: 'why-supabase',
      label: '',
      heading: (
        <>
          Why <span className="text-foreground">startups</span> choose Supabase
        </>
      ),
      subheading:
        'Speed wins. Supabase helps you move faster by providing a full-featured, scalable backend based on Postgres.',
      features: [
        {
          id: 'build-in-a-weekend',
          icon: Timer,
          heading: 'Build in a weekend',
          subheading:
            'Launch your backend in minutes with seamless integrations for common frameworks. Focus on growth while we handle infrastructure.',
        },
        {
          id: 'development-platform',
          icon: CubeIcon,
          heading: 'A complete development platform',
          subheading:
            'All-in-one suite with auth, storage, edge functions, real-time, and vector search. Use one or all.',
        },
        {
          id: 'scalable',
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
          heading: 'Scale to millions',
          subheading:
            'Fair pricing, a complete, powerful Postgres database, and global infrastructure deployment.',
        },
        {
          id: 'scalable',
          icon: (props: any) => (
            <svg
              width="31"
              height="30"
              viewBox="0 0 31 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              {...props}
            >
              <path
                d="M26.0271 5.7251C25.4 5.09582 24.6548 4.59652 23.8343 4.25583C23.0139 3.91515 22.1342 3.73978 21.2458 3.73978C20.3574 3.73978 19.4778 3.91515 18.6573 4.25583C17.8368 4.59652 17.0917 5.09582 16.4646 5.7251L15.5021 6.7001L14.5396 5.7251C13.9125 5.09582 13.1673 4.59652 12.3468 4.25583C11.5264 3.91515 10.6467 3.73978 9.75831 3.73978C8.86992 3.73978 7.99026 3.91515 7.16978 4.25583C6.34931 4.59652 5.60416 5.09582 4.97706 5.7251C2.32706 8.3751 2.16456 12.8501 5.50206 16.2501L15.5021 26.2501L25.5021 16.2501C28.8396 12.8501 28.6771 8.3751 26.0271 5.7251Z"
                stroke="currentColor"
                strokeWidth="0.952381"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15.5011 6.69992L11.5886 10.6249C11.094 11.1236 10.8164 11.7975 10.8164 12.4999C10.8164 13.2023 11.094 13.8762 11.5886 14.3749C12.0873 14.8696 12.7612 15.1471 13.4636 15.1471C14.166 15.1471 14.8399 14.8696 15.3386 14.3749L18.1636 11.6124C18.8657 10.9178 19.8134 10.5281 20.8011 10.5281C21.7887 10.5281 22.7365 10.9178 23.4386 11.6124L26.4386 14.6124"
                stroke="currentColor"
                strokeWidth="0.952381"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23 18.75L20.5 16.25"
                stroke="currentColor"
                strokeWidth="0.952381"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.25 22.5L16.75 20"
                stroke="currentColor"
                strokeWidth="0.952381"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          heading: 'We try harder',
          subheading: 'Outstanding support to resolve issues fast and keep you building.',
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
          className:
            'flex-col lg:flex-row [&>div:first-child]:lg:!max-w-none [&>div:first-child]:lg:!mr-0 lg:!gap-0',
          image: (
            <div className="relative w-full lg:w-1/3 shrink-1 pt-8 px-4 lg:pr-0">
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
              <span className="text-foreground">Secure authentication</span> with email/password,
              magic links, OAuth (Google, GitHub, Twitter, etc.), SAML, SSO, and phone/SMS OTP.
            </>
          ),
          className: '!border-l-0 sm:!border-l sm:!border-t-0',
          image: <AuthVisual className="2xl:!-bottom-20" />,
        },
        {
          id: 'storage',
          title: 'Storage',
          icon: MainProducts[PRODUCT_SHORTNAMES.STORAGE].icon,
          subheading: (
            <>
              <span className="text-foreground">Scalable S3-compatible</span> object storage for
              managing files, images, and videos.
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
          id: 'edge-functions',
          title: 'Edge Functions',
          icon: MainProducts[PRODUCT_SHORTNAMES.FUNCTIONS].icon,
          subheading: (
            <>
              Serverless functions <span className="text-foreground">powered by Deno</span>,
              deployed globally for low-latency execution.
            </>
          ),
          className: '!border-l-0 sm:!border-l lg:!border-l-0',
          image: <FunctionsVisual className="" />,
        },
        {
          id: 'vectors',
          title: 'Vectors',
          icon: 'M4.13477 12.8129C4.13477 14.1481 4.43245 15.4138 4.96506 16.5471M12.925 4.02271C11.5644 4.02271 10.276 4.33184 9.12614 4.88371M21.7152 12.8129C21.7152 11.4644 21.4115 10.1867 20.8688 9.0447M12.925 21.6032C14.2829 21.6032 15.5689 21.2952 16.717 20.7454M16.717 20.7454C17.2587 21.5257 18.1612 22.0366 19.1831 22.0366C20.84 22.0366 22.1831 20.6935 22.1831 19.0366C22.1831 17.3798 20.84 16.0366 19.1831 16.0366C17.5263 16.0366 16.1831 17.3798 16.1831 19.0366C16.1831 19.6716 16.3804 20.2605 16.717 20.7454ZM4.96506 16.5471C4.16552 17.086 3.63965 17.9999 3.63965 19.0366C3.63965 20.6935 4.98279 22.0366 6.63965 22.0366C8.2965 22.0366 9.63965 20.6935 9.63965 19.0366C9.63965 17.3798 8.2965 16.0366 6.63965 16.0366C6.01951 16.0366 5.44333 16.2248 4.96506 16.5471ZM9.12614 4.88371C8.58687 4.08666 7.67444 3.56274 6.63965 3.56274C4.98279 3.56274 3.63965 4.90589 3.63965 6.56274C3.63965 8.2196 4.98279 9.56274 6.63965 9.56274C8.2965 9.56274 9.63965 8.2196 9.63965 6.56274C9.63965 5.94069 9.45032 5.36285 9.12614 4.88371ZM20.8688 9.0447C21.6621 8.50486 22.1831 7.59464 22.1831 6.56274C22.1831 4.90589 20.84 3.56274 19.1831 3.56274C17.5263 3.56274 16.1831 4.90589 16.1831 6.56274C16.1831 8.2196 17.5263 9.56274 19.1831 9.56274C19.8081 9.56274 20.3884 9.37165 20.8688 9.0447Z',
          subheading: (
            <>
              <span className="text-foreground">pgvector extension</span>
              for AI/ML applications, enabling fast semantic search and embedding storage.
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
          id: 'realtime',
          title: 'Realtime',
          icon: MainProducts[PRODUCT_SHORTNAMES.REALTIME].icon,
          subheading: (
            <>
              Postgres replication enables{' '}
              <span className="text-foreground">live sync functionality</span> for collaborative
              applications.
            </>
          ),
          className: '!border-l-0 sm:!border-l',
          image: (
            <RealtimeVisual className="[&_.visual-overlay]:bg-[linear-gradient(to_top,transparent_0%,transparent_50%,hsl(var(--background-default))_75%)]" />
          ),
        },
      ],
    },
    developerExperience: {
      id: 'developer-experience',
      className: '[&_h2]:!max-w-sm',
      title: (
        <>
          Developers can <span className="text-foreground">build faster</span> with Supabase
        </>
      ),
      subheading: 'Features that help developers move quickly and focus.',
      features: [
        {
          id: 'ai-assistant',
          title: 'AI Assistant',
          icon: 'M11.8949 2.39344C12.5051 1.78324 13.4944 1.78324 14.1046 2.39344L22.9106 11.1994C23.5208 11.8096 23.5208 12.7989 22.9106 13.4091L14.1046 22.2151C13.4944 22.8253 12.5051 22.8253 11.8949 22.2151L3.08892 13.4091C2.47872 12.7989 2.47872 11.8096 3.08892 11.1994L11.8949 2.39344Z M16.5408 12.3043C16.5408 14.2597 14.9556 15.8449 13.0002 15.8449C11.0448 15.8449 9.45961 14.2597 9.45961 12.3043C9.45961 10.3489 11.0448 8.76371 13.0002 8.76371C14.9556 8.76371 16.5408 10.3489 16.5408 12.3043Z',
          subheading: (
            <>
              A single panel that persists across the Supabase Dashboard and maintains{' '}
              <span className="text-foreground">context across AI prompts</span>.
            </>
          ),
          image: (
            <div className="w-full ml-4 md:ml-6 2xl:ml-8 max-w-[430px] rounded-tl-lg border-t border-l bg-default text-foreground">
              <div className="flex items-center gap-3 p-2 lg:p-4 border-b">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 25 25"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="hover:rotate-12 transition-transform duration-300"
                >
                  <path
                    d="M11.8949 2.39344C12.5051 1.78324 13.4944 1.78324 14.1046 2.39344L22.9106 11.1994C23.5208 11.8096 23.5208 12.7989 22.9106 13.4091L14.1046 22.2151C13.4944 22.8253 12.5051 22.8253 11.8949 22.2151L3.08892 13.4091C2.47872 12.7989 2.47872 11.8096 3.08892 11.1994L11.8949 2.39344Z M16.5408 12.3043C16.5408 14.2597 14.9556 15.8449 13.0002 15.8449C11.0448 15.8449 9.45961 14.2597 9.45961 12.3043C9.45961 10.3489 11.0448 8.76371 13.0002 8.76371C14.9556 8.76371 16.5408 10.3489 16.5408 12.3043Z"
                    stroke="hsl(var(--brand-default))"
                    strokeMiterlimit="10"
                    strokeLinejoin="bevel"
                    strokeLinecap="square"
                    strokeWidth="1.5"
                  />
                </svg>
                <div className="flex items-center gap-1">
                  <h3 className="text-sm font-medium">AI Assistant</h3>
                  <InfoIcon className="w-3 h-3 text-foreground-lighter" />
                </div>
              </div>
              <div className="space-y-2 p-4 pr-0 2xl:py-8 xl:pl-12 xl:ml-1 text-sm text-[#808080]">
                <p>Entity: Auth</p>
                <p>Schema:</p>
                <p className="text-[#808080]">
                  Issue: We have detected that you have enabled the email provider with an expiry
                  time of more than an hour. It is recommended to set this value to less th...
                </p>
              </div>
            </div>
          ),
        },
        {
          id: 'mcp-server',
          title: 'MCP Server',
          icon: 'M19 5L22 2M2 22L5 19M7.5 13.5L10 11M10.5 16.5L13 14M6.3 20.3C6.52297 20.5237 6.78791 20.7013 7.07963 20.8224C7.37136 20.9435 7.68413 21.0059 8 21.0059C8.31587 21.0059 8.62864 20.9435 8.92036 20.8224C9.21209 20.7013 9.47703 20.5237 9.7 20.3L12 18L6 12L3.7 14.3C3.47626 14.523 3.29873 14.7879 3.17759 15.0796C3.05646 15.3714 2.99411 15.6841 2.99411 16C2.99411 16.3159 3.05646 16.6286 3.17759 16.9204C3.29873 17.2121 3.47626 17.477 3.7 17.7L6.3 20.3ZM12 6L18 12L20.3 9.7C20.5237 9.47703 20.7013 9.21209 20.8224 8.92036C20.9435 8.62864 21.0059 8.31587 21.0059 8C21.0059 7.68413 20.9435 7.37136 20.8224 7.07963C20.7013 6.78791 20.5237 6.52297 20.3 6.3L17.7 3.7C17.477 3.47626 17.2121 3.29873 16.9204 3.17759C16.6286 3.05646 16.3159 2.99411 16 2.99411C15.6841 2.99411 15.3714 3.05646 15.0796 3.17759C14.7879 3.29873 14.523 3.47626 14.3 3.7L12 6Z',
          subheading: (
            <>
              Connect your <span className="text-foreground">favorite AI tools</span> such as Cursor
              or Claude directly with Supabase.
            </>
          ),
          image: (
            <Image
              draggable={false}
              src={{
                dark: '/images/solutions/neon/mcp-server-dark.svg',
                light: '/images/solutions/neon/mcp-server-light.svg',
              }}
              alt="Vector embeddings"
              width={100}
              height={100}
              quality={100}
            />
          ),
        },
        {
          id: 'auto-generated-apis',
          title: 'Auto-generated APIs',
          icon: 'M4.13477 12.8129C4.13477 14.1481 4.43245 15.4138 4.96506 16.5471M12.925 4.02271C11.5644 4.02271 10.276 4.33184 9.12614 4.88371M21.7152 12.8129C21.7152 11.4644 21.4115 10.1867 20.8688 9.0447M12.925 21.6032C14.2829 21.6032 15.5689 21.2952 16.717 20.7454M16.717 20.7454C17.2587 21.5257 18.1612 22.0366 19.1831 22.0366C20.84 22.0366 22.1831 20.6935 22.1831 19.0366C22.1831 17.3798 20.84 16.0366 19.1831 16.0366C17.5263 16.0366 16.1831 17.3798 16.1831 19.0366C16.1831 19.6716 16.3804 20.2605 16.717 20.7454ZM4.96506 16.5471C4.16552 17.086 3.63965 17.9999 3.63965 19.0366C3.63965 20.6935 4.98279 22.0366 6.63965 22.0366C8.2965 22.0366 9.63965 20.6935 9.63965 19.0366C9.63965 17.3798 8.2965 16.0366 6.63965 16.0366C6.01951 16.0366 5.44333 16.2248 4.96506 16.5471ZM9.12614 4.88371C8.58687 4.08666 7.67444 3.56274 6.63965 3.56274C4.98279 3.56274 3.63965 4.90589 3.63965 6.56274C3.63965 8.2196 4.98279 9.56274 6.63965 9.56274C8.2965 9.56274 9.63965 8.2196 9.63965 6.56274C9.63965 5.94069 9.45032 5.36285 9.12614 4.88371ZM20.8688 9.0447C21.6621 8.50486 22.1831 7.59464 22.1831 6.56274C22.1831 4.90589 20.84 3.56274 19.1831 3.56274C17.5263 3.56274 16.1831 4.90589 16.1831 6.56274C16.1831 8.2196 17.5263 9.56274 19.1831 9.56274C19.8081 9.56274 20.3884 9.37165 20.8688 9.0447Z',
          subheading: (
            <>
              <span className="text-foreground">Learn SQL when you're ready.</span> In the meantime,
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
          id: 'foreign-data-wrappers',
          title: 'Foreign Data Wrappers',
          icon: 'M10.2805 18.2121C11.2419 18.6711 12.3325 18.8932 13.4711 18.8084C15.2257 18.6776 16.7596 17.843 17.8169 16.6015M8.21496 8.36469C9.27117 7.14237 10.7928 6.322 12.5311 6.19248C13.7196 6.10392 14.8558 6.34979 15.8474 6.85054M17.8169 16.6015L20.5242 19.3223C22.1857 17.5141 23.1562 15.1497 23.1562 12.5005C23.1562 6.89135 18.6091 2.34424 13 2.34424C10.9595 2.34424 9.16199 2.87659 7.57035 3.91232C8.35717 3.56865 9.22613 3.37801 10.1396 3.37801C12.6236 3.37801 14.7783 4.78762 15.8474 6.85054M17.8169 16.6015V16.6015C16.277 15.059 16.3448 12.5527 16.5387 10.3817C16.5557 10.191 16.5644 9.99794 16.5644 9.80282C16.5644 8.73844 16.3056 7.73451 15.8474 6.85054M13 22.6567C7.39086 22.6567 2.84375 18.1096 2.84375 12.5005C2.84375 9.84123 3.8026 7.48969 5.4753 5.67921L8.21496 8.42354V8.42354C9.76942 9.98064 9.69844 12.5133 9.51947 14.7062C9.50526 14.8803 9.49802 15.0564 9.49802 15.2341C9.49802 18.7705 12.3648 21.6373 15.9012 21.6373C16.8116 21.6373 17.6776 21.4473 18.4618 21.1048C16.8609 22.1588 15.06 22.6567 13 22.6567Z',
          subheading: (
            <>
              Connect Supabase to <span className="text-foreground">Redshift, BigQuery, MySQL</span>
              , and external APIs for seamless integrations.
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
          id: 'instant-deployment',
          title: 'Instant and secure deployment',
          icon: 'M12.5 1.5625C6.45939 1.5625 1.5625 6.45939 1.5625 12.5C1.5625 18.5406 6.45939 23.4375 12.5 23.4375C18.5406 23.4375 23.4375 18.5406 23.4375 12.5C23.4375 9.90692 22.5351 7.52461 21.0273 5.64995L11.6145 15.0627L9.61957 13.0677M12.6068 5.82237C8.92939 5.82237 5.94826 8.80351 5.94826 12.4809C5.94826 16.1583 8.92939 19.1395 12.6068 19.1395C16.2842 19.1395 19.2654 16.1583 19.2654 12.4809C19.2654 11.1095 18.8507 9.83483 18.14 8.77557',
          subheading: (
            <>
              <span className="text-foreground">No need to set up servers</span>, manage DevOps, or
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
          id: 'observability',
          title: 'Observability',
          icon: 'M11.1404 7.66537C11.1404 5.18146 13.1541 3.16785 15.638 3.16785H17.3775C19.8614 3.16785 21.875 5.18146 21.875 7.66537V17.3776C21.875 19.8615 19.8614 21.8751 17.3775 21.8751H15.638C13.1541 21.8751 11.1404 19.8615 11.1404 17.3776V7.66537Z M3.125 14.7821C3.125 13.4015 4.24419 12.2823 5.62477 12.2823C7.00536 12.2823 8.12454 13.4015 8.12454 14.7821V19.3754C8.12454 20.7559 7.00536 21.8751 5.62477 21.8751C4.24419 21.8751 3.125 20.7559 3.125 19.3754V14.7821Z M3.125 5.58522C3.125 4.20463 4.24419 3.08545 5.62477 3.08545C7.00536 3.08545 8.12454 4.20463 8.12454 5.58522V6.95164C8.12454 8.33223 7.00536 9.45142 5.62477 9.45142C4.24419 9.45142 3.125 8.33223 3.125 6.95164V5.58522Z',
          subheading: (
            <>
              Built-in logs, query performance tools, and security insights for{' '}
              <span className="text-foreground">easy debugging</span>.
            </>
          ),
          image: (
            <RealtimeLogs
              isActive={false}
              isInView={true}
              className="h-3/5 bottom-0 top-auto [&_.visual-overlay]:!bg-[linear-gradient(to_top,hsl(var(--background-default))_0%,transparent_100%)]"
            />
          ),
        },
      ],
    },
    resultsSection: {
      id: 'results',
      heading: (
        <>
          Top performance,
          <br />
          at any scale
        </>
      ),
      subheading:
        "Supabase ensures optimal database performance at any scale, so you can focus on innovating and growing without worrying about infrastructure limitations — whether you're handling high-traffic applications, complex queries, or massive data volumes.",
      highlights: [
        {
          heading: companyStats.databasesManaged.label,
          subheading: companyStats.databasesManaged.text,
        },
        {
          heading: companyStats.databasesLaunchedDaily.label,
          subheading: companyStats.databasesLaunchedDaily.text,
        },
      ],
    },
    featureGrid: {
      id: 'database-features',
      features: [
        {
          id: 'postgres-core',
          title: 'Postgres at its core',
          description: (
            <>
              ACID-compliant, battle-tested database{' '}
              <span className="text-foreground">trusted by enterprises and startups</span>.
            </>
          ),
          icon: 'M13.2689 14.9229C14.04 16.494 15.6379 17.4892 17.3881 17.4893H22.0892C22.4726 17.4893 22.7843 17.8003 22.7845 18.1836C22.7845 18.5671 22.4728 18.8789 22.0892 18.8789H20.1664C20.1564 21.0605 18.171 22.4853 16.0052 22.4854C14.044 22.4854 12.4009 21.1292 11.9603 19.3037L11.9213 19.126L11.9086 18.9854C11.9116 18.6624 12.1408 18.3748 12.4701 18.3105C12.7994 18.2463 13.1203 18.4265 13.2445 18.7246L13.2845 18.8594L13.3412 19.0947C13.6746 20.251 14.742 21.0967 16.0052 21.0967C17.6551 21.0966 18.7655 20.0649 18.7758 18.8789H17.3881C15.108 18.8788 13.0263 17.5811 12.0218 15.5342L13.2689 14.9229ZM18.7767 15.6787V11.4639C18.7766 8.09738 16.0476 5.36816 12.681 5.36816H11.7269C11.7032 5.36816 11.6797 5.36364 11.6566 5.36133H7.15564C6.5783 5.36133 6.05835 5.69927 5.82068 6.21777L5.77673 6.32422L4.26404 10.4443C4.03486 11.0686 4.21563 11.7696 4.71814 12.2051L5.75622 13.1045L5.93298 13.2754C6.32193 13.694 6.54138 14.2468 6.54138 14.8242V16.4775L6.5531 16.7227C6.67574 17.9298 7.69544 18.8721 8.93493 18.8721C9.2213 18.8721 9.45986 18.6685 9.51501 18.3984L9.52771 18.2793V10.9121C9.52772 9.33737 10.1566 7.82755 11.2748 6.71875L11.3842 6.63086C11.6543 6.45411 12.0199 6.48475 12.2562 6.72266C12.5263 6.995 12.5247 7.43503 12.2523 7.70508L12.097 7.86816C11.3396 8.69814 10.9164 9.78304 10.9164 10.9121V18.2793L10.9056 18.4814C10.8044 19.4807 9.96094 20.2607 8.93493 20.2607C6.91113 20.2607 5.25814 18.6714 5.15661 16.6729L5.15173 16.4775V14.8242C5.15173 14.5993 5.06693 14.3838 4.9154 14.2207L4.84607 14.1543L3.80798 13.2549C2.86934 12.4414 2.53223 11.1318 2.96033 9.96582L4.47302 5.84473L4.55798 5.63867C5.02039 4.62971 6.03224 3.97266 7.15564 3.97266H11.8246V3.97949H12.681C16.8146 3.97949 20.1662 7.33032 20.1664 11.4639V15.6787C20.1664 16.0622 19.8546 16.373 19.4711 16.373C19.0877 16.3728 18.7767 16.0621 18.7767 15.6787ZM12.3392 14.6055C12.6835 14.4365 13.1 14.5785 13.2689 14.9229L12.0218 15.5342C11.8532 15.1901 11.9953 14.7745 12.3392 14.6055Z M14.4779 10.7135C14.4779 11.1278 14.8137 11.4635 15.2279 11.4635C15.6421 11.4635 15.9779 11.1278 15.9779 10.7135C15.9779 10.2993 15.6421 9.96354 15.2279 9.96354C14.8137 9.96354 14.4779 10.2993 14.4779 10.7135Z',
          iconNoStroke: true,
        },
        {
          id: 'scaling',
          title: 'Horizontal & Vertical Scaling',
          description: (
            <>
              Scale compute and storage independently, including support for{' '}
              <span className="text-foreground">read replicas</span>.
            </>
          ),
          icon: 'M14.2847 11.1404V7.8447C14.2847 5.36078 12.2711 3.34717 9.7872 3.34717H7.84476C5.36084 3.34717 3.34723 5.36078 3.34723 7.8447V9.78714C3.34723 12.2711 5.36084 14.2847 7.84476 14.2847H11.1253M8.63752 8.65306L18.4524 18.468M19.1282 14.068V16.5986C19.1282 17.8405 18.1214 18.8474 16.8794 18.8474H14.2847M15.6573 22.0972H17.5997C20.0836 22.0972 22.0972 20.0836 22.0972 17.5996V15.6572C22.0972 13.1733 20.0836 11.1597 17.5997 11.1597H15.6573C13.1733 11.1597 11.1597 13.1733 11.1597 15.6572V17.5996C11.1597 20.0836 13.1733 22.0972 15.6573 22.0972Z',
        },
        {
          id: 'multi-region',
          title: 'Multi-region Deployments',
          description: (
            <>
              Deploy databases across multiple regions for{' '}
              <span className="text-foreground">global availability</span>.
            </>
          ),
          icon: 'M8.48462 3.05339C6.79298 3.58819 5.33457 4.64831 4.30037 6.0436C3.4029 7.25444 2.82613 8.71636 2.69516 10.306H6.77142C6.83771 8.01994 7.22916 5.93809 7.84745 4.36313C8.03485 3.88578 8.24723 3.44433 8.48462 3.05339ZM10.9999 1.27832C7.79633 1.27832 4.95467 2.82842 3.18457 5.21656C1.98658 6.83284 1.2778 8.83471 1.2778 11.0001C1.2778 13.1781 1.99476 15.1906 3.20527 16.8117C4.97675 19.1842 7.80877 20.7225 10.9999 20.7225C14.191 20.7225 17.023 19.1841 18.7944 16.8117C20.005 15.1906 20.722 13.1781 20.722 11.0001C20.722 8.83471 20.0132 6.83284 18.8152 5.21656L18.7944 5.18864C17.0229 2.81635 14.1909 1.27832 10.9999 1.27832ZM10.9999 2.66721C10.768 2.66721 10.4732 2.78413 10.1294 3.15462C9.78466 3.52602 9.44227 4.10142 9.14028 4.87067C8.596 6.2571 8.22699 8.16013 8.16092 10.306H13.8389C13.7728 8.16013 13.4038 6.2571 12.8595 4.87067C12.5575 4.10142 12.2151 3.52602 11.8704 3.15462C11.5265 2.78413 11.2318 2.66721 10.9999 2.66721ZM15.2284 10.306C15.1621 8.01994 14.7706 5.93809 14.1523 4.36313C13.9649 3.88578 13.7525 3.44433 13.5152 3.05339C15.1971 3.58512 16.6485 4.63618 17.6816 6.01966L17.6994 6.0436C18.5969 7.25443 19.1737 8.71636 19.3046 10.306H15.2284ZM13.8389 11.6949H8.16092C8.22699 13.8407 8.596 15.7437 9.14028 17.1301C9.44227 17.8994 9.78466 18.4748 10.1294 18.8462C10.4732 19.2167 10.768 19.3336 10.9999 19.3336C11.2318 19.3336 11.5265 19.2167 11.8704 18.8462C12.2151 18.4748 12.5575 17.8994 12.8595 17.1301C13.4038 15.7437 13.7728 13.8407 13.8389 11.6949ZM13.5152 18.9473C13.7526 18.5564 13.965 18.115 14.1523 17.6377C14.7706 16.0627 15.1621 13.9809 15.2284 11.6949H19.3046C19.1727 13.2947 18.5892 14.7653 17.6816 15.9807C16.6485 17.3643 15.1971 18.4155 13.5152 18.9473ZM8.48458 18.9474C8.24721 18.5564 8.03484 18.115 7.84745 17.6377C7.22916 16.0627 6.83771 13.9809 6.77142 11.6949H2.6952C2.82712 13.2947 3.41061 14.7653 4.31815 15.9808C5.35126 17.3644 6.80264 18.4156 8.48458 18.9474Z',
          iconNoStroke: true,
        },
        {
          id: 'high-availability',
          title: 'High Availability Architecture',
          description: (
            <>
              Enterprise plans offer{' '}
              <span className="text-foreground">automatic failover and redundancy</span> for
              mission-critical applications.
            </>
          ),
          icon: 'M16.3046 3.24514C15.3004 2.91279 14.2268 2.73291 13.1111 2.73291C7.50197 2.73291 2.95486 7.28002 2.95486 12.8892C2.95486 18.4983 7.50197 23.0454 13.1111 23.0454C18.7203 23.0454 23.2674 18.4983 23.2674 12.8892C23.2674 10.5703 22.4902 8.4329 21.1822 6.72328L12.2253 15.5572L10.2303 13.5622M13.2175 6.31682C9.54013 6.31682 6.55899 9.29795 6.55899 12.4809C6.55899 16.1583 9.54013 19.1395 13.2175 19.1395C16.895 19.1395 19.8761 16.1583 19.8761 12.4809C19.8761 11.1095 19.4615 9.83483 18.7507 8.77557',
        },
        {
          id: 'pitr',
          title: 'Point-in-Time Recovery',
          description: (
            <>
              Restore your database <span className="text-foreground">to any point in time</span>{' '}
              for disaster recovery.
            </>
          ),
          icon: 'M3.3784 13.3407C3.1413 10.4689 4.12132 7.51558 6.31845 5.31845C10.2847 1.35219 16.7153 1.35219 20.6816 5.31845C24.6478 9.28471 24.6478 15.7153 20.6816 19.6816C16.7153 23.6478 10.2847 23.6478 6.31845 19.6816C5.3819 18.745 4.6665 17.671 4.17224 16.5246M0.706939 11.443L2.28117 13.0172C2.89137 13.6274 3.88069 13.6274 4.49088 13.0172L6.06512 11.443M10.761 17.5453L16.0995 17.5453C16.9625 17.5453 17.662 16.8458 17.662 15.9828V15.7328C17.662 14.8699 16.9625 14.1703 16.0995 14.1703L10.761 14.1703C9.89806 14.1703 9.1985 14.8699 9.1985 15.7328L9.1985 15.9828C9.1985 16.8458 9.89806 17.5453 10.761 17.5453ZM11.1648 14.1711L15.6537 14.1711C16.5167 14.1711 17.2162 13.4716 17.2162 12.6086L17.2162 12.3586C17.2162 11.4956 16.5167 10.7961 15.6537 10.7961L11.1648 10.7961C10.3019 10.7961 9.60234 11.4956 9.60234 12.3586L9.60234 12.6086C9.60234 13.4716 10.3019 14.1711 11.1648 14.1711ZM10.7606 10.7963L16.0991 10.7963C16.9621 10.7963 17.6616 10.0967 17.6616 9.2338V8.98375C17.6616 8.1208 16.9621 7.42125 16.0991 7.42125L10.7606 7.42125C9.89765 7.42125 9.19809 8.12081 9.19809 8.98375L9.19809 9.2338C9.19809 10.0967 9.89765 10.7963 10.7606 10.7963Z',
        },
        {
          id: 'backups',
          title: 'Automatic Backups',
          description: (
            <>
              <span className="text-foreground">Daily backups</span> with retention policies for
              added security.
            </>
          ),
          icon: 'M22.375 5.7085C22.375 7.43439 18.1777 8.8335 13 8.8335C7.82233 8.8335 3.625 7.43439 3.625 5.7085M22.375 5.7085C22.375 3.98261 18.1777 2.5835 13 2.5835C7.82233 2.5835 3.625 3.98261 3.625 5.7085M22.375 5.7085V10.1877M3.625 5.7085L3.625 20.2918C3.62434 20.9675 4.28075 21.6251 5.49583 22.166C6.71091 22.7069 8.41919 23.1019 10.3646 23.2918M3.625 13.0002C3.6235 13.5826 4.11036 14.1536 5.03066 14.6487C5.95095 15.1438 7.26805 15.5434 8.83334 15.8022M13 13.0002V17.1668M13 17.1668H17.1667M13 17.1668L15.1771 14.9897C16.0833 14.0835 17.3438 13.521 18.7292 13.521C19.9724 13.521 21.1647 14.0149 22.0437 14.8939C22.9228 15.773 23.4167 16.9653 23.4167 18.2085C23.4167 19.3016 23.0727 20.3671 22.4336 21.2539C21.7944 22.1407 20.8924 22.8039 19.8554 23.1496C18.8183 23.4952 17.6988 23.5059 16.6554 23.1799C15.612 22.854 14.6975 22.208 14.0417 21.3335',
        },
      ],
    },
    securitySection: {
      id: 'security',
      label: 'Security',
      heading: 'Trusted for medical records, missions to the moon, and everything in between',
      subheading:
        "Keep your data secure with SOC 2, HIPAA, and GDPR compliance. Your customers' data is encrypted at rest and in transit, with built-in tools for monitoring and managing security threats.",
      features: [
        {
          icon: ShieldCheck,
          heading: 'SOC 2 Type II certified',
        },
        {
          icon: HeartPulse,
          heading: 'HIPAA compliance',
        },
        {
          icon: ShieldAlert,
          heading: 'DDoS Protection',
        },
        {
          icon: Lock,
          heading: 'Multi-factor Authentication',
        },
        {
          icon: ClipboardCheck,
          heading: 'Vulnerability Management',
        },
        {
          icon: Users,
          heading: 'Role-based access control',
        },
        {
          icon: List,
          heading: 'Database Audit Logs',
        },
        {
          icon: Lightbulb,
          heading: 'Security Advisors',
        },
        {
          icon: FolderLock,
          heading: 'Encrypted Storage',
        },
        {
          icon: UserX,
          heading: 'Network restrictions',
        },
      ],
      cta: {
        label: 'Learn about security',
        url: '/security',
      },
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
          description:
            '## Overview of implementing Supabase Auth SSR\n1. Install @supabase/supabase-js and...',
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
          description:
            "You're a Supabase Postgres expert in writing row level security policies. Your purpose is to generate...",
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
          description:
            "You're a Supabase Postgres expert in writing row level security policies. Your purpose is to generate...",
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
          description:
            "You're a Supabase Postgres expert in writing row level security policies. Your purpose is to generate...",
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

export const getEditors: (isXs: boolean) => FrameworkLinkProps[] = (isXs) => [
  {
    name: 'Cursor',
    icon: (
      <svg
        width={isXs ? 35 : 45}
        height={isXs ? 35 : 45}
        viewBox="0 0 61 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <mask
          id="mask0_2981_701"
          style={{ maskType: 'alpha' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="80"
          height="80"
        >
          <rect x="0.132324" width="60" height="60" fill="url(#pattern0_2981_701)" />
        </mask>
        <g mask="url(#mask0_2981_701)">
          <rect
            x="-6.99658"
            y="-8.91089"
            width="71.8812"
            height="68.9109"
            fill="url(#paint0_linear_2981_701)"
          />
        </g>
        <defs>
          <pattern
            id="pattern0_2981_701"
            patternContentUnits="objectBoundingBox"
            width="1"
            height="1"
          >
            <use xlinkHref="#image0_2981_701" transform="scale(0.000976562)" />
          </pattern>
          <linearGradient
            id="paint0_linear_2981_701"
            x1="-6.99658"
            y1="60"
            x2="61.853"
            y2="-11.8172"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="hsl(var(--foreground-default))" stopOpacity="0.5" />
            <stop offset="1" stopColor="hsl(var(--foreground-default))" />
          </linearGradient>
          <image
            id="image0_2981_701"
            width="1024"
            height="1024"
            preserveAspectRatio="none"
            xlinkHref="data:image/png;base64,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"
          />
        </defs>
      </svg>
    ),
    docs: '/docs/guides/getting-started/mcp#cursor',
  },
  {
    name: 'Visual Studio Code (Copilot)',
    icon: 'M50.1467 13.5721C50.2105 13.572 50.2743 13.5724 50.3382 13.576C50.3414 13.5762 50.3447 13.5768 50.3479 13.577C50.4258 13.5816 50.5036 13.5892 50.5813 13.5995C50.5895 13.6006 50.5976 13.6022 50.6057 13.6034C50.9388 13.6498 51.2689 13.7462 51.5833 13.8983L62.4924 19.1756C63.5692 19.6966 64.2777 20.757 64.3596 21.9442C64.3653 22.0231 64.3684 22.1026 64.3684 22.1825V22.3104C64.3684 22.301 64.3676 22.2914 64.3674 22.2821V57.8417C64.3675 57.834 64.3684 57.8259 64.3684 57.8182V57.9461C64.3684 57.9598 64.3666 57.9736 64.3665 57.9872C64.354 59.2535 63.6289 60.4044 62.4924 60.954L51.5833 66.2303C51.194 66.4187 50.7811 66.5227 50.3674 66.5497C50.3525 66.5507 50.3375 66.5518 50.3225 66.5526C50.2401 66.5568 50.1577 66.5585 50.0755 66.5565C49.6814 66.5509 49.2901 66.476 48.9221 66.3319C48.5051 66.1688 48.1177 65.918 47.7874 65.5858L26.9163 46.4471L17.8372 53.3749C17.4137 53.6981 16.9059 53.8466 16.4055 53.8241H16.3743C15.8739 53.8018 15.3809 53.6085 14.9876 53.2489L12.0706 50.5809C11.1081 49.7012 11.1073 48.1798 12.0686 47.2987L19.9573 40.0643L12.0676 32.8299C11.1064 31.9489 11.108 30.4273 12.0706 29.5477L14.9876 26.8797C15.3809 26.5201 15.8739 26.3269 16.3743 26.3045H16.594C17.032 26.3224 17.4668 26.4713 17.8372 26.7538L26.9163 33.6815L47.7874 14.5428C47.9113 14.4183 48.0433 14.3052 48.1819 14.204C48.7277 13.8051 49.3759 13.5895 50.0354 13.5721H50.0715C50.0966 13.5716 50.1217 13.5721 50.1467 13.5721ZM35.2825 40.0643L51.0969 52.1307V27.9969L35.2825 40.0643Z',
    docs: '/docs/guides/getting-started/mcp#visual-studio-code-copilot',
  },
  {
    name: 'Claude',
    icon: 'M22.1027 49.8962L33.9052 43.2734L34.1027 42.6962L33.9052 42.3772H33.328L31.3534 42.2557L24.609 42.0734L18.7609 41.8304L13.0951 41.5266L11.6673 41.2228L10.3306 39.4608L10.4673 38.5797L11.6673 37.7747L13.3837 37.9266L17.1812 38.1848L22.8774 38.5797L27.009 38.8228L33.1306 39.4608H34.1027L34.2394 39.0658L33.9052 38.8228L33.647 38.5797L27.7534 34.5848L21.3736 30.362L18.0318 27.9316L16.2242 26.7013L15.3128 25.5468L14.9179 23.0253L16.5584 21.2177L18.7609 21.3696L19.323 21.5215L21.5559 23.238L26.3255 26.9291L32.5534 31.5165L33.4647 32.276L33.8293 32.0177L33.8749 31.8354L33.4647 31.1519L30.0774 25.0304L26.4622 18.8025L24.8521 16.2203L24.4268 14.6709C24.2749 14.0329 24.1685 13.5013 24.1685 12.8481L26.0369 10.3114L27.0698 9.97722L29.5609 10.3114L30.609 11.2228L32.1584 14.762L34.6647 20.3367L38.5534 27.9165L39.6926 30.1646L40.3002 32.2456L40.528 32.8835H40.923V32.519L41.242 28.2506L41.8344 23.0101L42.4116 16.2658L42.609 14.3671L43.5508 12.0886L45.4192 10.8582L46.8774 11.557L48.0774 13.2734L47.9103 14.3823L47.1964 19.0152L45.7989 26.276L44.8875 31.1367H45.4192L46.0268 30.5291L48.4875 27.2633L52.6192 22.0987L54.442 20.0481L56.5685 17.7848L57.9356 16.7063H60.5179L62.4166 19.5316L61.566 22.4481L58.9078 25.8203L56.7052 28.676L53.5458 32.9291L51.5711 36.3316L51.7534 36.6051L52.2242 36.5595L59.3635 35.0405L63.2217 34.3418L67.8242 33.5519L69.9053 34.5241L70.1331 35.5114L69.3128 37.5316L64.3913 38.7468L58.6192 39.9013L50.0217 41.9367L49.9154 42.0127L50.0369 42.1646L53.9103 42.5291L55.566 42.6203H59.6217L67.1711 43.1823L69.1458 44.4886L70.3306 46.0835L70.1331 47.2987L67.0951 48.8481L62.9939 47.876L53.4242 45.5975L50.1432 44.7772H49.6875V45.0506L52.4217 47.7241L57.4344 52.2506L63.7078 58.0835L64.0268 59.5266L63.2217 60.6658L62.3711 60.5443L56.8571 56.3975L54.7306 54.5291L49.9154 50.4734H49.5964V50.8987L50.7052 52.5241L56.5685 61.3342L56.8723 64.038L56.447 64.919L54.928 65.4506L53.2571 65.1468L49.8242 60.3316L46.285 54.9089L43.4293 50.0481L43.0799 50.2456L41.3939 68.3975L40.604 69.3241L38.7812 70.0228L37.2622 68.8684L36.4571 67L37.2622 63.3089L38.2344 58.4937L39.0242 54.6658L39.7382 49.9114L40.1635 48.3316L40.1331 48.2253L39.7837 48.2709L36.1989 53.1924L30.7458 60.5595L26.4318 65.1772L25.3989 65.5873L23.6065 64.6608L23.7736 63.0051L24.7761 61.5316L30.7458 53.9367L34.3458 49.2279L36.6698 46.5089L36.6546 46.1139H36.5179L20.6597 56.4127L17.8344 56.7772L16.6192 55.638L16.7711 53.7696L17.3483 53.162L22.1179 49.881L22.1027 49.8962Z',
    docs: '/docs/guides/getting-started/mcp#claude-code',
  },
  {
    name: 'Windsurf',
    icon: 'M70.1801 22.6639H69.6084C66.5989 22.6592 64.1571 25.0966 64.1571 28.1059V40.2765C64.1571 42.7069 62.1485 44.6756 59.7579 44.6756C58.3377 44.6756 56.9197 43.9607 56.0785 42.7608L43.6475 25.0076C42.6163 23.5334 40.9384 22.6545 39.1219 22.6545C36.2885 22.6545 33.7386 25.0638 33.7386 28.0379V40.2788C33.7386 42.7092 31.7465 44.6779 29.3395 44.6779C27.9146 44.6779 26.499 43.9631 25.6576 42.7631L11.748 22.8983C11.434 22.4506 10.7285 22.6709 10.7285 23.2193V33.8338C10.7285 34.3705 10.8926 34.8908 11.1996 35.3314L24.8866 54.8798C25.6952 56.0352 26.8881 56.893 28.2638 57.2047C31.7066 57.9876 34.8752 55.3369 34.8752 51.9596V39.7258C34.8752 37.2954 36.844 35.3267 39.2742 35.3267H39.2812C40.7462 35.3267 42.1196 36.0415 42.9609 37.2414L55.3916 54.9924C56.4251 56.4688 58.0166 57.3455 59.9149 57.3455C62.8116 57.3455 65.2935 54.9336 65.2935 51.962V39.7234C65.2935 37.293 67.2622 35.3243 69.6927 35.3243H70.1777C70.4825 35.3243 70.7285 35.0783 70.7285 34.7736V23.2123C70.7285 22.9076 70.4825 22.6615 70.1777 22.6615L70.1801 22.6639Z',
    docs: '/docs/guides/getting-started/mcp#windsurf',
  },
  {
    name: 'Cline',
    icon: 'M40.6646 10C42.5072 10 44.2747 10.7322 45.5776 12.0352C46.8803 13.338 47.6118 15.1049 47.6118 16.9473C47.6118 18.0072 47.3683 19.0415 46.9146 19.9775H53.1167C59.9917 19.9775 65.5669 25.5779 65.5669 32.4854V36.6523L69.1919 43.8926C69.3687 44.2454 69.4603 44.6347 69.4595 45.0293C69.4586 45.424 69.3654 45.813 69.187 46.165L65.5669 53.3252V57.4951C65.5668 64.4001 59.9917 70 53.1167 70H28.2144C21.337 69.9998 15.7652 64.4 15.7651 57.4951V53.3252L12.065 46.1875C11.8788 45.8299 11.7811 45.4325 11.7798 45.0293C11.7786 44.6263 11.8734 44.2288 12.0571 43.8701L15.7622 36.6523V32.4854C15.7622 25.5779 21.3374 19.9775 28.2124 19.9775H34.4146C33.9609 19.0416 33.7173 18.0071 33.7173 16.9473C33.7174 15.1048 34.4496 13.338 35.7525 12.0352C37.0553 10.7323 38.8221 10.0001 40.6646 10ZM49.5073 34C47.9996 34 46.553 34.5989 45.4868 35.665C44.4209 36.7311 43.8219 38.1771 43.8218 39.6846V49.79C43.8218 51.2976 44.4209 52.7435 45.4868 53.8096C46.553 54.8757 47.9996 55.4746 49.5073 55.4746C51.015 55.4746 52.4608 54.8757 53.5269 53.8096C54.593 52.7434 55.1919 51.2978 55.1919 49.79V39.6846C55.1918 38.9379 55.0451 38.1986 54.7593 37.5088C54.4734 36.8189 54.054 36.192 53.5259 35.6641C52.9978 35.1362 52.3711 34.7172 51.6812 34.4316C50.9912 34.1461 50.2541 33.9997 49.5073 34ZM31.1919 34C29.6843 34.0001 28.2385 34.599 27.1724 35.665C26.1063 36.7311 25.5075 38.177 25.5073 39.6846V49.79C25.5385 51.2768 26.1509 52.692 27.2134 53.7324C28.2759 54.7729 29.7038 55.3555 31.1909 55.3555C32.678 55.3555 34.106 54.7729 35.1685 53.7324C36.2309 52.692 36.8433 51.2768 36.8745 49.79V39.6846C36.8744 38.1774 36.276 36.732 35.2105 35.666C34.1449 34.5999 32.6992 34.0007 31.1919 34Z',
    docs: '/docs/guides/getting-started/mcp#visual-studio-code-copilot',
  },
]

export default data
