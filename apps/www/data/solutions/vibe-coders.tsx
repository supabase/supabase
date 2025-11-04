import { Timer, Zap, CheckCircle, Check, Sparkles } from 'lucide-react'
import { Button, Image } from 'ui'
import type {
  FeaturesSection,
  HeroSection,
  Metadata,
  PostGridProps,
  Quotes,
} from './solutions.utils'
import dynamic from 'next/dynamic'

import MainProducts from '../MainProducts'
import { PRODUCT_SHORTNAMES } from 'shared-data/products'
import { frameworks } from 'components/Hero/HeroFrameworks'
import { FrameworkLink, getEditors } from './solutions.utils'
import type { MPCSectionProps } from 'components/Solutions/MPCSection'
import { useBreakpoint } from 'common'

const AuthVisual = dynamic(() => import('components/Products/AuthVisual'))
const ComputePricingCalculator = dynamic(
  () => import('components/Pricing/ComputePricingCalculator')
)
const FunctionsVisual = dynamic(() => import('components/Products/FunctionsVisual'))
const RealtimeVisual = dynamic(() => import('components/Products/RealtimeVisual'))
const AIBuildersLogos = dynamic(() => import('components/Solutions/AIBuildersLogos'))

const useVibeCodersContent: () => {
  metadata: Metadata
  heroSection: HeroSection
  quotes: Quotes
  why: FeaturesSection
  platform: any
  platformStarterSection: any
  mcp: MPCSectionProps
  postGrid: PostGridProps
} = () => {
  const isXs = useBreakpoint(640)
  const editors = getEditors(isXs)

  return {
    metadata: {
      metaTitle: 'Supabase for Vibe Coders',
      metaDescription:
        'Your weekend prototype deserves production. Stop letting backend complexity kill your momentum. Supabase is the production-ready backend that works with your AI tools from day one.',
    },
    heroSection: {
      id: 'hero',
      title: 'Vibe Coders',
      h1: (
        <>
          <span className="block text-foreground">Your weekend prototype</span>
          <span className="text-brand block md:ml-0">deserves production</span>
        </>
      ),
      subheader: [
        <>
          <span className="block">Weekend project. Real users.</span> Now what? Stop letting backend
          complexity kill your momentum.
        </>,
      ],
      image: undefined,
      ctas: [
        {
          label: 'Start Your Project',
          href: 'https://supabase.com/dashboard',
          type: 'primary' as any,
        },
      ],
    },
    quotes: {
      id: 'quotes',
      items: [
        {
          icon: '/images/logos/publicity/lovable.svg',
          avatar: '/images/avatars/anton-osika.jpg',
          author: 'Anton Osika',
          authorTitle: 'Lovable - CEO',
          quote: (
            <>
              We chose Supabase because it&apos;s{' '}
              <span className="text-foreground">extremely user friendly</span> and{' '}
              <span className="text-foreground">
                covers all the needs to build full-stack applications
              </span>
              .
            </>
          ),
        },
        {
          icon: '/images/logos/publicity/bolt.svg',
          avatar: '/images/avatars/eric-simons.jpg',
          author: 'Eric Simmons',
          authorTitle: 'Bolt.new - CEO',
          quote: (
            <>
              Supabase is awesome. Supabase is the{' '}
              <span className="text-foreground">key database integration</span> that we
              have...because it’s the{' '}
              <span className="text-foreground">
                best product in the world for storing and retrieving data
              </span>
              .
            </>
          ),
        },
        {
          icon: '/images/logos/publicity/v0.svg',
          avatar: '/images/avatars/guillermo-rauch.jpg',
          author: 'Guillermo Rauch',
          authorTitle: 'Vercel (v0) - CEO',
          quote: (
            <>
              <span className="text-foreground">v0 integrates with Supabase seamlessly.</span> If
              you ask v0 to generate an application and it needs Supabase,{' '}
              <span className="text-foreground">
                you’ll be prompted to create a Supabase account right there in the application
              </span>
              .
            </>
          ),
        },
      ],
    },
    why: {
      id: 'why-supabase',
      label: '',
      heading: (
        <>
          The <span className="text-foreground">Vibe Coder&apos;s Dilemma</span>
        </>
      ),
      subheading:
        "Your AI assistant nails the prototype. Users actually want it. Then reality hits. Authentication breaks. Databases crash. Deployment becomes a nightmare. You're not alone. Every vibe coder hits this wall.",
      features: [
        {
          id: 'built-for-how-you-build',
          icon: Zap,
          heading: 'Built for how you build',
          subheading:
            'Supabase is a complete production-ready back-end that includes everything you need to ship full-featured apps.',
        },
        {
          id: 'prototype-to-production',
          icon: Timer,
          heading: 'From prototype to production',
          subheading:
            'Start with a weekend project and scale to millions of users. Supabase handles the complexity so you can focus on what matters - building great products.',
        },
        {
          id: 'vibe-coding-toolkit',
          icon: CheckCircle,
          heading: 'Break through with our Vibe Coding Toolkit',
          subheading:
            'Tools, articles, and other resources to help you deploy your application to production with confidence.',
        },
      ],
    },
    platform: {
      id: 'vibe-coding-platform',
      title: (
        <>
          <span className="text-foreground">Built for how you build</span>
        </>
      ),
      subheading:
        'Supabase is a production-ready backend that works with your AI tools from day one. No DevOps degree required. No months of setup. No "learning the hard way." Just ship.',
      className: '',
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
          className: 'lg:col-span-2 flex-col lg:flex-row',
          image: (
            <div className="relative w-full max-w-xl pt-8 px-4 md:px-0">
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
                        className="group/row hover:bg-selection hover:text-foreground transition-colors cursor-pointer text-sm md:text-base"
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
              Let your users{' '}
              <span className="text-foreground">
                login with email, Google, Apple, GitHub, and more
              </span>
              . Secure and trusted.
            </>
          ),
          className: '!border-l-0 sm:!border-l sm:!border-t-0',
          image: <AuthVisual className="2xl:!-bottom-20" />,
        },
        {
          id: 'realtime',
          title: 'Realtime',
          icon: MainProducts[PRODUCT_SHORTNAMES.REALTIME].icon,
          subheading: (
            <>
              Build immersive{' '}
              <span className="text-foreground">multi-player, collaborative experiences</span>.
            </>
          ),
          className: '!border-l-0',
          image: (
            <RealtimeVisual className="[&_.visual-overlay]:bg-[linear-gradient(to_top,transparent_0%,transparent_50%,hsl(var(--background-default))_75%)]" />
          ),
        },
        {
          id: 'edge-functions',
          title: 'Edge Functions',
          icon: MainProducts[PRODUCT_SHORTNAMES.FUNCTIONS].icon,
          subheading: <>Custom backend logic when you want to dive into code.</>,
          className: '!border-l-0 sm:!border-l',
          image: <FunctionsVisual className="" />,
        },
        {
          id: 'storage',
          title: 'Storage',
          icon: MainProducts[PRODUCT_SHORTNAMES.STORAGE].icon,
          subheading: (
            <>
              <span className="text-foreground">Affordable and fast</span>, for all the videos and
              images you need in your app.
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
          id: 'vectors',
          title: 'AI Ready',
          icon: 'M4.13477 12.8129C4.13477 14.1481 4.43245 15.4138 4.96506 16.5471M12.925 4.02271C11.5644 4.02271 10.276 4.33184 9.12614 4.88371M21.7152 12.8129C21.7152 11.4644 21.4115 10.1867 20.8688 9.0447M12.925 21.6032C14.2829 21.6032 15.5689 21.2952 16.717 20.7454M16.717 20.7454C17.2587 21.5257 18.1612 22.0366 19.1831 22.0366C20.84 22.0366 22.1831 20.6935 22.1831 19.0366C22.1831 17.3798 20.84 16.0366 19.1831 16.0366C17.5263 16.0366 16.1831 17.3798 16.1831 19.0366C16.1831 19.6716 16.3804 20.2605 16.717 20.7454ZM4.96506 16.5471C4.16552 17.086 3.63965 17.9999 3.63965 19.0366C3.63965 20.6935 4.98279 22.0366 6.63965 22.0366C8.2965 22.0366 9.63965 20.6935 9.63965 19.0366C9.63965 17.3798 8.2965 16.0366 6.63965 16.0366C6.01951 16.0366 5.44333 16.2248 4.96506 16.5471ZM9.12614 4.88371C8.58687 4.08666 7.67444 3.56274 6.63965 3.56274C4.98279 3.56274 3.63965 4.90589 3.63965 6.56274C3.63965 8.2196 4.98279 9.56274 6.63965 9.56274C8.2965 9.56274 9.63965 8.2196 9.63965 6.56274C9.63965 5.94069 9.45032 5.36285 9.12614 4.88371ZM20.8688 9.0447C21.6621 8.50486 22.1831 7.59464 22.1831 6.56274C22.1831 4.90589 20.84 3.56274 19.1831 3.56274C17.5263 3.56274 16.1831 4.90589 16.1831 6.56274C16.1831 8.2196 17.5263 9.56274 19.1831 9.56274C19.8081 9.56274 20.3884 9.37165 20.8688 9.0447Z',
          subheading: (
            <>
              When you’re ready to explore vectors and{' '}
              <span className="text-foreground">the power of AI</span>, Supabase is there with
              industry-standard tools to guide you.
            </>
          ),
          className: '!border-l lg:!border-l-0',
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
          id: 'pricing',
          title: 'Pricing for builders',
          className: 'sm:col-span-2 flex-col',
          icon: (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.00391 1.67476C4.95842 1.67476 1.67891 4.95427 1.67891 8.99975C1.67891 13.0452 4.95842 16.3248 9.00391 16.3248C13.0494 16.3248 16.3289 13.0452 16.3289 8.99975C16.3289 4.95427 13.0494 1.67476 9.00391 1.67476ZM1.32891 8.99975C1.32891 4.76097 4.76512 1.32476 9.00391 1.32476C13.2427 1.32476 16.6789 4.76097 16.6789 8.99975C16.6789 13.2385 13.2427 16.6748 9.00391 16.6748C4.76512 16.6748 1.32891 13.2385 1.32891 8.99975Z"
                fill="black"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.90901 5.90877C6.33097 5.48681 6.90326 5.24976 7.5 5.24976H12C12.4142 5.24976 12.75 5.58554 12.75 5.99976C12.75 6.41397 12.4142 6.74976 12 6.74976H7.5C7.30109 6.74976 7.11032 6.82877 6.96967 6.96943C6.82902 7.11008 6.75 7.30084 6.75 7.49976C6.75 7.69867 6.82902 7.88943 6.96967 8.03009C7.11032 8.17074 7.30109 8.24976 7.5 8.24976H10.5C11.0967 8.24976 11.669 8.48681 12.091 8.90877C12.5129 9.33072 12.75 9.90302 12.75 10.4998C12.75 11.0965 12.5129 11.6688 12.091 12.0907C11.669 12.5127 11.0967 12.7498 10.5 12.7498H6C5.58579 12.7498 5.25 12.414 5.25 11.9998C5.25 11.5855 5.58579 11.2498 6 11.2498H10.5C10.6989 11.2498 10.8897 11.1707 11.0303 11.0301C11.171 10.8894 11.25 10.6987 11.25 10.4998C11.25 10.3008 11.171 10.1101 11.0303 9.96943C10.8897 9.82877 10.6989 9.74976 10.5 9.74976H7.5C6.90326 9.74976 6.33097 9.5127 5.90901 9.09075C5.48705 8.66879 5.25 8.09649 5.25 7.49976C5.25 6.90302 5.48705 6.33072 5.90901 5.90877Z"
                fill="currentColor"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.99609 3.75C9.41031 3.75 9.74609 4.08579 9.74609 4.5V13.5C9.74609 13.9142 9.41031 14.25 8.99609 14.25C8.58188 14.25 8.24609 13.9142 8.24609 13.5V4.5C8.24609 4.08579 8.58188 3.75 8.99609 3.75Z"
                fill="currentColor"
              />
            </svg>
          ),
          subheading: (
            <>
              <span className="text-foreground">A generous free tier</span>, plus fair, flexible
              pricing when you’re ready to scale.
            </>
          ),
          image: (
            <div className="relative w-full h-full">
              <div className="absolute inset-0 w-full px-4 pt-1.5 pb-0 lg:p-6 2xl:p-8">
                <ComputePricingCalculator disableInteractivity />
              </div>
            </div>
          ),
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
          code: `1. Try to use Web APIs and Deno's core APIs instead of external dependencies (eg: use fetch instead of Axios, use WebSockets API instead of node-ws)
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
    postGrid: {
      header: <>The Vibe Coding Toolkit</>,
      subheader: (
        <>
          Supabase gives you the tools to easily manage databases, authentication, and backend
          infrastructure so you can build faster and ship with confidence.
        </>
      ),
    },
  }
}

export { useVibeCodersContent as default }
