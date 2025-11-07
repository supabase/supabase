import { PRODUCT_MODULES } from 'shared-data/products'
import BrowserFrame from '~/components/BrowserFrame'
import { Image } from 'ui'

export default () => ({
  metaTitle: 'Supabase Queues | Durable Message Queues with Guaranteed Delivery',
  metaDescription:
    'Postgres module that uses the pgmq database extension to manage Message Queues with guaranteed delivery.',
  metaImage: '/images/modules/queues/og.png',
  url: 'https://supabase.com/dashboard/project/_/integrations/queues/overview',
  docsUrl: '/docs/guides/queues',
  heroSection: {
    title: 'Supabase Queues',
    h1: <>Create and Manage Message Queues using Postgres</>,
    subheader: (
      <>
        Supabase Queues is a Postgres module that uses the pgmq database extension to manage Message
        Queues with guaranteed delivery. Manage your Queues using any Postgres tooling.
      </>
    ),
    icon: PRODUCT_MODULES.queues.icon[24],
    cta: {
      label: 'Create your first Queue',
      link: 'https://supabase.com/dashboard/project/_/integrations/queues/overview',
    },
    secondaryCta: {
      label: 'Explore documentation',
      link: '/docs/guides/queues',
    },
    className: '[&_h1]:max-w-2xl',
  },
  highlightsSection: {
    className: `
        !py-4
        [&_.highlights-grid]:sm:grid-cols-2
        [&_.highlight-card]:sm:col-span-1
        [&_.highlight-card:nth-child(1)]:sm:col-span-2
        [&_.highlights-grid]:lg:grid-cols-6
        [&_.highlight-card]:lg:col-span-2
        [&_.highlight-card:nth-child(1)]:lg:col-span-3
        [&_.highlight-card:nth-child(2)]:lg:col-span-3
      `,
    highlights: [
      {
        title: 'Postgres Native',
        paragraph: 'Create and Manage Queues directly within your database.',
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
        title: 'Exactly Once Message Delivery',
        paragraph: 'Supabase Queues delivers a message exactly once within a visibility window.',
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
            <path d="M10 2h4" />
            <path d="M12 14v-4" />
            <path d="M4 13a8 8 0 0 1 8-7 8 8 0 1 1-5.3 14L4 17.6" />
            <path d="M9 17H4v5" />
          </svg>
        ),
      },
      {
        title: 'Message Archival',
        paragraph: 'Messages in Queues can be archived instead of deleted for future reference.',
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
            <circle cx="16" cy="16" r="6" />
            <path d="M7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2" />
            <path d="M16 14v2l1 1" />
          </svg>
        ),
      },
      {
        title: 'Real-Time Monitoring',
        paragraph: "Track and manage messages in your Queues with Supabase's observability tools.",
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
            src="https://www.youtube-nocookie.com/embed/UEwfaElBnZk"
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
    heading: <>Manage via SQL</>,
    subheading: 'Create Queues and manage messages using SQL with any Postgres client.',
    cta: {
      label: 'Start message queuing',
      url: 'https://supabase.com/dashboard/project/_/integrations/queues/overview',
    },
    image: (
      <Image
        src={{
          dark: '/images/modules/queues/queues-sql-dark.png',
          light: '/images/modules/queues/queues-sql-light.png',
        }}
        alt="Queues SQL"
        className="w-full max-w-[490px] aspect-[1/0.88] object-cover bg-cover"
        fill
        sizes="100vw, (min-width: 768px) 50vw, (min-width: 1200px) 33vw"
        quality={100}
        draggable={false}
      />
    ),
  },
  section2: {
    id: 'api',
    label: 'API',
    heading: <>Manage via API</>,
    subheading:
      'Create and manage messages either server-side or client-side via PostgREST using any Supabase client library.',
    cta: {
      label: 'Start message queuing',
      url: 'https://supabase.com/dashboard/project/_/integrations/queues/overview',
    },
    reverse: true,
    image: (
      <Image
        src={{
          dark: '/images/modules/queues/queues-api-dark.png',
          light: '/images/modules/queues/queues-api-light.png',
        }}
        alt="Queues API"
        className="w-full max-w-[490px] aspect-[1/0.88] object-cover bg-cover"
        fill
        sizes="100vw, (min-width: 768px) 50vw, (min-width: 1200px) 33vw"
        quality={100}
        draggable={false}
      />
    ),
    className: 'md:!pt-0',
  },
  section3: {
    id: 'ui',
    label: 'UI',
    heading: <>Manage and Monitor via Dashboard</>,
    subheading:
      'Create Queues and manage messages in the Dashboard as well as monitor your Queues and message processing in real-time.',
    cta: {
      label: 'Start message queuing',
      url: 'https://supabase.com/dashboard/project/_/integrations/queues/overview',
    },
    image: (
      <Image
        src={{
          dark: '/images/blog/launch-week-13/day-4-supabase-queues/message-detail.jpg',
          light: '/images/blog/launch-week-13/day-4-supabase-queues/message-detail-light.jpg',
        }}
        alt="Queues via Dashboard UI"
        className="w-full max-w-[490px] aspect-[1/1.14] object-cover bg-cover"
        fill
        sizes="100vw, (min-width: 768px) 50vw, (min-width: 1200px) 33vw"
        quality={100}
        draggable={false}
      />
    ),
    className: 'md:!pt-0',
  },
})
