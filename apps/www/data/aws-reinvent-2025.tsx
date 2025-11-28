import { Calendar, MapPin, Users, Sparkles, Gift, MessageSquare, Timer, Check } from 'lucide-react'
import { CubeIcon } from '@heroicons/react/outline'
import { Image } from 'ui'
import dynamic from 'next/dynamic'
import MainProducts from './MainProducts'
import { PRODUCT_SHORTNAMES } from 'shared-data/products'
import { SITE_ORIGIN } from '~/lib/constants'

const AuthVisual = dynamic(() => import('components/Products/AuthVisual'))
const FunctionsVisual = dynamic(() => import('components/Products/FunctionsVisual'))
const RealtimeVisual = dynamic(() => import('components/Products/RealtimeVisual'))

export type EventScheduleItem = {
  date: string
  time: string
  title: string
  description?: string
  location?: string
  type: 'booth' | 'keynote' | 'networking' | 'giveaway'
  cta?: {
    label: string
    href: string
  }
}

export type HeroSectionProps = {
  id?: string
  title: string
  subtitle?: string
  h1: React.ReactNode
  subheader: React.ReactNode[]
  image?: any
  ctas: Array<{
    label: string
    href: string
    type?:
      | 'primary'
      | 'secondary'
      | 'default'
      | 'alternative'
      | 'outline'
      | 'text'
      | 'link'
      | 'warning'
      | 'danger'
      | 'dashed'
      | null
      | undefined
  }>
}

const data = {
  metadata: {
    metaTitle: 'Supabase at AWS re:Invent 2025 | December 1-4, Las Vegas',
    metaDescription:
      'Meet Supabase at AWS re:Invent 2025. Visit us at Booth #1857, join our exclusive events, and learn how to build in a weekend and scale to millions.',
    ogImage: `${SITE_ORIGIN}/images/og/re_invent.png`,
  },
  heroSection: {
    id: 'hero',
    title: 'Supabase at AWS re:Invent 2025',
    h1: (
      <>
        <span className="block text-foreground lg:text-3xl lg:leading-[1.5]">
          The complete Postgres platform.
        </span>
        <span className="block text-foreground lg:text-3xl lg:leading-[1.5]">On AWS.</span>
      </>
    ),
    subheader: [
      <>
        December 1-4, 2025 — Las Vegas, NV —{' '}
        <span className="text-foreground font-medium">Booth #1857</span>
      </>,
      <>
        Supabase is the open-source Postgres development platform built to run on AWS
        infrastructure. Get a complete backend with Database, Auth, Storage, Edge Functions, and
        Real-Time in minutes. Deploy globally across AWS regions with enterprise-grade security,
        compliance, and the performance AWS customers expect. Use Foreign Data Wrappers to connect
        to your existing AWS data stack.
      </>,
    ],
    ctas: [
      {
        label: 'Book a Meeting',
        href: 'https://forms.supabase.com/reinvent',
        type: 'primary' as const,
      },
      {
        label: 'Visit our Booth (#1857)',
        href: '#schedule',
        type: 'secondary' as const,
      },
    ],
  },
  consultationSection: {
    id: 'consultation',
    title: 'Free enterprise innovation assessment',
    description:
      'Get expert guidance from a Supabase Engineer on how to prototype faster, integrate securely, and scale with confidence.',
    features: [
      'Review of innovation workflow and infrastructure',
      'Guidance on adding AI-native tools to your stack',
      'Advice on how to go from prototype to production',
      'Recommendations on security, compliance, and scale',
      'Best practices from other innovation teams',
    ],
    cta: {
      label: 'Book your assessment',
      href: 'https://forms.supabase.com/reinvent',
    },
  },
  scheduleSection: {
    id: 'schedule',
    title: 'Where to find us at AWS re:Invent',
    subtitle: 'Join us for exclusive events, demos, and networking opportunities',
    schedule: [
      // December 1
      {
        date: 'December 01',
        time: '4:00 PM - 7:00 PM',
        title: 'Welcome to Day 1',
        description:
          'Meet us at Booth #1857. Watch a demo and collect your ticket for our Daily Giveaway.',
        location: 'Expo Hall - Booth #1857',
        type: 'booth',
      },
      // December 2
      {
        date: 'December 02',
        time: '10:00 AM - 6:00 PM',
        title: 'Welcome to Day 2',
        description:
          'Meet us at Booth #1857. Watch a demo and collect your ticket for our Daily Giveaway.',
        location: 'Expo Hall - Booth #1857',
        type: 'booth',
      },
      {
        date: 'December 02',
        time: '1:00 PM - 2:00 PM',
        title: 'AWS Keynote Feature',
        description:
          "Supabase CEO and Founder Paul Copplestone will be a featured guest in Mai-Lan Tomsen Bukovec's keynote.",
        location: 'Venetian, Palazzo Ballroom B',
        type: 'keynote',
      },
      {
        date: 'December 02',
        time: '5:30 PM - 8:30 PM',
        title: 'Exclusive Cocktail Reception',
        description: 'Exclusive cocktail reception brought to you by Supabase and Felicis.',
        location: 'Private Venue',
        type: 'networking',
        cta: {
          label: 'Apply to attend',
          href: 'https://gatsby.events/felicis/rsvp/register?e=aws-re-invent-reset-cocktails-and-conversation-with-supabase-tines-mother-duck-semgrep-felicis&ref=supabase',
        },
      },
      // December 3
      {
        date: 'December 03',
        time: '10:00 AM - 6:00 PM',
        title: 'Welcome to Day 3',
        description:
          'Meet us at Booth #1857. Watch a demo and collect your ticket for our Daily Giveaway.',
        location: 'Expo Hall - Booth #1857',
        type: 'booth',
      },
      {
        date: 'December 03',
        time: '6:30 PM - 9:30 PM',
        title: 'AI After Dark',
        description: 'AI After Dark. Brought to you by Supabase, Vercel, Slack, and Baseten.',
        location: 'Private Venue',
        type: 'networking',
        cta: {
          label: 'Apply to attend',
          href: 'https://luma.com/4nhjbjak?utm_source=supabase',
        },
      },
      // December 4
      {
        date: 'December 04',
        time: '10:00 AM - 6:00 PM',
        title: 'Final Day & Giveaway',
        description:
          'Meet us at Booth #1857. Watch a demo and collect your ticket for our Daily Giveaway.',
        location: 'Expo Hall - Booth #1857',
        type: 'booth',
      },
    ] as EventScheduleItem[],
  },
  platform: {
    id: 'postgres-platform',
    title: (
      <>
        Supabase helps you <span className="text-foreground">build</span>
      </>
    ),
    subheading: 'Supabase includes everything you need to create the winning app.',
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
            Serverless functions <span className="text-foreground">powered by Deno</span>, deployed
            globally for low-latency execution.
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
            <span className="text-foreground">pgvector extension</span> for AI/ML applications,
            enabling fast semantic search and embedding storage.
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
  ctaSection: {
    id: 'cta',
    title: 'Take Supabase for a spin at Booth #1857',
    subtitle:
      'See how the fastest teams build and scale on Supabase. Get a demo, meet our team, and enter our daily giveaway.',
    cta: {
      label: 'Book a meeting',
      href: 'https://forms.supabase.com/reinvent',
    },
  },
}

export default data
