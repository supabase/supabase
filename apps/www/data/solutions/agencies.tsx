import dynamic from 'next/dynamic'
import {
  ArrowLeftRight,
  Check,
  ClipboardCheck,
  FolderLock,
  Globe2,
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
import { Image } from 'ui'

import MainProducts from '../MainProducts'
import RealtimeLogs from 'components/Products/Functions/RealtimeLogs'
import { frameworks } from 'components/Hero/HeroFrameworks'

import type { DXSectionProps } from 'components/Solutions/DeveloperExperienceSection'
import type { PlatformSectionProps } from 'components/Solutions/PlatformSection'
import type { ResultsSectionProps } from 'components/Solutions/ResultsSection'
import type { SecuritySectionProps } from 'components/Enterprise/Security'
import type { TwoColumnsSectionProps } from 'components/Solutions/TwoColumnsSection'
import type { MPCSectionProps } from 'components/Solutions/MPCSection'
import {
  FrameworkLink,
  type FeaturesSection,
  type FrameworkLinkProps,
  type HeroSection,
  type Metadata,
  type Quotes,
  getEditors,
} from './solutions.utils'
import { PRODUCT_SHORTNAMES } from 'shared-data/products'
import { companyStats } from '../company-stats'

const AuthVisual = dynamic(() => import('components/Products/AuthVisual'))
const FunctionsVisual = dynamic(() => import('components/Products/FunctionsVisual'))
const RealtimeVisual = dynamic(() => import('components/Products/RealtimeVisual'))

const editors = getEditors(false)

const data: {
  metadata: Metadata
  heroSection: HeroSection
  quotes: Quotes
  why: FeaturesSection
  platform: PlatformSectionProps
  developerExperience: DXSectionProps
  resultsSection: ResultsSectionProps
  securitySection: SecuritySectionProps
  partnerships: FeaturesSection
  platformStarterSection: TwoColumnsSectionProps
  mcp: MPCSectionProps
} = {
  metadata: {
    metaTitle: 'Supabase for Agencies',
    metaDescription:
      'Build production-ready client applications faster with a fully managed Postgres backend that scales with every engagement.',
  },
  heroSection: {
    id: 'hero',
    title: 'Supabase for Agencies',
    h1: <>Supabase for Agencies</>,
    subheader: [
      <>
        <strong className="text-foreground">
          Ship client projects faster, scale with confidence, stay profitable.
        </strong>
      </>,
      <>
        You need to deliver production-ready applications quickly without sacrificing quality or
        accumulating technical debt. Supabase gives you a fully managed Postgres backend with
        everything needed to build and scale client applications while maintaining the flexibility
        your clients demand.
      </>,
    ],
    image: undefined,
    ctas: [
      {
        label: 'Start your project',
        href: 'https://supabase.com/dashboard',
        type: 'primary' as const,
      },
      {
        label: 'Request a demo',
        href: '#request-demo',
        type: 'default' as const,
      },
    ],
  },
  quotes: {
    id: 'quotes',
    items: [
      {
        icon: '/images/logos/publicity/imaginary-space.svg',
        avatar: '/images/avatars/thomas-olson.jpeg',
        author: 'Thomas Olson',
        authorTitle: 'COO, Imaginary Space',
        quote: (
          <>
            <span className="text-foreground">
              Our clients want reliability and scale. Supabase gives us a backend we can trust for
              production work.
            </span>
          </>
        ),
      },
      {
        icon: '/images/logos/publicity/sj-innovation.svg',
        avatar: '/images/avatars/shahed-islam.jpeg',
        author: 'Shahed Islam',
        authorTitle: 'CEO, SJ Innovation LLC',
        quote: (
          <>
            <span className="text-foreground">
              Supabase lets us build stable, secure products extremely fast.
            </span>
          </>
        ),
      },
      {
        icon: '/images/logos/publicity/wegetdesign.svg',
        avatar: '/images/avatars/omar-moulani.jpeg',
        author: 'Omar Moulani',
        authorTitle: 'Founder, WeGetDesign',
        quote: (
          <>
            <span className="text-foreground">
              Supabase brings structure and clarity to our backend work. Its interface and tooling
              make it easy to deploy, manage, and scale projects without friction.
            </span>
          </>
        ),
      },
      {
        icon: '/images/logos/publicity/brthrs.svg',
        avatar: '/images/avatars/zimo-holdijk.jpeg',
        author: 'Zimo Holdijk',
        authorTitle: 'Lead Product Manager, Brthrs',
        quote: (
          <>
            <span className="text-foreground">
              Supabase is our go-to backend for client work because it&apos;s fast to build with and
              easy to maintain.
            </span>
          </>
        ),
      },
    ],
  },
  why: {
    id: 'why-agencies',
    label: '',
    heading: (
      <>
        Why <span className="text-foreground">agencies</span> choose Supabase
      </>
    ),
    subheading:
      'You want to deliver exceptional results for your clients while staying profitable and competitive. At the same time, you need the flexibility to customize solutions and the confidence that your applications will scale. Supabase is the complete Postgres developer platform of choice for agencies building production applications.',
    features: [
      {
        id: 'ship-faster',
        icon: Timer,
        heading: 'Ship client projects faster',
        subheading:
          'Deliver production-ready applications in weeks, not months. Supabase provides a complete backend with auto-generated APIs and built-in features, letting you focus on what makes each client project unique rather than rebuilding the same infrastructure every time.',
      },
      {
        id: 'trusted-technology',
        icon: CubeIcon,
        heading: 'Build on technology your clients can trust',
        subheading:
          'Give clients enterprise-grade security and compliance without the enterprise complexity. Supabase is “just Postgres,” offering SOC 2 and HIPAA compliance out of the box so their applications are built on battle-tested, portable technology they can grow with.',
      },
      {
        id: 'maintain-scale',
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
        heading: 'Maintain and scale with ease',
        subheading:
          'Reduce ongoing maintenance and keep clients happy long after launch. Applications built on Supabase are ready to handle growth, with read replicas, HA architecture, and flexible tooling so you can support every phase of a client engagement.',
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
      'Supabase includes everything you need to deliver complete, production-ready applications for your clients.',
    features: [
      {
        id: 'database',
        title: 'Database',
        isDatabase: true,
        icon: MainProducts[PRODUCT_SHORTNAMES.DATABASE].icon,
        subheading: (
          <>
            <span className="text-foreground">A fully managed Postgres database.</span>
            <br /> No forks: 100% pure Postgres.
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
            <span className="text-foreground">Secure authentication</span> with email/password,
            magic links, OAuth (Google, GitHub, Twitter, etc.), SAML, SSO, and phone/SMS OTP.
          </>
        ),
        className: '!border-l-0 sm:!border-l sm:!border-t-0',
        image: <AuthVisual className="2xl:!-bottom-20" />,
      },
      {
        id: 'rbac',
        title: 'Role-Based Access Control',
        icon: 'M17.6874 22.888V20.3886C17.6874 17.5888 15.4178 15.3192 12.618 15.3192C9.8182 15.3192 7.54852 17.5888 7.54852 20.3886V22.888M21.5531 11.5235C21.8189 14.1669 20.9393 16.9038 18.9141 18.9289C18.5359 19.3072 18.1328 19.6455 17.7101 19.9438M20.8038 8.70448C20.3598 7.71036 19.7299 6.77911 18.9141 5.96334C15.3338 2.38299 9.52889 2.38299 5.94855 5.96334C4.17501 7.73687 3.28 10.0562 3.26352 12.3807M24.0875 13.1161L23.2046 12.2332C22.3264 11.355 20.9026 11.355 20.0244 12.2332L19.1415 13.1161M0.875198 10.9503L1.75809 11.8331C2.63629 12.7113 4.06012 12.7113 4.93832 11.8331L5.82121 10.9503M7.49904 20.4919C5.77226 19.4557 4.37848 17.8555 3.62143 15.8584M15.6799 12.1942C15.6799 13.9201 14.2808 15.3192 12.5549 15.3192C10.829 15.3192 9.42993 13.9201 9.42993 12.1942C9.42993 10.4683 10.829 9.06917 12.5549 9.06917C14.2808 9.06917 15.6799 10.4683 15.6799 12.1942Z',
        subheading: <>Secure your data properly.</>,
        className: '!border-l-0',
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
        id: 'realtime',
        title: 'Realtime',
        icon: MainProducts[PRODUCT_SHORTNAMES.REALTIME].icon,
        subheading: (
          <>
            Postgres replication enables <span className="text-foreground">live sync</span> for
            collaborative applications.
          </>
        ),
        className: '!border-l-0 sm:!border-l',
        image: (
          <RealtimeVisual className="[&_.visual-overlay]:bg-[linear-gradient(to_top,transparent_0%,transparent_50%,hsl(var(--background-default))_75%)]" />
        ),
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
            Serverless functions <span className="text-foreground">powered by Deno</span>, deployed
            globally for low-latency execution.
          </>
        ),
        className: '!border-l-0 sm:!border-l lg:!border-l-0',
        image: <FunctionsVisual />,
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
        id: 'row-level-security',
        title: 'Row Level Security',
        icon: '',
        subheading: (
          <>
            <span className="text-foreground">Granular access control policies</span> to secure data
            at the row level.
          </>
        ),
        image: (
          <Image
            draggable={false}
            src={{
              dark: '/images/solutions/neon/rls-dark.svg',
              light: '/images/solutions/neon/rls-light.svg',
            }}
            alt="Row Level Security"
            width={100}
            height={100}
            quality={100}
            containerClassName="-mt-8 sm:mt-0 mb-8"
          />
        ),
      },
    ],
  },
  developerExperience: {
    id: 'developer-experience',
    className: '[&_h2]:!max-w-sm',
    title: (
      <>
        <span className="text-foreground">Build faster</span> with Supabase
      </>
    ),
    subheading: 'Features that help agencies move quickly and deliver more projects profitably.',
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
                Issue: We have detected that you have enabled the email provider with an expiry time
                of more than an hour. It is recommended to set this value to less th...
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
            Connect your <span className="text-foreground">favorite AI tools</span>—Cursor,
            Windsurf, Claude, and more—directly with Supabase.
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
            <span className="text-foreground">Learn SQL when you’re ready.</span> In the meantime,
            Supabase generates automatic APIs so your teams can stay focused on UX.
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
        icon: 'M10.2805 18.2121C11.2419 18.6711 12.3325 18.8932 13.4711 18.8084C15.2257 18.6776 16.7596 17.843 17.8169 16.6015M8.21496 8.36469C9.27117 7.14237 10.7928 6.322 12.5311 6.19248C13.7196 6.10392 14.8558 6.34979 15.8474 6.85054M21.7152 12.8129C21.7152 11.4644 21.4115 10.1867 20.8688 9.0447M12.925 21.6032C14.2829 21.6032 15.5689 21.2952 16.717 20.7454M16.717 20.7454C17.2587 21.5257 18.1612 22.0366 19.1831 22.0366C20.84 22.0366 22.1831 20.6935 22.1831 19.0366C22.1831 17.3798 20.84 16.0366 19.1831 16.0366C17.5263 16.0366 16.1831 17.3798 16.1831 19.0366C16.1831 19.6716 16.3804 20.2605 16.717 20.7454ZM4.96506 16.5471C4.16552 17.086 3.63965 17.9999 3.63965 19.0366C3.63965 20.6935 4.98279 22.0366 6.63965 22.0366C8.2965 22.0366 9.63965 20.6935 9.63965 19.0366C9.63965 17.3798 8.2965 16.0366 6.63965 16.0366C6.01951 16.0366 5.44333 16.2248 4.96506 16.5471ZM9.12614 4.88371C8.58687 4.08666 7.67444 3.56274 6.63965 3.56274C4.98279 3.56274 3.63965 4.90589 3.63965 6.56274C3.63965 8.2196 4.98279 9.56274 6.63965 9.56274C8.2965 9.56274 9.63965 8.2196 9.63965 6.56274C9.63965 5.94069 9.45032 5.36285 9.12614 4.88371ZM20.8688 9.0447C21.6621 8.50486 22.1831 7.59464 22.1831 6.56274C22.1831 4.90589 20.84 3.56274 19.1831 3.56274C17.5263 3.56274 16.1831 4.90589 16.1831 6.56274C16.1831 8.2196 17.5263 9.56274 19.1831 9.56274C19.8081 9.56274 20.3884 9.37165 20.8688 9.0447Z',
        subheading: (
          <>
            Connect Supabase to <span className="text-foreground">BigQuery, Snowflake, ClickHouse</span>{' '}
            and external APIs for seamless integrations with your clients’ existing systems.
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
      'Supabase ensures optimal database performance at any scale, so you can confidently promise your clients reliable, fast applications without worrying about infrastructure limitations.',
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
  securitySection: {
    id: 'security',
    label: 'Security',
    heading: 'Trusted for medical records, missions to the moon, and everything in between',
    subheading:
      'Support a full range of potential clients. Supabase offers enterprise-grade security with SOC 2, HIPAA, and GDPR compliance. Client data is encrypted at rest and in transit, with built-in tools for monitoring and managing security threats.',
    features: [
      { icon: ShieldCheck, heading: 'SOC 2 Type II certified' },
      { icon: HeartPulse, heading: 'HIPAA compliant' },
      { icon: ShieldAlert, heading: 'DDoS Protection' },
      { icon: Lock, heading: 'Multi-factor Authentication' },
      { icon: ClipboardCheck, heading: 'Vulnerability Management' },
      { icon: Users, heading: 'Role-based access control' },
      { icon: List, heading: 'Database Audit Logs' },
      { icon: Lightbulb, heading: 'Security Advisors' },
      { icon: FolderLock, heading: 'Encrypted Storage' },
      { icon: UserX, heading: 'Network restrictions' },
    ],
    cta: {
      label: 'Learn about security',
      url: '/security',
    },
  },
  partnerships: {
    id: 'partnerships',
    label: 'Partnerships',
    heading: (
      <>
        Integrate with a vibrant
        <br /> partner ecosystem
      </>
    ),
    subheading:
      'Supabase integrates with a vibrant partner ecosystem, allowing your agency to assemble best-in-class solutions for every client.',
    features: [
      {
        icon: Sparkles,
        heading: 'Accelerate development with AI builders',
        subheading:
          'Turn visual prototypes into production-ready applications by connecting front-end tools like Lovable and Bolt to a real Supabase, open-source Postgres backend.',
      },
      {
        icon: Lightbulb,
        heading: 'Speed up coding with intelligent IDEs',
        subheading:
          'Our MCP server integrates with AI code editors, giving them deep context of your database schema to help developers manage your backend directly from your IDE.',
      },
      {
        icon: ArrowLeftRight,
        heading: 'Connect to any data source',
        subheading:
          "Foreign Data Wrappers link Supabase to your clients' existing data sources, allowing you to build applications that integrate seamlessly with their current infrastructure.",
      },
    ],
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
        {frameworks.map((framework: FrameworkLinkProps) => (
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
3. Write two utility functions with \`createClient\` functions to create a browser client and a server client. 
4. Hook up middleware to refresh auth tokens
`,
        language: 'markdown',
        docsUrl: 'https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth',
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

export default data
