import dynamic from 'next/dynamic'
import Link from 'next/link'
import { IconGlobe } from 'ui'

import solutions from '~/data/Solutions'
import Examples from '~/data/Examples'
import { PRODUCT_NAMES } from 'shared-data/products'

const FunctionsHero = dynamic(() => import('~/components/Products/Functions/FunctionsHero'))
const RealtimeLogs = dynamic(() => import('~/components/Products/Functions/RealtimeLogs'))
const Metrics = dynamic(() => import('~/components/Products/Functions/Metrics'))
const QueryLogs = dynamic(() => import('~/components/Products/Functions/QueryLogs'))
const LocalDXImage = dynamic(() => import('~/components/Products/Functions/LocalDXImage'))
const ParityImage = dynamic(() => import('~/components/Products/Functions/ParityImage'))
const NpmEcosystem = dynamic(() => import('~/components/Products/Functions/NpmEcosystem'))
const CI = dynamic(() => import('~/components/Products/Functions/CI'))
const ZeroConfigPanel = dynamic(() => import('~/components/Products/Functions/ZeroConfigPanel'))
const ConnectToDBPanel = dynamic(() => import('~/components/Products/Functions/ConnectToDBPanel'))
const TriggerViaWebhookPanel = dynamic(
  () => import('~/components/Products/Functions/TriggerViaWebhookPanel')
)
const WorksWithAuthPanel = dynamic(
  () => import('~/components/Products/Functions/WorksWithAuthPanel')
)
const WorksWithStoragePanel = dynamic(
  () => import('~/components/Products/Functions/WorksWithStoragePanel')
)

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
      'Easily author, deploy and monitor serverless functions distributed globally at the edge, close to your users.',
    ],
    image: <FunctionsHero />,
    ctas: [
      {
        label: 'Launch a free database',
        href: '/dashboard',
        type: 'primary' as any,
      },
      {
        label: 'Read documentation',
        href: '/docs/guides/functions',
        type: 'default' as any,
      },
    ],
  },
  highlightsSection: {
    highlights: [
      {
        title: 'Fully managed',
        paragraph: 'Edge Functions scale automatically, reducing your devops burden',
        svg: (
          <div className="w-12 h-12 p-2 bg-alternative rounded-lg border flex justify-center items-center">
            <svg
              className="w-7 h-7"
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
            <IconGlobe className="w-7 h-7 stroke-[1.4px]" />
          </div>
        ),
      },
      {
        title: 'Secure and Scalable',
        paragraph: 'Simply write your code in TypeScript and deploy',
        svg: (
          <div className="w-12 h-12 p-2 bg-alternative rounded-lg border flex justify-center items-center">
            <svg
              className="w-7 h-7"
              width="100%"
              height="100%"
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
            <svg
              className="w-7 h-7"
              width="100%"
              height="100%"
              viewBox="0 0 26 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.9233 0.444469C12.6102 0.0512999 13.5049 0.049524 14.1912 0.444469C17.6439 2.39542 21.0976 4.3433 24.5497 6.29543C25.199 6.66117 25.6333 7.38378 25.6267 8.13193V19.8696C25.6315 20.6487 25.1543 21.3886 24.4693 21.746C21.028 23.6862 17.5884 25.6288 14.1477 27.569C13.4466 27.9698 12.5339 27.939 11.8547 27.5052C10.823 26.9072 9.78955 26.312 8.75774 25.7145C8.5469 25.5888 8.30922 25.4888 8.16034 25.2844C8.29195 25.107 8.52726 25.0849 8.71847 25.0074C9.14913 24.8705 9.54467 24.6507 9.9403 24.4373C10.0403 24.3689 10.1625 24.3951 10.2584 24.4564C11.1406 24.9622 12.0151 25.4828 12.9003 25.9838C13.0891 26.0928 13.2803 25.9481 13.4417 25.8581C16.8187 23.9495 20.1999 22.048 23.5763 20.1388C23.7014 20.0786 23.7706 19.9458 23.7604 19.8088C23.7628 15.9368 23.761 12.0641 23.7616 8.19212C23.7759 8.03662 23.6859 7.89366 23.5453 7.83003C20.1159 5.89871 16.6883 3.96444 13.2595 2.03263C13.2001 1.99179 13.1297 1.96988 13.0576 1.96977C12.9855 1.96967 12.9151 1.99138 12.8556 2.03204C9.42677 3.96444 5.99974 5.90049 2.57093 7.8317C2.43083 7.89544 2.3368 8.03603 2.35348 8.19212C2.35407 12.0641 2.35348 15.9368 2.35348 19.8094C2.34753 19.8763 2.36222 19.9433 2.39556 20.0016C2.4289 20.0599 2.47929 20.1065 2.53995 20.1353C3.45494 20.6541 4.37112 21.1694 5.2867 21.6864C5.80251 21.9641 6.43582 22.129 7.00412 21.9163C7.50562 21.7365 7.85715 21.2247 7.84758 20.6922C7.85232 16.8428 7.84521 12.9928 7.85113 9.14401C7.8386 8.97313 8.0007 8.83194 8.16685 8.84802C8.60649 8.84506 9.04672 8.8421 9.48636 8.84921C9.66987 8.84506 9.79616 9.02907 9.77347 9.20123C9.77169 13.075 9.7782 16.9489 9.77051 20.8227C9.77169 21.8551 9.34754 22.9784 8.39259 23.4836C7.21614 24.093 5.76206 23.9638 4.59982 23.3794C3.59366 22.8772 2.63348 22.2845 1.64518 21.7465C0.958393 21.391 0.483532 20.6482 0.488366 19.8697V8.13193C0.481164 7.36829 0.932741 6.63256 1.60226 6.27215C5.04301 4.33038 8.48316 2.38713 11.9233 0.444469Z"
                fill="currentColor"
              />
              <path
                d="M14.9242 8.57537C16.4248 8.47878 18.0313 8.51814 19.3817 9.25742C20.4272 9.82394 21.0069 11.0129 21.0253 12.1745C20.9961 12.3311 20.8323 12.4176 20.6828 12.4068C20.2474 12.4062 19.8119 12.4127 19.3765 12.4039C19.1918 12.411 19.0844 12.2407 19.0613 12.0774C18.9362 11.5216 18.6331 10.9712 18.11 10.7031C17.3069 10.3011 16.3759 10.3213 15.5002 10.3297C14.861 10.3636 14.1736 10.419 13.6321 10.7949C13.2163 11.0796 13.09 11.6544 13.2384 12.1173C13.3783 12.4497 13.762 12.557 14.076 12.6558C15.8844 13.1288 17.8008 13.0818 19.5748 13.7042C20.3092 13.958 21.0277 14.4513 21.2791 15.2203C21.6079 16.2509 21.4638 17.4828 20.7305 18.3102C20.1359 18.991 19.2698 19.3616 18.406 19.5629C17.2569 19.8191 16.0644 19.8256 14.8974 19.7119C13.8001 19.5868 12.6582 19.2985 11.8111 18.5508C11.0867 17.9218 10.7329 16.9418 10.768 15.996C10.7764 15.8362 10.9354 15.7248 11.0885 15.7379C11.5269 15.7344 11.9654 15.7332 12.4038 15.7385C12.579 15.726 12.7088 15.8774 12.7178 16.0424C12.7987 16.5719 12.9977 17.1277 13.4594 17.4416C14.3505 18.0166 15.4687 17.9772 16.489 17.9933C17.3344 17.9558 18.2833 17.9444 18.9732 17.3857C19.3371 17.067 19.445 16.5339 19.3466 16.0752C19.24 15.6879 18.8349 15.5075 18.487 15.3895C16.7017 14.8247 14.7639 15.0297 12.9959 14.391C12.2781 14.1374 11.584 13.6578 11.3083 12.9204C10.9235 11.8767 11.0998 10.5858 11.9099 9.78635C12.6998 8.99113 13.8401 8.68498 14.9242 8.57537Z"
                fill="currentColor"
              />
            </svg>
          </div>
        ),
      },
    ],
  },
  examplesSection: {
    title: 'What you can build with Edge Functions',
    cta: {
      label: 'View all examples',
      href: '/docs/guides/functions#examples',
      type: 'default' as any,
    },
    examples: Examples.filter((example) => example.products.includes(PRODUCT_NAMES.FUNCTIONS)),
  },
  localDXsection: {
    title: <>Delightful DX from local to production</>,
    paragraph: (
      <>
        Edge Functions are developed using{' '}
        <Link
          href="https://deno.com/"
          className="underline hover:text-foreground-light transition-colors"
          target="_blank"
        >
          Deno
        </Link>
        , an open source JavaScript runtime that ensures maximum power and flexibility. Migrate in
        and out at any time with no vendor lock-in.
      </>
    ),
    cards: [
      {
        id: 'localDX',
        label: 'First-class local dev experience',
        paragraph:
          'Write code with hot code reloading, a fast Language server for autocompletion, type checking and linting',
        className: '',
        image: <LocalDXImage />,
      },
      {
        id: 'parity',
        label: 'Dev and Prod parity',
        paragraph: (
          <>
            The open source{' '}
            <Link
              href="https://github.com/supabase/edge-runtime/"
              className="underline hover:text-foreground-light transition-colors"
            >
              Edge runtime
            </Link>{' '}
            runs your functions locally during development and the same runtime powers functions in
            production
          </>
        ),
        className: '',
        image: <ParityImage />,
      },
      {
        id: 'ecosystem',
        label: 'Use any NPM module',
        paragraph: 'Tap into the 2+ million modules in the Deno and NPM ecosystem',
        className: '',
        image: <NpmEcosystem />,
      },
      {
        id: 'ci',
        label: 'Continuous Integration',
        paragraph: (
          <>
            Use the{' '}
            <Link
              href="https://supabase.com/docs/guides/functions/cicd-workflow"
              className="underline hover:text-foreground-light transition-colors"
            >
              Supabase CLI with Github actions
            </Link>{' '}
            to preview and deploy your functions along with the rest of your application
          </>
        ),
        className: '',
        image: <CI />,
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
        paragraph: (
          <>
            Edge functions run globally or can be{' '}
            <Link
              href="https://supabase.com/docs/guides/functions/regional-invocation"
              className="underline hover:text-foreground-light transition-colors"
            >
              pinned to your database's proximity
            </Link>
          </>
        ),
      },
      {
        label: 'Automatic scaling',
        paragraph: 'Seamlessly scale with usage without any manual tuning',
      },
      {
        label: 'Secure',
        paragraph: 'Scale with confidence with SSL, Firewall and DDOS protection built in',
      },
    ],
  },
  o11y: {
    title: 'Built-in observability',
    panels: [
      {
        id: 'realtime-logs',
        label: 'Realtime logs',
        icon: '',
        paragraph:
          'Stream logs to the dashboard in realtime. Logs are populated with rich metadata to help debugging',
        image: RealtimeLogs,
      },
      {
        id: 'log-explorer',
        label: 'Query Logs via Log explorer',
        icon: '',
        paragraph:
          'Get deeper insights into how your functions are behaving by writing SQL queries on function logs',
        image: QueryLogs,
      },
      {
        id: 'metrics',
        label: 'Metrics',
        icon: '',
        paragraph: 'Dashboards show the health of your functions at all times',
        image: Metrics,
      },
    ],
  },
  integratesWithSupabase: {
    title: 'Integrates seamlessly with the Supabase ecosystem',
    useCases: [
      {
        label: 'Zero configuration',
        paragraph: 'Pre-populated environment variables required to access your supabase project',
        panel: <ZeroConfigPanel />,
      },
      {
        label: 'Connect to your database',
        paragraph:
          'Connect to your Postgres database from an Edge Function by using the supabase-js client',
        panel: <ConnectToDBPanel />,
      },
      {
        label: 'Trigger via webhook',
        paragraph:
          'Database Webhooks allow you to send real-time data from your database to another system whenever a table event occurs',
        panel: <TriggerViaWebhookPanel />,
      },
      {
        label: 'Works with Supabase Auth',
        paragraph: (
          <>
            Edge Functions are designed to work seamlessly with{' '}
            <Link
              href="https://supabase.com/docs/guides/functions/auth"
              className="underline hover:text-foreground-light transition-colors"
            >
              Supabase Auth
            </Link>
          </>
        ),
        panel: <WorksWithAuthPanel />,
      },
      {
        label: 'Works with Supabase Storage',
        paragraph: (
          <>
            Edge Functions are designed to work seamlessly with{' '}
            <Link
              href="https://supabase.com/docs/guides/functions/storage-caching"
              className="underline hover:text-foreground-light transition-colors"
            >
              Supabase Storage
            </Link>
          </>
        ),
        panel: <WorksWithStoragePanel />,
      },
    ],
  },
})
