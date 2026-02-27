import { cn, Image } from 'ui'
import dynamic from 'next/dynamic'
import { CubeIcon } from '@heroicons/react/outline'
import {
  ArrowRight,
  ArrowUpRight,
  Timer,
  Lock,
  ShieldCheck,
  Users,
  UserX,
  FolderLock,
  Lightbulb,
  List,
  ClipboardCheck,
  ShieldAlert,
  HeartPulse,
  Check,
  InfoIcon,
} from 'lucide-react'
import RealtimeLogs from 'components/Products/Functions/RealtimeLogs'

import MainProducts from 'data/MainProducts'
import { PRODUCT_SHORTNAMES } from 'shared-data/products'
import { companyStats } from 'data/company-stats'
import { DerivLogo } from '~/components/BrandLogo'

const AuthVisual = dynamic(() => import('components/Products/AuthVisual'))
const FunctionsVisual = dynamic(() => import('components/Products/FunctionsVisual'))
const RealtimeVisual = dynamic(() => import('components/Products/RealtimeVisual'))

const data = {
  metadata: {
    metaTitle: 'Switch from Neon to Supabase',
    metaDescription:
      'The complete Postgres development platform Neon users prefer. Supabase is a composable stack for modern applications: Postgres Database, built-in Auth, Real-time sync, Edge Functions, Storage, and a powerful developer experience.',
  },
  heroSection: {
    id: 'hero',
    title: 'Moving from Neon to Supabase',
    sectionContainerClassName: cn(
      '[&_h1]:text-xl [&_h1]:md:!text-2xl [&_h1]:lg:!text-4xl [&_h1]:2xl:!text-5xl',
      '[&_.image-container]:flex [&_.image-container]:items-center'
    ),
    h1: 'Neon users switch to Supabase for a complete Postgres experience',
    subheader: [
      <>
        Supabase is a composable stack for modern applications: Postgres Database, built-in Auth,
        Real-time sync, Edge Functions, Storage, and a powerful developer experience.
      </>,
      <>
        Supabase is the preferred foundation for high-performance, high-scale SaaS, AI-native apps,
        data-intensive tools, and more.
      </>,
    ],
    ctas: [
      {
        label: 'Start your migration',
        href: 'https://supabase.com/docs/guides/platform/migrating-to-supabase/neon',
        type: 'primary' as any,
        icon: <ArrowUpRight className="w-4 h-4 text-current" />,
      },
    ],
    image: (
      <Image
        draggable={false}
        src={{
          dark: '/images/solutions/neon/neon-hero-dark.svg',
          light: '/images/solutions/neon/neon-hero-light.svg',
        }}
        alt="Neon to Supabase illustration"
        width={1000}
        height={1000}
        className="max-w-[500px] max-h-[400px] m-auto"
      />
    ),
  },
  quote: {
    id: 'quote',
    className: '[&_q]:md:max-w-2xl',
    text: 'We wanted a backend that could accelerate our development while maintaining security and scalability. Supabase stood out due to its automation, integrations, and ecosystem.',
    author: 'Raunak Kathuria',
    role: 'VP of Engineering, Deriv',
    avatar: (
      <Image
        draggable={false}
        src="/images/blog/avatars/raunak-kathuria.jpg"
        alt="Raunak Kathuria"
        className="object-cover"
        width={32}
        height={32}
      />
    ),
    link: '/customers/deriv',
    logo: <DerivLogo className="w-full" />,
  },
  why: {
    id: 'why-supabase',
    label: '',
    heading: (
      <>
        Why companies moved <span className="text-foreground">to Supabase from Neon</span>
      </>
    ),
    subheading:
      'Build secure, scalable applications using a developer platform built for dependability.',
    features: [
      {
        id: 'speed',
        icon: Timer,
        heading: 'Build fast and with confidence',
        subheading:
          'Supabase helps you go from prototype to production with built-in auth, real-time data, and observability. No setup or backend boilerplate required.',
      },
      {
        id: 'platform',
        icon: CubeIcon,
        heading: 'Everything your application stack needs',
        subheading:
          'Auth, storage, edge functions, vectors, and realtime are available out of the box. Use one or all.',
      },
      {
        id: 'scalability',
        icon: 'M13.2689 14.9229C14.04 16.494 15.6379 17.4892 17.3881 17.4893H22.0892C22.4726 17.4893 22.7843 17.8003 22.7845 18.1836C22.7845 18.5671 22.4728 18.8789 22.0892 18.8789H20.1664C20.1564 21.0605 18.171 22.4853 16.0052 22.4854C14.044 22.4854 12.4009 21.1292 11.9603 19.3037L11.9213 19.126L11.9086 18.9854C11.9116 18.6624 12.1408 18.3748 12.4701 18.3105C12.7994 18.2463 13.1203 18.4265 13.2445 18.7246L13.2845 18.8594L13.3412 19.0947C13.6746 20.251 14.742 21.0967 16.0052 21.0967C17.6551 21.0966 18.7655 20.0649 18.7758 18.8789H17.3881C15.108 18.8788 13.0263 17.5811 12.0218 15.5342L13.2689 14.9229ZM18.7767 15.6787V11.4639C18.7766 8.09738 16.0476 5.36816 12.681 5.36816H11.7269C11.7032 5.36816 11.6797 5.36364 11.6566 5.36133H7.15564C6.5783 5.36133 6.05835 5.69927 5.82068 6.21777L5.77673 6.32422L4.26404 10.4443C4.03486 11.0686 4.21563 11.7696 4.71814 12.2051L5.75622 13.1045L5.93298 13.2754C6.32193 13.694 6.54138 14.2468 6.54138 14.8242V16.4775L6.5531 16.7227C6.67574 17.9298 7.69544 18.8721 8.93493 18.8721C9.2213 18.8721 9.45986 18.6685 9.51501 18.3984L9.52771 18.2793V10.9121C9.52772 9.33737 10.1566 7.82755 11.2748 6.71875L11.3842 6.63086C11.6543 6.45411 12.0199 6.48475 12.2562 6.72266C12.5263 6.995 12.5247 7.43503 12.2523 7.70508L12.097 7.86816C11.3396 8.69814 10.9164 9.78304 10.9164 10.9121V18.2793L10.9056 18.4814C10.8044 19.4807 9.96094 20.2607 8.93493 20.2607C6.91113 20.2607 5.25814 18.6714 5.15661 16.6729L5.15173 16.4775V14.8242C5.15173 14.5993 5.06693 14.3838 4.9154 14.2207L4.84607 14.1543L3.80798 13.2549C2.86934 12.4414 2.53223 11.1318 2.96033 9.96582L4.47302 5.84473L4.55798 5.63867C5.02039 4.62971 6.03224 3.97266 7.15564 3.97266H11.8246V3.97949H12.681C16.8146 3.97949 20.1662 7.33032 20.1664 11.4639V15.6787C20.1664 16.0622 19.8546 16.373 19.4711 16.373C19.0877 16.3728 18.7767 16.0621 18.7767 15.6787ZM12.3392 14.6055C12.6835 14.4365 13.1 14.5785 13.2689 14.9229L12.0218 15.5342C11.8532 15.1901 11.9953 14.7745 12.3392 14.6055Z M14.4779 10.7135C14.4779 11.1278 14.8137 11.4635 15.2279 11.4635C15.6421 11.4635 15.9779 11.1278 15.9779 10.7135C15.9779 10.2993 15.6421 9.96354 15.2279 9.96354C14.8137 9.96354 14.4779 10.2993 14.4779 10.7135Z',
        iconNoStroke: true,
        heading: 'Scalable, dependable, Postgres-native',
        subheading:
          'Supabase runs on standard Postgres with full SQL, ACID guarantees, PITR, and high availability. Designed for reliable, stateful agent workloads.',
      },
      {
        id: 'migration',
        icon: ArrowRight,
        heading: 'Migrate from Neon with ease',
        subheading: 'Supabase is Postgres. Moving from Neon is a breeze.',
      },
    ],
  },
  platform: {
    id: 'postgres-platform',
    title: (
      <>
        Supabase is the Postgres platform <span className="text-foreground">you control</span>
      </>
    ),
    subheading: "Supabase includes everything you've come to expect from Neon, and so much more.",
    features: [
      {
        id: 'database',
        title: 'Database',
        isDatabase: true,
        icon: MainProducts[PRODUCT_SHORTNAMES.DATABASE].icon,
        subheading: (
          <>
            A fully managed Postgres database.
            <br /> No forks: 100% pure Postgres.
          </>
        ),
        className: 'lg:col-span-2 flex-col lg:flex-row',
        image: (
          <div className="relative w-full max-w-xl pt-8">
            <div className="w-full h-full rounded-tl-lg overflow-hidden border-t border-l bg-surface-75">
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
            Secure authentication with email/password, magic links, OAuth (Google, GitHub, Twitter,
            etc.), SAML, SSO, and phone/SMS OTP.
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
          <>Serverless functions powered by Deno, deployed globally for low-latency execution.</>
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
            pgvector extension for AI/ML applications, enabling fast semantic search and embedding
            storage.
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
        icon: 'M20.3124 10.9373C21.1753 10.9373 21.8749 11.6369 21.8749 12.4998V12.4998C21.8749 13.3628 21.1753 14.0623 20.3124 14.0623L4.68738 14.0623C3.82443 14.0623 3.12488 13.3628 3.12488 12.4998V12.4998C3.12488 11.6369 3.82443 10.9373 4.68738 10.9373L20.3124 10.9373Z M20.3124 3.90454C21.1753 3.90454 21.8749 4.6041 21.8749 5.46704V5.46704C21.8749 6.32999 21.1753 7.02954 20.3124 7.02954L4.68738 7.02954C3.82443 7.02954 3.12488 6.32998 3.12488 5.46704V5.46704C3.12488 4.6041 3.82443 3.90454 4.68738 3.90454L20.3124 3.90454Z M20.3124 17.9701C21.1753 17.9701 21.8749 18.6696 21.8749 19.5326V19.5326C21.8749 20.3955 21.1753 21.0951 20.3124 21.0951L4.68738 21.0951C3.82443 21.0951 3.12488 20.3955 3.12488 19.5326V19.5326C3.12488 18.6696 3.82443 17.9701 4.68738 17.9701L20.3124 17.9701Z',
        subheading: <>Granular access control policies to secure data at the row level.</>,
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
        Developers can build <span className="text-foreground">faster</span> with Supabase
      </>
    ),
    subheading: 'Features that help developers move quickly and focus.',
    features: [
      {
        id: 'ai-assistant',
        title: 'AI Assistant',
        icon: 'M11.8949 2.39344C12.5051 1.78324 13.4944 1.78324 14.1046 2.39344L22.9106 11.1994C23.5208 11.8096 23.5208 12.7989 22.9106 13.4091L14.1046 22.2151C13.4944 22.8253 12.5051 22.8253 11.8949 22.2151L3.08892 13.4091C2.47872 12.7989 2.47872 11.8096 3.08892 11.1994L11.8949 2.39344Z M16.5408 12.3043C16.5408 14.2597 14.9556 15.8449 13.0002 15.8449C11.0448 15.8449 9.45961 14.2597 9.45961 12.3043C9.45961 10.3489 11.0448 8.76371 13.0002 8.76371C14.9556 8.76371 16.5408 10.3489 16.5408 12.3043Z',
        subheading:
          'A single panel that persists across the Supabase Dashboard and maintains context across AI prompts.',
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
        subheading:
          'Connect your favorite AI tools such as Cursor or Claude directly with Supabase.',
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
        subheading:
          "Learn SQL when you're ready. In the meantime, Supabase generates automatic APIs to make coding a lot easier.",
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
        subheading:
          'Connect Supabase to BigQuery, Snowflake, ClickHouse, S3, Stripe, Firebase, and external APIs for seamless integrations.',
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
        subheading:
          'Built-in logs, query performance tools, and security insights for easy debugging.',
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
            Restore your database <span className="text-foreground">to any point in time</span> for
            disaster recovery.
          </>
        ),
        icon: 'M3.3784 13.3407C3.1413 10.4689 4.12132 7.51558 6.31845 5.31845C10.2847 1.35219 16.7153 1.35219 20.6816 5.31845C24.6478 9.28471 24.6478 15.7153 20.6816 19.6816C16.7153 23.6478 10.2847 23.6478 6.31845 19.6816C5.3819 18.745 4.6665 17.671 4.17224 16.5246M0.706939 11.443L2.28117 13.0172C2.89137 13.6274 3.88069 13.6274 4.49088 13.0172L6.06512 11.443M10.761 17.5453L16.0995 17.5453C16.9625 17.5453 17.662 16.8458 17.662 15.9828V15.7328C17.662 14.8699 16.9625 14.1703 16.0995 14.1703L10.761 14.1703C9.89806 14.1703 9.1985 14.8699 9.1985 15.7328L9.1985 15.9828C9.1985 16.8458 9.89806 17.5453 10.761 17.5453ZM11.1648 14.1711L15.6537 14.1711C16.5167 14.1711 17.2162 13.4716 17.2162 12.6086L17.2162 12.3586C17.2162 11.4956 16.5167 10.7961 15.6537 10.7961L11.1648 10.7961C10.3019 10.7961 9.60234 11.4956 9.60234 12.3586L9.60234 12.6086C9.60234 13.4716 10.3019 14.1711 11.1648 14.1711ZM10.7606 10.7963L16.0991 10.7963C16.9621 10.7963 17.6616 10.0967 17.6616 9.2338V8.98375C17.6616 8.1208 16.9621 7.42125 16.0991 7.42125L10.7606 7.42125C9.89765 7.42125 9.19809 8.12081 9.19809 8.98375L9.19809 9.2338C9.19809 10.0967 9.89765 10.7963 10.7606 10.7963Z',
      },
      {
        id: 'backups',
        title: 'Automatic Backups',
        description: (
          <>
            <span className="text-foreground">Daily backups</span> with retention policies for added
            security.
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
  ctaSection: {
    id: 'get-started',
    title: (
      <>
        Migrate your Neon database to Supabase to{' '}
        <span className="text-foreground">get the most out of Postgres</span> while gaining access
        to all the features you need to build a project
      </>
    ),
    primaryCta: {
      label: 'Open migration guide',
      url: 'https://supabase.com/docs/guides/platform/migrating-to-supabase/neon',
      target: '_blank',
      icon: <ArrowUpRight className="w-4 h-4 text-current" />,
    },
  },
}

export default data
