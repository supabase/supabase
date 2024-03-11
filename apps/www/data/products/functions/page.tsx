import Link from 'next/link'
import solutions from '../../Solutions'
import { IconGlobe } from 'ui'
import Examples from '../../Examples'
import { PRODUCT_NAMES } from 'shared-data/products'

export default (isMobile?: boolean) => ({
  metaTitle: 'Supabase Edge Functions - Deploy JavaScript globally in seconds',
  metaDescription:
    'Execute your code closest to your users with fast deploy times and low latency.',
  heroSection: {
    title: solutions.functions.name,
    h1: (
      <>
        Deploy JavaScript
        <br /> globally in seconds
      </>
    ),
    subheader: [
      <>
        Easily author, deploy and monitor serverless functions distributed globally at the edge,
        close to your users.
      </>,
    ],
    image: '/images/product/vector/vector-hero.svg',
    cta: {
      label: 'Launch a free database',
      link: '/dashboard',
    },
    secondaryCta: {
      label: 'Read documentation',
      link: '/docs/guides/functions',
    },
  },
  highlightsSection: {
    highlights: [
      {
        title: 'Fully managed',
        paragraph:
          'Use pgvector to store, query, and index your vector embeddings at scale in a Postgres instance.',
        svg: (
          <div className="w-12 h-12 p-2 bg-alternative rounded-lg border flex justify-center items-center">
            <svg
              className="w-6 h-6"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.8217 2.21899C9.75065 2.21899 8.07174 3.89791 8.07174 5.96896V11.783C8.07174 11.8536 8.08148 11.9218 8.0997 11.9866C8.17354 12.3232 8.47349 12.5752 8.83229 12.5752H10.5494C10.8626 12.5752 11.1749 12.8513 11.1749 13.2656V15.0638C11.1749 15.3165 11.2998 15.54 11.4913 15.6759C11.6177 15.7729 11.7759 15.8306 11.9476 15.8306H17.9997C20.0707 15.8306 21.7496 14.1517 21.7496 12.0806V5.96896C21.7496 3.89791 20.0707 2.21899 17.9997 2.21899H11.8217ZM12.6749 14.3307H17.9997C19.2423 14.3307 20.2497 13.3233 20.2497 12.0806L20.2497 5.96896C20.2497 4.7263 19.2423 3.71893 17.9997 3.71893H11.8217C10.579 3.71893 9.57167 4.7263 9.57167 5.96896V11.0752H10.5494C10.9115 11.0752 11.2478 11.1666 11.5412 11.3263C11.5507 11.3157 11.5605 11.3052 11.5708 11.295L15.5026 7.36084L12.6816 7.36066C12.2674 7.36063 11.9316 7.02482 11.9317 6.61061C11.9317 6.1964 12.2675 5.86063 12.6817 5.86066L16.543 5.86091C17.3714 5.86096 18.0429 6.53248 18.0429 7.36085L18.0431 11.2597C18.0431 11.6739 17.7073 12.0097 17.2931 12.0097C16.8789 12.0097 16.5431 11.674 16.5431 11.2598L16.543 8.44186L12.6317 12.3553C12.597 12.3901 12.5597 12.4207 12.5205 12.4472C12.6204 12.7022 12.6749 12.9791 12.6749 13.2656V14.3307Z"
                fill="currentColor"
              />
              <path
                d="M4.53957 11.0752H6.25666C6.67087 11.0752 7.00666 11.411 7.00666 11.8252C7.00666 12.2394 6.67087 12.5752 6.25666 12.5752H4.53957C4.22636 12.5752 3.91406 12.8513 3.91406 13.2656L3.91406 15.0638C3.91406 15.4781 3.57828 15.8138 3.16406 15.8138C2.74985 15.8138 2.41406 15.4781 2.41406 15.0638V13.2656C2.41406 12.0889 3.33344 11.0752 4.53957 11.0752Z"
                fill="currentColor"
              />
              <path
                d="M3.16406 17.0111C3.57828 17.0111 3.91406 17.3469 3.91406 17.7611L3.91406 19.5593C3.91406 19.9737 4.22636 20.2498 4.53957 20.2498L6.25666 20.2498C6.67087 20.2498 7.00666 20.5856 7.00666 20.9998C7.00666 21.414 6.67087 21.7498 6.25666 21.7498L4.53957 21.7498C3.33344 21.7498 2.41406 20.7361 2.41406 19.5593V17.7611C2.41406 17.3469 2.74985 17.0111 3.16406 17.0111Z"
                fill="currentColor"
              />
              <path
                d="M11.9249 17.0111C12.3391 17.0111 12.6749 17.3469 12.6749 17.7611V19.5593C12.6749 20.7361 11.7555 21.7498 10.5494 21.7498H8.83229C8.41807 21.7498 8.08229 21.414 8.08229 20.9998C8.08229 20.5856 8.41807 20.2498 8.83229 20.2498H10.5494C10.8626 20.2498 11.1749 19.9737 11.1749 19.5593V17.7611C11.1749 17.3469 11.5107 17.0111 11.9249 17.0111Z"
                fill="currentColor"
              />
            </svg>
          </div>
        ),
      },
      {
        title: 'Global deployments',
        paragraph: 'Deploy worldwide for maximum resiliency and low latency',
        svg: (
          <div className="w-12 h-12 p-2 bg-alternative rounded-lg border flex justify-center items-center">
            <IconGlobe className="w-6 h-6" />
          </div>
        ),
      },
      {
        title: 'Secure and Scalable',
        paragraph: 'Simply write your code in TypeScript and deploy.',
        svg: (
          <div className="w-12 h-12 p-2 bg-alternative rounded-lg border flex justify-center items-center">
            <svg
              className="w-6 h-6"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.7377 6.5363C14.145 6.61196 14.4138 7.00343 14.3381 7.41068L12.5869 16.8366C12.5112 17.2438 12.1197 17.5126 11.7125 17.437C11.3052 17.3613 11.0364 16.9698 11.1121 16.5626L12.8633 7.13669C12.939 6.72944 13.3305 6.46064 13.7377 6.5363Z"
                fill="currentColor"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.7279 9.10834C16.0208 8.81543 16.4957 8.81539 16.7886 9.10826L19.1499 11.4692C19.2906 11.6099 19.3696 11.8007 19.3696 11.9996C19.3696 12.1985 19.2906 12.3893 19.15 12.5299L16.7886 14.8913C16.4957 15.1842 16.0209 15.1842 15.728 14.8913C15.4351 14.5984 15.4351 14.1235 15.728 13.8306L17.5589 11.9997L15.728 10.169C15.4351 9.87613 15.4351 9.40126 15.7279 9.10834Z"
                fill="currentColor"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9.72153 14.8913C9.42866 15.1842 8.95379 15.1842 8.66087 14.8913L6.29954 12.5303C6.15887 12.3897 6.07983 12.1989 6.07983 12C6.07982 11.8011 6.15884 11.6103 6.2995 11.4696L8.66083 9.10831C8.95373 8.81542 9.4286 8.81542 9.72149 9.10831C10.0144 9.4012 10.0144 9.87608 9.72149 10.169L7.89053 11.9999L9.72145 13.8306C10.0144 14.1235 10.0144 14.5983 9.72153 14.8913Z"
                fill="currentColor"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.95312 6C2.95312 3.92893 4.63206 2.25 6.70313 2.25H18.7031C20.7742 2.25 22.4531 3.92893 22.4531 6V18C22.4531 20.0711 20.7742 21.75 18.7031 21.75H6.70313C4.63206 21.75 2.95312 20.0711 2.95312 18V6ZM6.70313 3.75C5.46048 3.75 4.45313 4.75736 4.45313 6V18C4.45313 19.2426 5.46048 20.25 6.70313 20.25H18.7031C19.9458 20.25 20.9531 19.2426 20.9531 18V6C20.9531 4.75736 19.9458 3.75 18.7031 3.75H6.70313Z"
                fill="currentColor"
              />
            </svg>
          </div>
        ),
      },
      {
        title: 'Node.js Support',
        paragraph:
          'Easily migrate existing workloads, with support for Node and more than 1 million NPM modules',
        svg: (
          <div className="w-12 h-12 p-2 bg-alternative rounded-lg border flex justify-center items-center">
            <IconGlobe className="w-6 h-6" />
          </div>
        ),
      },
    ],
  },
  useCasesSection: {
    title: <>What you can build with Edge Functions</>,
    useCases: [
      {
        label: 'Sending Emails',
        paragraph: 'Using Sendgrid, AWS SES, and others — generic mail & SMTP variables',
        panel: <div>lorem</div>,
      },
      {
        label: 'OpenAI proxying',
        paragraph: '',
        panel: <div>lorem</div>,
      },
      {
        label: 'Stripe',
        paragraph: '',
        panel: <div>lorem</div>,
      },
      {
        label: 'Connecting directly to DB',
        paragraph: '',
        panel: <div>lorem</div>,
      },
      {
        label: (
          <>
            Importing from <Link href="deno.land">deno.land</Link>
          </>
        ),
        paragraph: '',
        panel: <div>lorem</div>,
      },
    ],
  },
  localDXsection: {
    title: <>Delightful DX from local to production</>,
    paragraph: (
      <>
        Deno comes bundled in with a linter, test runner, format, benchmarking tool and a compiler.
        Spend less time configuring tools and more time writing business logic.
      </>
    ),
    cards: [
      {
        id: 'localDX',
        label: 'First-class local development experience',
        paragraph:
          'Write code with hot code reloading, a fast Language server for autocompletion, type checking and linting.',
        className: '',
        image: <div className="w-full h-full flex items-center justify-center">lorem</div>,
      },
      {
        id: 'parity',
        label: 'Dev and Prod parity',
        paragraph: (
          <>
            The open source{' '}
            <Link href="/" className="underline hover:text-foreground-light">
              Edge runtime
            </Link>{' '}
            runs your functions locally during development and the same runtime powers functions in
            production
          </>
        ),
        className: '',
        image: <div className="w-full h-full flex items-center justify-center">lorem</div>,
      },
      {
        id: 'ecosystem',
        label: 'Robust ecosystem',
        paragraph: 'Tap into the 2+ million modules in the Deno and NPM ecosystem.',
        className: '',
        image: <div className="w-full h-full flex items-center justify-center">lorem</div>,
      },
      {
        id: 'ci',
        label: 'Continuous Integration',
        paragraph:
          'Use the Supabase CLI with Github actions to preview and deploy your functions along with the rest of your application',
        className: '',
        image: <div className="w-full h-full flex items-center justify-center">lorem</div>,
      },
    ],
  },
  globalPresenceSection: {
    title: (
      <>
        Edge Functions run{' '}
        <span className="text-foreground">server-side logic geographically close to users</span>,
        offering low latency and great performance.
      </>
    ),
    features: [
      {
        label: 'Global presence',
        paragraph: "Edge functions run globally or can be pinned to your database's proximity.",
      },
      {
        label: 'Automatic scaling',
        paragraph: 'Seamlessly scale with usage without any manual tuning. ',
      },
      {
        label: 'Secure',
        paragraph: 'Scale with confidence with SSL, Firewall and DDOS protection built in.',
      },
    ],
  },
  o11y: {
    title: 'Built-in observability',
    useCases: [
      {
        label: '',
        paragraph: '',
        panel: <div>lorem</div>,
      },
      {
        label: '',
        paragraph: '',
        panel: <div>lorem</div>,
      },
      {
        label: '',
        paragraph: '',
        panel: <div>lorem</div>,
      },
    ],
  },
  integratesWithSupabase: {
    title: 'Integrates perfectly with the Supabase ecosystem',
    useCases: [
      {
        label: 'Zero configuration',
        paragraph: 'Pre-populated environment variables required to access your supabase project',
        panel: <div>lorem</div>,
      },
      {
        label: 'Connect to your database',
        paragraph: '',
        panel: <div>lorem</div>,
      },
      {
        label: 'Trigger via webhook',
        paragraph: '',
        panel: <div>lorem</div>,
      },
      {
        label: 'Works with Supabase Auth',
        paragraph: '',
        panel: <div>lorem</div>,
      },
      {
        label: 'Works with Supabase Storage',
        paragraph: '',
        panel: <div>lorem</div>,
      },
    ],
  },
  examplesSection: {
    title: 'Examples',
    examples: Examples.filter((example) => example.products.includes(PRODUCT_NAMES.FUNCTIONS)),
  },
})
