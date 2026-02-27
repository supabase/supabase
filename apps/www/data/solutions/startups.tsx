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
  getEditors,
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
              Connect Supabase to <span className="text-foreground">BigQuery, Snowflake, ClickHouse</span>
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
          title: 'Multi-region Options',
          description: (
            <>
              Deploy in your chosen region with optional read replicas in other regions for{' '}
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
              <span className="text-foreground">failover and redundancy</span> for
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

export default data
