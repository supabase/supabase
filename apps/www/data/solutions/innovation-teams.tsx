import { CubeIcon } from '@heroicons/react/outline'
import { useBreakpoint } from 'common'
import type { SecuritySectionProps } from 'components/Enterprise/Security'
import { frameworks } from 'components/Hero/HeroFrameworks'
import RealtimeLogs from 'components/Products/Functions/RealtimeLogs'
import type { DXSectionProps } from 'components/Solutions/DeveloperExperienceSection'
import type { FeatureGridProps } from 'components/Solutions/FeatureGrid'
import type { MPCSectionProps } from 'components/Solutions/MPCSection'
import type { PlatformSectionProps } from 'components/Solutions/PlatformSection'
import type { ResultsSectionProps } from 'components/Solutions/ResultsSection'
import { companyStats } from 'data/company-stats'
import { useSendTelemetryEvent } from 'lib/telemetry'
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
  UserX,
  Users,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { PRODUCT_SHORTNAMES } from 'shared-data/products'
import { Image } from 'ui'

import MainProducts from '../MainProducts'
import {
  type FeaturesSection,
  FrameworkLink,
  type FrameworkLinkProps,
  type HeroSection,
  type Metadata,
  getEditors,
} from './solutions.utils'
import { TwoColumnsSectionProps } from '~/components/Solutions/TwoColumnsSection'

const AuthVisual = dynamic(() => import('components/Products/AuthVisual'))
const FunctionsVisual = dynamic(() => import('components/Products/FunctionsVisual'))
const RealtimeVisual = dynamic(() => import('components/Products/RealtimeVisual'))

interface Quote {
  text: string
  author: string
  role: string
  logo?: string | JSX.Element
  link?: string
  avatar?: string | JSX.Element
}

interface AIBuilderEcosystemSection {
  id: string
  heading: React.ReactNode
  subheading: string
  builders: Array<{
    name: string
    description: string
  }>
}

interface CustomerEvidenceSection {
  id: string
  heading: React.ReactNode
  customers: Array<{
    name: string
    highlights: string[]
    cta?: {
      label: string
      href: string
    }
  }>
}

interface InnovationEnablementSection {
  id: string
  heading: React.ReactNode
  options: Array<{
    title: string
    type: string
    description: string
    cta: {
      label: string
      href: string
    }
  }>
}

