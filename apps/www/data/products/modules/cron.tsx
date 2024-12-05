// import Image from 'next/image'
import { PRODUCT_MODULES } from 'shared-data/products'
import BrowserFrame from '~/components/BrowserFrame'
import { Image } from 'ui'

export default () => ({
  metaTitle: 'Supabase Cron | Schedule Recurring Jobs in Postgres',
  metaDescription:
    'Supabase Cron is a Postgres Module that uses the pg_cron database extension to manage recurring tasks. Manage your Cron Jobs using any Postgres tooling.',
  metaImage: '/images/modules/cron/og.png',
  url: 'https://supabase.com/dashboard/project/_/integrations/cron-jobs/overview',
  docsUrl: '/docs/guides/cron',
  heroSection: {
    title: 'Supabase Cron',
    h1: <>Schedule and Recurring Jobs in Postgres</>,
    subheader: (
      <>
        Supabase Cron is a Postgres Module that uses the pg_cron database extension to manage
        recurring Jobs. Manage your Cron Jobs using any Postgres tooling.
      </>
    ),
    icon: PRODUCT_MODULES['cron'].icon[24],
    cta: {
      label: 'Schedule your first Job',
      link: 'https://supabase.com/dashboard/project/_/integrations/cron-jobs/overview',
    },
    secondaryCta: {
      label: 'Explore documentation',
      link: '/docs/guides/cron',
    },
  },
  highlightsSection: {
    className: '!py-4 [&_.highlights-grid]:xl:grid-cols-3',
    highlights: [
      {
        title: 'Postgres Native',
        paragraph: 'Schedule and run Jobs directly within your database.',
        svg: (
          <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M11.5466 3.23108C11.2704 3.23108 11.0466 3.45494 11.0466 3.73108C11.0466 4.00722 11.2704 4.23108 11.5466 4.23108V3.23108ZM20.6569 19.5046C20.6569 19.2285 20.433 19.0046 20.1569 19.0046C19.8808 19.0046 19.6569 19.2285 19.6569 19.5046H20.6569ZM19.6569 15.9656C19.6569 16.2417 19.8808 16.4656 20.1569 16.4656C20.433 16.4656 20.6569 16.2417 20.6569 15.9656H19.6569ZM13.0119 19.5536C12.959 19.2826 12.6964 19.1058 12.4254 19.1586C12.1544 19.2115 11.9775 19.4741 12.0304 19.7452L13.0119 19.5536ZM9.87381 18.8565L9.37381 18.8565V18.8565H9.87381ZM4.20721 5.29932L3.73784 5.12699L3.73784 5.127L4.20721 5.29932ZM2.52527 9.88046L2.0559 9.70814L2.0559 9.70814L2.52527 9.88046ZM3.24922 12.6873L2.92176 13.0651L2.92176 13.0651L3.24922 12.6873ZM4.40334 13.6875L4.07588 14.0653L4.07588 14.0653L4.40334 13.6875ZM5.00971 15.0154L4.50971 15.0154L4.50971 15.0154L5.00971 15.0154ZM5.00969 16.8536L5.50969 16.8536L5.50969 16.8536L5.00969 16.8536ZM9.87385 10.6661L9.37385 10.6661L9.37385 10.6661L9.87385 10.6661ZM11.9399 6.90783C12.136 6.71339 12.1373 6.39681 11.9429 6.20073C11.7484 6.00464 11.4319 6.00331 11.2358 6.19774L11.9399 6.90783ZM17.841 18.7506L17.8409 18.2506L17.8409 18.2506L17.841 18.7506ZM23.0676 19.2506C23.3437 19.2506 23.5676 19.0267 23.5675 18.7506C23.5675 18.4744 23.3437 18.2506 23.0675 18.2506L23.0676 19.2506ZM13.0171 15.2446C12.8955 14.9967 12.5959 14.8943 12.348 15.016C12.1001 15.1376 11.9978 15.4372 12.1194 15.6851L13.0171 15.2446ZM11.5466 4.23108H12.608V3.23108H11.5466V4.23108ZM19.6569 19.5046C19.6569 21.0264 18.2467 22.2606 16.3033 22.2606V23.2606C18.6165 23.2606 20.6569 21.7449 20.6569 19.5046H19.6569ZM12.608 4.23108C16.501 4.23108 19.6569 7.38698 19.6569 11.28H20.6569C20.6569 6.8347 17.0533 3.23108 12.608 3.23108V4.23108ZM19.6569 11.28V15.9656H20.6569V11.28H19.6569ZM16.3033 22.2606C14.6727 22.2606 13.313 21.0964 13.0119 19.5536L12.0304 19.7452C12.4214 21.7485 14.1852 23.2606 16.3033 23.2606V22.2606ZM11.6552 3.22339H6.46459V4.22339H11.6552V3.22339ZM3.73784 5.127L2.0559 9.70814L2.99464 10.0528L4.67658 5.47164L3.73784 5.127ZM2.92176 13.0651L4.07588 14.0653L4.7308 13.3096L3.57668 12.3094L2.92176 13.0651ZM4.50971 15.0154L4.50969 16.8536L5.50969 16.8536L5.50971 15.0154L4.50971 15.0154ZM10.3739 10.6661C10.3739 9.25463 10.9376 7.90166 11.9399 6.90783L11.2358 6.19774C10.0442 7.37934 9.37387 8.98795 9.37385 10.6661L10.3739 10.6661ZM2.0559 9.70814C1.61893 10.8983 1.96363 12.2348 2.92176 13.0651L3.57668 12.3094C2.9326 11.7512 2.70089 10.8529 2.99464 10.0528L2.0559 9.70814ZM8.44319 20.7872C9.50944 20.7872 10.3738 19.9228 10.3738 18.8565H9.37381C9.37381 19.3705 8.95716 19.7872 8.44319 19.7872V20.7872ZM8.44319 19.7872C6.82305 19.7872 5.50967 18.4738 5.50969 16.8536L4.50969 16.8536C4.50966 19.026 6.27075 20.7872 8.44319 20.7872V19.7872ZM4.07588 14.0653C4.35142 14.3041 4.50972 14.6508 4.50971 15.0154L5.50971 15.0154C5.50972 14.3608 5.22552 13.7384 4.7308 13.3096L4.07588 14.0653ZM6.46459 3.22339C5.24643 3.22339 4.15768 3.98347 3.73784 5.12699L4.67658 5.47164C4.95188 4.7218 5.66581 4.22339 6.46459 4.22339V3.22339ZM17.841 19.2506L23.0676 19.2506L23.0675 18.2506L17.8409 18.2506L17.841 19.2506ZM12.1194 15.6851C13.1905 17.8676 15.4098 19.2507 17.841 19.2506L17.8409 18.2506C15.7913 18.2507 13.9201 17.0846 13.0171 15.2446L12.1194 15.6851ZM10.3738 18.8565L10.3739 10.6661L9.37385 10.6661L9.37381 18.8565L10.3738 18.8565Z" />
            <path d="M15.7151 11.2056C15.7151 11.6257 16.0556 11.9663 16.4758 11.9663C16.8959 11.9663 17.2365 11.6257 17.2365 11.2056C17.2365 10.7854 16.8959 10.4448 16.4758 10.4448C16.0556 10.4448 15.7151 10.7854 15.7151 11.2056Z" />
          </svg>
        ),
      },
      {
        title: 'Cron Syntax and Natural Language',
        paragraph: 'Use familiar cron syntax or natural language to define your job run interval.',
        svg: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 6v12" />
            <path d="M17.196 9 6.804 15" />
            <path d="m6.804 9 10.392 6" />
          </svg>
        ),
      },
      {
        title: 'Sub-Minute Scheduling',
        paragraph: 'Schedule recurring Jobs that run every 1-59 seconds.',
        svg: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="10" x2="14" y1="2" y2="2"></line>
            <line x1="12" x2="15" y1="14" y2="11"></line>
            <circle cx="12" cy="14" r="8"></circle>
          </svg>
        ),
      },
      {
        title: 'Real-Time Monitoring',
        paragraph: "Track and debug scheduled Jobs with Supabase's observability tools.",
        svg: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 12h8" />
            <path d="M13 18h8" />
            <path d="M13 6h8" />
            <path d="M3 12h1" />
            <path d="M3 18h1" />
            <path d="M3 6h1" />
            <path d="M8 12h1" />
            <path d="M8 18h1" />
            <path d="M8 6h1" />
          </svg>
        ),
      },
      {
        title: 'Extensible Toolkit',
        paragraph: 'Works with Database Functions, Edge Functions, and HTTP Webhooks.',
        svg: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.44434 12.228C3.44434 13.5631 3.74202 14.8288 4.27463 15.9622M12.2346 3.43774C10.8739 3.43774 9.58552 3.74688 8.43571 4.29875M21.0248 12.228C21.0248 10.8794 20.7211 9.60178 20.1784 8.45974M12.2346 21.0182C13.5925 21.0182 14.8785 20.7103 16.0266 20.1605M16.0266 20.1605C16.5683 20.9408 17.4708 21.4517 18.4927 21.4517C20.1495 21.4517 21.4927 20.1085 21.4927 18.4517C21.4927 16.7948 20.1495 15.4517 18.4927 15.4517C16.8358 15.4517 15.4927 16.7948 15.4927 18.4517C15.4927 19.0867 15.69 19.6756 16.0266 20.1605ZM4.27463 15.9622C3.47509 16.501 2.94922 17.4149 2.94922 18.4517C2.94922 20.1085 4.29236 21.4517 5.94922 21.4517C7.60607 21.4517 8.94922 20.1085 8.94922 18.4517C8.94922 16.7948 7.60607 15.4517 5.94922 15.4517C5.32908 15.4517 4.7529 15.6398 4.27463 15.9622ZM8.43571 4.29875C7.89644 3.5017 6.98401 2.97778 5.94922 2.97778C4.29236 2.97778 2.94922 4.32093 2.94922 5.97778C2.94922 7.63464 4.29236 8.97778 5.94922 8.97778C7.60607 8.97778 8.94922 7.63464 8.94922 5.97778C8.94922 5.35572 8.75989 4.77789 8.43571 4.29875ZM20.1784 8.45974C20.9717 7.9199 21.4927 7.00968 21.4927 5.97778C21.4927 4.32093 20.1495 2.97778 18.4927 2.97778C16.8358 2.97778 15.4927 4.32093 15.4927 5.97778C15.4927 7.63464 16.8358 8.97778 18.4927 8.97778C19.1176 8.97778 19.698 8.78669 20.1784 8.45974Z"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
        ),
      },
      {
        title: '100% Open Source',
        paragraph: 'Built on trusted, community-driven technology.',
        svg: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
        ),
      },
    ],
  },
  videoSection: {
    video: (
      <BrowserFrame
        className="overflow-hidden lg:order-last bg-default w-full max-w-6xl mx-auto"
        contentClassName="aspect-video border overflow-hidden rounded-lg"
        hasFrameButtons={false}
      >
        <div className="video-container !border-none !rounded-none">
          <iframe
            src="https://www.youtube-nocookie.com/embed/miRQPbIJOuQ"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </BrowserFrame>
    ),
  },
  section1: {
    id: 'sql',
    label: 'SQL',
    heading: <>SQL-Based Approach</>,
    subheading:
      'Create and manage Jobs using simple SQL commands for ease of use. Track changes to your recurring Jobs using Postgres migrations stored in source control.',
    cta: {
      label: 'Start scheduling',
      url: 'https://supabase.com/dashboard/project/_/integrations/cron/overview',
    },
    reverse: true,
  },
  section2: {
    id: 'UI-Scheduling-Interface',
    label: 'UI',
    heading: <>Intuitive Scheduling Interface</>,
    subheading:
      'Supabase Cron provides a clean and simple interface, including cron syntax and natural language options, to create Jobs with ease.',
    image: (
      <Image
        src={{
          dark: '/images/modules/cron/cron-ui-dark.png',
          light: '/images/modules/cron/cron-ui-light.png',
        }}
        alt="Cron Jobs UI"
        className="w-full max-w-[490px] aspect-[1/0.88] object-cover bg-cover"
        fill
        sizes="100vw, (min-width: 768px) 50vw, (min-width: 1200px) 33vw"
        quality={100}
        draggable={false}
      />
    ),
    cta: {
      label: 'Start scheduling',
      url: 'https://supabase.com/dashboard/project/_/integrations/cron/overview',
    },
    className: 'md:!py-0',
  },
  section3: {
    id: 'UI-Job-Observability',
    label: 'Cron Logs',
    heading: <>Job Observability</>,
    subheading:
      'Track and investigate recurring Jobs and their historical runs in the Cron UI and Cron logs.',
    image: (
      <Image
        src={{
          dark: '/images/modules/cron/cron-logs-dark.png',
          light: '/images/modules/cron/cron-logs-light.png',
        }}
        alt="Cron Jobs UI"
        className="w-full max-w-[590px] aspect-[1/0.71] object-cover bg-cover"
        fill
        sizes="100vw, (min-width: 768px) 50vw, (min-width: 1200px) 33vw"
        quality={100}
        draggable={false}
      />
    ),
    className: 'md:!pb-0 [&_.image-container]:md:max-w-xl',
    reverse: true,
  },
  section4: {
    id: 'extensible',
    label: 'Extensible',
    heading: <>Designed to Just Work</>,
    subheading:
      'Supabase Cron is integrated with the entire Supabase suite of tools. Create Jobs to call Database Functions, Supabase Edge Functions, and even remote webhooks.',
    image: (
      <Image
        src={{
          dark: '/images/modules/cron/cron-extensible-dark.png',
          light: '/images/modules/cron/cron-extensible-light.png',
        }}
        alt="Cron Jobs UI"
        containerClassName="bg-cover object-cover"
        className="w-full max-w-[490px] aspect-[1/0.99] object-cover bg-cover rounded-lg overflow-hidden"
        fill
        sizes="100vw, (min-width: 768px) 50vw, (min-width: 1200px) 33vw"
        quality={100}
        draggable={false}
      />
    ),
  },
})