const data: () => {
  metadata: Metadata
  heroSection: HeroSection
  quote: Quote
  secondaryQuote?: Quote
  aiBuilderEcosystem: AIBuilderEcosystemSection
  why: FeaturesSection
  customerEvidence: CustomerEvidenceSection
  platform: PlatformSectionProps
  developerExperience: DXSectionProps
  innovationEnablement: InnovationEnablementSection
  platformStarterSection: TwoColumnsSectionProps
  mcp: MPCSectionProps
} = () => {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const isXs = useBreakpoint(640)
  const editors = getEditors(isXs)

  return {
    metadata: {
      metaTitle: 'The Production Backend for AI-Built Applications | Supabase',
      metaDescription:
        "Supabase powers every major AI builder. Your prototypes deserve enterprise infrastructure that passes security reviews, scales with success, and doesn't blow up budgets.",
    },
    heroSection: {
      id: 'hero',
      title:
        'Supabase powers every major AI builder. Your prototypes deserve enterprise infrastructure.',
      h1: (
        <>
          <span className="block text-foreground">
            The Production Backend for AI-Built Applications
          </span>
        </>
      ),
      subheader: [
        <>
          Your teams are already building with Lovable, Bolt, v0, and Claude. But prototypes aren't
          enough. You need production-ready infrastructure that passes security reviews, scales with
          success, and doesn't blow up budgets.
        </>,
      ],
      image: undefined,
      ctas: [
        {
          label: 'Start Building',
          href: 'https://supabase.com/dashboard',
          type: 'primary' as any,
          onClick: () =>
            sendTelemetryEvent({
              action: 'start_project_button_clicked',
              properties: { buttonLocation: 'Solutions: Innovation Teams page hero' },
            }),
        },
        {
          label: 'Request a Demo',
          href: 'https://supabase.com/contact/sales',
          type: 'default' as any,
          onClick: () =>
            sendTelemetryEvent({
              action: 'request_demo_button_clicked',
              properties: { buttonLocation: 'Solutions: Innovation Teams page hero' },
            }),
        },
      ],
    },
    quote: {
      text: 'We saved over a million dollars eliminating Meta Workplace. Another million replacing our vendor websites. Now our non-technical teams build production apps themselves. Supabase and Lovable made this possible.',
      author: 'Seth',
      role: 'Chief Innovation Officer',
      logo: (
        <svg
          className="w-24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          id="Logo"
          viewBox="0 0 277.397 144"
        >
          <path d="M20.991 69.484q1.05 9.443 7.345 14.693a23 23 0 0 0 15.22 5.248 25.05 25.05 0 0 0 13.207-3.238 36.6 36.6 0 0 0 9.358-8.133l15.043 11.371a42.6 42.6 0 0 1-16.442 12.943 48.5 48.5 0 0 1-19.067 3.849 50.4 50.4 0 0 1-17.844-3.149 42.8 42.8 0 0 1-14.518-8.922 42.3 42.3 0 0 1-9.708-13.9A44.4 44.4 0 0 1 0 62.136a44.4 44.4 0 0 1 3.585-18.105 42.3 42.3 0 0 1 9.708-13.907A42.8 42.8 0 0 1 27.811 21.2a50.4 50.4 0 0 1 17.844-3.149 40.8 40.8 0 0 1 16 3.061 34.3 34.3 0 0 1 12.425 8.837 40.9 40.9 0 0 1 8.045 14.257 60.5 60.5 0 0 1 2.888 19.5v5.773Zm43.031-15.745q-.176-9.447-5.773-14.693T42.681 33.8q-9.447 0-14.956 5.423t-6.734 14.516ZM186.786 20.155h19.943v12.593h.35a26.24 26.24 0 0 1 12.244-11.282 40.5 40.5 0 0 1 16.617-3.411 42.3 42.3 0 0 1 17.317 3.411 38.8 38.8 0 0 1 13.12 9.358 40.1 40.1 0 0 1 8.223 13.993 52.4 52.4 0 0 1 2.8 17.319 49.6 49.6 0 0 1-2.974 17.317 43 43 0 0 1-8.309 13.993 38.3 38.3 0 0 1-12.857 9.361 39.4 39.4 0 0 1-16.442 3.41 40.8 40.8 0 0 1-10.408-1.225 35.7 35.7 0 0 1-8.134-3.149 32 32 0 0 1-5.948-4.11 29.8 29.8 0 0 1-4.024-4.287h-.524V144h-20.994Zm69.62 41.981a27.3 27.3 0 0 0-1.661-9.445 23.8 23.8 0 0 0-4.9-8.049 24.815 24.815 0 0 0-36.209 0 23.7 23.7 0 0 0-4.9 8.049 27.68 27.68 0 0 0 0 18.89 23.6 23.6 0 0 0 4.9 8.047 24.81 24.81 0 0 0 36.209 0 23.7 23.7 0 0 0 4.9-8.047 27.3 27.3 0 0 0 1.661-9.445"></path>
          <path d="m144.25 62.13 32.023 41.984h-25.536l-19.279-25.263-19.233 25.263H86.688L166.086 0h25.538zM112.238 20.154h-25.54l25.839 33.92 12.756-16.765zM19.4 119.838a.61.61 0 0 1 .612-.612h9.2a6.97 6.97 0 0 1 7.017 6.919 7.1 7.1 0 0 1-4.763 6.5l4.408 8.174a.609.609 0 0 1-.547.933h-3.38a.55.55 0 0 1-.515-.289l-4.279-8.528h-3.572v8.206a.633.633 0 0 1-.612.611h-2.96a.61.61 0 0 1-.612-.611Zm9.46 9.654a3.277 3.277 0 0 0 3.185-3.283 3.2 3.2 0 0 0-3.185-3.121h-5.247v6.4ZM49.834 119.838a.61.61 0 0 1 .612-.612h13.1a.61.61 0 0 1 .61.612v2.638a.61.61 0 0 1-.61.612h-9.528v5.277h7.948a.633.633 0 0 1 .61.612v2.671a.61.61 0 0 1-.61.611h-7.948v5.632h9.525a.61.61 0 0 1 .61.611v2.639a.61.61 0 0 1-.61.611h-13.1a.61.61 0 0 1-.612-.611ZM72.9 140.916l10.01-21.657a.575.575 0 0 1 .546-.355h.322a.55.55 0 0 1 .547.355l9.911 21.657a.567.567 0 0 1-.547.836h-2.8a.925.925 0 0 1-.934-.643l-1.578-3.476h-9.619l-1.576 3.476a.97.97 0 0 1-.932.643h-2.8a.568.568 0 0 1-.55-.836m13.9-6.855-3.218-7.08h-.1l-3.153 7.08ZM103.6 119.838a.61.61 0 0 1 .61-.612h2.962a.633.633 0 0 1 .61.612v18.053h8.206a.61.61 0 0 1 .612.611v2.639a.61.61 0 0 1-.612.611h-11.779a.61.61 0 0 1-.61-.611ZM130.594 123.088h-4.923a.61.61 0 0 1-.612-.612v-2.638a.61.61 0 0 1 .612-.612h14.061a.61.61 0 0 1 .612.612v2.638a.61.61 0 0 1-.612.612h-4.923v18.053a.633.633 0 0 1-.612.611H131.2a.63.63 0 0 1-.61-.611ZM158.072 130.908l-7.337-10.748a.6.6 0 0 1 .513-.934h3.282a.64.64 0 0 1 .517.29l5.148 7.4 5.148-7.4a.64.64 0 0 1 .515-.29h3.314a.6.6 0 0 1 .517.934l-7.434 10.715v10.266a.633.633 0 0 1-.612.611h-2.96a.61.61 0 0 1-.611-.611ZM276.541 3.21a6.25 6.25 0 0 0-2.365-2.351 6.66 6.66 0 0 0-6.541 0 6.24 6.24 0 0 0-2.37 2.351 6.54 6.54 0 0 0-.023 6.427 6.33 6.33 0 0 0 2.347 2.376 6.6 6.6 0 0 0 6.647-.008 6.3 6.3 0 0 0 2.337-2.386 6.53 6.53 0 0 0-.032-6.409m-.367 3.226a5.25 5.25 0 0 1-.7 2.653 5.16 5.16 0 0 1-1.92 1.918 5.35 5.35 0 0 1-5.286.013 5.15 5.15 0 0 1-1.925-1.92 5.33 5.33 0 0 1 0-5.308 5.1 5.1 0 0 1 1.929-1.909 5.4 5.4 0 0 1 5.29.008 5.1 5.1 0 0 1 1.92 1.905 5.2 5.2 0 0 1 .692 2.64"></path>
          <path d="M273.341 6.217a2 2 0 0 0 .314-1.157 1.82 1.82 0 0 0-.68-1.513 3.06 3.06 0 0 0-1.932-.535h-2.625V9.79h1.455V7.309h1.161l1.325 2.481h1.563v-.065l-1.529-2.77a2.1 2.1 0 0 0 .948-.738M271.9 5.91a1.24 1.24 0 0 1-.85.267h-1.175V4.143h1.17a1.22 1.22 0 0 1 .872.275 1 1 0 0 1 .284.754.94.94 0 0 1-.301.738"></path>
        </svg>
      ),
      link: '/customers/exprealty',
      avatar: (
        <Image
          draggable={false}
          src="/images/blog/avatars/seth-siegler.jpg"
          alt="Seth Siegler"
          className="object-cover"
          width={32}
          height={32}
        />
      ),
    },
    aiBuilderEcosystem: {
      id: 'ai-builder-ecosystem',
      heading: (
        <>
          Your AI Tools <span className="text-foreground">Already Choose Supabase</span>
        </>
      ),
      subheading:
        'Every major AI builder integrates with Supabase by default. One backend, infinite possibilities:',
      builders: [
        {
          name: 'Lovable & Bolt',
          description: 'Full-stack applications in minutes',
        },
        {
          name: 'Vercel v0',
          description: 'Component to production pipeline',
        },
        {
          name: 'Claude & Cursor',
          description: 'AI-powered local development',
        },
        {
          name: 'Figma',
          description: 'Design to database in hours',
        },
      ],
    },
    why: {
      id: 'why-supabase',
      label: '',
      heading: (
        <>
          Why Enterprises Choose Supabase for{' '}
          <span className="text-foreground">AI Development</span>
        </>
      ),
      subheading:
        'You want to validate your ideas quickly without having to build a complete backend infrastructure from scratch. At the same time, you want to be able to use the Postgres database you’re familiar with and connect to resources in your organization. Supabase is the complete Postgres developer platform of choice for innovations teams everywhere.',
      features: [
        {
          id: 'easy-to-use',
          icon: Timer,
          heading: 'Launch ideas faster',
          subheading:
            'Empower your citizen developers to build functional prototypes in days, not months. Supabase provides a complete backend with auto-generated APIs, removing the dependency on internal engineering resources.',
        },
        {
          id: 'development-platform',
          icon: CubeIcon,
          heading: 'Integrate with your enterprise stack',
          subheading:
            'Build on a platform designed for enterprise security and integration. Supabase is "just Postgres," offering SOC 2 and HIPAA compliance, while partner integrations ensure new projects connect seamlessly to your existing systems.',
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
          heading: 'Scale with confidence',
          subheading:
            'Go from prototype to production on a single platform. Applications built on Supabase are ready to handle enterprise-level workloads, with features like read replicas and high-availability architecture ensuring performance and reliability as you scale.',
        },
      ],
    },
    customerEvidence: {
      id: 'customer-evidence',
      heading: (
        <>
          Real Results From <span className="text-foreground">Real Enterprises</span>
        </>
      ),
      customers: [
        {
          name: 'eXp Realty',
          logo: '/images/customers/logos/exprealty.svg',
          highlights: [
            'Saved $3M+ annually across multiple systems',
            '70+ vibe-coded applications in production',
            'Non-technical real estate agents building customer-facing apps',
            'Moved entire international division off legacy systems',
          ],
          cta: {
            label: 'Read the case study',
            href: '/customers/exprealty',
          },
        },
        {
          name: 'Accenture Innovation Labs',
          logo: '/images/customers/logos/accenture.svg',
          highlights: [
            'Prototype-to-production in hours, not months',
            'Avoiding AWS complexity and auto-shutdown policies',
            'Engineers and non-technical consultants collaborating seamlessly',
          ],
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
          id: 'row-level-security',
          title: 'Row Level Security',
          icon: '',
          subheading: (
            <>
              <span className="text-foreground">Granular access control policies</span> to secure
              data at the row level.
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
      className: '[&_h2]:!max-w-lg',
      title: (
        <>
          Built for How <span className="text-foreground">AI Builders</span> Work
        </>
      ),
      subheading: '',
      features: [
        {
          id: 'mcp-server',
          title: 'MCP Server Integration',
          icon: 'M19 5L22 2M2 22L5 19M7.5 13.5L10 11M10.5 16.5L13 14M6.3 20.3C6.52297 20.5237 6.78791 20.7013 7.07963 20.8224C7.37136 20.9435 7.68413 21.0059 8 21.0059C8.31587 21.0059 8.62864 20.9435 8.92036 20.8224C9.21209 20.7013 9.47703 20.5237 9.7 20.3L12 18L6 12L3.7 14.3C3.47626 14.523 3.29873 14.7879 3.17759 15.0796C3.05646 15.3714 2.99411 15.6841 2.99411 16C2.99411 16.3159 3.05646 16.6286 3.17759 16.9204C3.29873 17.2121 3.47626 17.477 3.7 17.7L6.3 20.3ZM12 6L18 12L20.3 9.7C20.5237 9.47703 20.7013 9.21209 20.8224 8.92036C20.9435 8.62864 21.0059 8.31587 21.0059 8C21.0059 7.68413 20.9435 7.37136 20.8224 7.07963C20.7013 6.78791 20.5237 6.52297 20.3 6.3L17.7 3.7C17.477 3.47626 17.2121 3.29873 16.9204 3.17759C16.6286 3.05646 16.3159 2.99411 16 2.99411C15.6841 2.99411 15.3714 3.05646 15.0796 3.17759C14.7879 3.29873 14.523 3.47626 14.3 3.7L12 6Z',
          subheading: (
            <>
              Your AI editor understands your entire database schema.{' '}
              <span className="text-foreground">
                Claude and Cursor can manage migrations, write Edge Functions, and implement RLS
                policies
              </span>
              —no context switching.
            </>
          ),
          image: (
            <Image
              draggable={false}
              src={{
                dark: '/images/solutions/neon/mcp-server-dark.svg',
                light: '/images/solutions/neon/mcp-server-light.svg',
              }}
              alt="MCP Server Integration"
              width={100}
              height={100}
              quality={100}
            />
          ),
        },
        {
          id: 'instant-apis',
          title: 'Instant APIs from Your Schema',
          icon: 'M4.13477 12.8129C4.13477 14.1481 4.43245 15.4138 4.96506 16.5471M12.925 4.02271C11.5644 4.02271 10.276 4.33184 9.12614 4.88371M21.7152 12.8129C21.7152 11.4644 21.4115 10.1867 20.8688 9.0447M12.925 21.6032C14.2829 21.6032 15.5689 21.2952 16.717 20.7454M16.717 20.7454C17.2587 21.5257 18.1612 22.0366 19.1831 22.0366C20.84 22.0366 22.1831 20.6935 22.1831 19.0366C22.1831 17.3798 20.84 16.0366 19.1831 16.0366C17.5263 16.0366 16.1831 17.3798 16.1831 19.0366C16.1831 19.6716 16.3804 20.2605 16.717 20.7454ZM4.96506 16.5471C4.16552 17.086 3.63965 17.9999 3.63965 19.0366C3.63965 20.6935 4.98279 22.0366 6.63965 22.0366C8.2965 22.0366 9.63965 20.6935 9.63965 19.0366C9.63965 17.3798 8.2965 16.0366 6.63965 16.0366C6.01951 16.0366 5.44333 16.2248 4.96506 16.5471ZM9.12614 4.88371C8.58687 4.08666 7.67444 3.56274 6.63965 3.56274C4.98279 3.56274 3.63965 4.90589 3.63965 6.56274C3.63965 8.2196 4.98279 9.56274 6.63965 9.56274C8.2965 9.56274 9.63965 8.2196 9.63965 6.56274C9.63965 5.94069 9.45032 5.36285 9.12614 4.88371ZM20.8688 9.0447C21.6621 8.50486 22.1831 7.59464 22.1831 6.56274C22.1831 4.90589 20.84 3.56274 19.1831 3.56274C17.5263 3.56274 16.1831 4.90589 16.1831 6.56274C16.1831 8.2196 17.5263 9.56274 19.1831 9.56274C19.8081 9.56274 20.3884 9.37165 20.8688 9.0447Z',
          subheading: (
            <>
              AI builders need endpoints immediately.{' '}
              <span className="text-foreground">
                Every table gets REST and GraphQL APIs automatically
              </span>
              . Your prompts become production APIs.
            </>
          ),
          image: (
            <Image
              draggable={false}
              src={{
                dark: '/images/solutions/neon/auto-generated-apis-dark.png',
                light: '/images/solutions/neon/auto-generated-apis-light.png',
              }}
              alt="Instant APIs"
              width={100}
              height={100}
              quality={100}
            />
          ),
        },
        {
          id: 'dev-pipeline',
          title: 'Development → Staging → Production Pipeline',
          icon: 'M12.5 1.5625C6.45939 1.5625 1.5625 6.45939 1.5625 12.5C1.5625 18.5406 6.45939 23.4375 12.5 23.4375C18.5406 23.4375 23.4375 18.5406 23.4375 12.5C23.4375 9.90692 22.5351 7.52461 21.0273 5.64995L11.6145 15.0627L9.61957 13.0677M12.6068 5.82237C8.92939 5.82237 5.94826 8.80351 5.94826 12.4809C5.94826 16.1583 8.92939 19.1395 12.6068 19.1395C16.2842 19.1395 19.2654 16.1583 19.2654 12.4809C19.2654 11.1095 18.8507 9.83483 18.14 8.77557',
          subheading: (
            <>
              Start with free prototypes, graduate to production.{' '}
              <span className="text-foreground">
                One git push promotes everything: schema, functions, and security rules
              </span>
              .
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
    innovationEnablement: {
      id: 'innovation-enablement',
      heading: (
        <>
          From Prototype to Production: <br />{' '}
          <span className="text-foreground">The Innovation Playbook</span>
        </>
      ),
      options: [
        {
          title: 'Prototype Today',
          type: 'Self-Serve',
          description: 'Start free with any AI builder + Supabase',
          cta: {
            label: 'Create Your First App in 5 Minutes',
            href: 'https://supabase.com/dashboard',
          },
        },
        {
          title: 'Innovation Sprint',
          type: 'Guided',
          description: '1-day hackathon for your team. Build 3 production-ready prototypes.',
          cta: {
            label: 'Contact our Growth Team',
            href: '/contact/sales',
          },
        },
        {
          title: 'Enterprise Pilot',
          type: 'Full Support',
          description: '30-day program with dedicated success team',
          cta: {
            label: 'Talk to Sales',
            href: '/contact/sales',
          },
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
    support: {
      id: 'support',
      label: 'Support',
      heading: (
        <>
          Get expert help,
          <br /> whenever you need it
        </>
      ),
      features: [
        {
          icon: Globe2,
          heading: 'Global Support, 24/7',
          subheading:
            'Our team has 100% global coverage. No matter where you are, we’re always available to resolve issues and keep your operations running smoothly.',
        },
        {
          icon: Users,
          heading: 'Dedicated team of experts',
          subheading:
            'Get direct access to talented engineers. From onboarding to optimizations, our expert team is here to provide personalized, hands-on support whenever you need it.',
        },
        {
          icon: ArrowLeftRight,
          heading: 'Migration & Success Support',
          subheading:
            'Our team ensures a smooth transition to Supabase while guiding you with best practices for scaling. We’re dedicated to your long-term success, every step of the way.',
        },
      ],
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
      description:
        'Supabase integrates with a vibrant partner ecosystem, allowing your innovation teams to assemble a best-in-class solution.',
      features: [
        {
          icon: Sparkles,
          heading: 'Turn prototypes into products with AI builders',
          subheading:
            'Turn visual prototypes into secure, production ready applications, by connecting front-end tools like Lovable and Bolt to a real Supabase, open-source Postgres backend.',
        },
        {
          icon: Lightbulb,
          heading: 'Accelerate coding with intelligent IDEs',
          subheading:
            'Our MCP server integrates with AI code editors, giving them deep context of your database schema to help developers manage your backend directly from your IDE.',
        },
        {
          icon: ArrowLeftRight,
          heading: 'Connect securely to your existing enterprise data',
          subheading:
            "Ensure prototypes don't live in siloes. Foreign Data Wrappers link Supabase to your data sources, allowing teams to build securely with live data, ensuring integration down the line.",
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
