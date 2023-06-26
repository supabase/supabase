import Image from 'next/image'
import VideoWithHighlights from '~/components/VideoWithHighlights'
import UseAnyStack from '~/components/Highlights/UseAnyStack'
import solutions from '../Solutions'
import { frameworks } from '../frameworks'

export default {
  heroSection: {
    heading: (
      <>
        <span className="block text-[#F4FFFA00] bg-clip-text bg-gradient-to-b from-scale-1200 to-scale-1200 dark:to-scale-1100">
          Build in a weekend
        </span>
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#3ECF8E] via-[#3ECF8E] to-[#3ecfb2] block md:ml-0">
          Scale to millions
        </span>
      </>
    ),
    subheading: (
      <>
        Supabase is an open source Firebase alternative. <br className="hidden md:block" />
        Start your project with a Postgres database, Authentication, instant APIs, Edge Functions,
        Realtime subscriptions, Storage, and Vector embeddings.
      </>
    ),
    image: '/images/index/gradient-bg.png',
    cta: {
      label: 'Start your project',
      link: 'https://app.supabase.com',
    },
    secondaryCta: {
      label: 'Documentation',
      link: '/docs',
    },
  },
  highlightsSection: {
    highlights: [
      {
        title: 'Works with any stack',
        outerClassName: 'col-span-full',
        innerClassName: 'w-full aspect-[9/1]',
        children: <UseAnyStack />,
      },
      {
        title: 'Postgres Database',
        paragraph:
          'Postgres is the core of Supabase. We simply provide the tools to make to most of it.',
        outerClassName: '',
        innerClassName: 'w-full aspect-[1/2]',
        children: (
          <div className="absolute inset-0 w-full h-auto">
            <Image
              src="/images/index/highlights/pg-highlight.svg"
              alt="Postgres stylized logo"
              layout="fill"
              objectFit="cover"
              className="w-full h-auto"
            />
          </div>
        ),
      },
      {
        title: 'Maximum flexibility',
        paragraph:
          'To avoid lock-in, we make it easy to migrate in and out by adopting open source tools.',
        outerClassName: '!w-full !h-[400px]',
        innerClassName: '!w-full ',
        children: <></>,
      },
      {
        title: 'Hosted infrastructure',
        paragraph:
          'Choose from globally-distributed data centers or self-host Supabase on your cloud.',
        outerClassName: 'h-[200px]',
        innerClassName: 'w-full h-[200px] ',
        children: '',
      },
    ],
  },
  useSupabaseTo: {
    strings: [
      'build an MVP in a day',
      'build scalable backends',
      'authenticate users',
      'process a billion transactions',
      'trigger webhooks',
      'store all your media',
      'build a realtime app',
      'build the next AI tool',
      'build the next Facebook',
      'scale an e-commerce',
      'collect payments',
      "build your friends' genius idea",
    ],
  },
  productsSection: {
    products: { ...solutions },
  },
  dashboardFeatures: {
    title: (
      <>
        Manage your app <br className="hidden md:block" />
        without leaving the dashboard
      </>
    ),
    tabs: [
      {
        label: 'Table Editor',
        panel: () => (
          <VideoWithHighlights
            video={'/images/index/dashboard/table-editor-demo.mp4'}
            highlights={[
              'Full CRUD',
              'Materialized Views',
              'Row Level Security',
              'Easy as a spreadsheet',
            ]}
          />
        ),
      },
      {
        label: 'SQL Editor',
        panel: () => (
          <VideoWithHighlights
            video={'/images/index/dashboard/table-editor-demo.mp4'}
            highlights={[
              'Write and execute SQL',
              'Save time using templates',
              'Save and reuse queries',
            ]}
          />
        ),
      },
      {
        label: 'Auth Rules',
        panel: () => (
          <VideoWithHighlights
            video={'/images/index/dashboard/table-editor-demo.mp4'}
            highlights={[
              'Email logins',
              'Magic links',
              'Third-party login',
              'Custom access policies',
              'Password recovery',
            ]}
          />
        ),
      },
    ],
  },
  APIsection: {
    title: (
      <>
        <span className="heading-gradient">Instant APIs that </span>
        <br />
        <span className="heading-gradient">do the hard work for you</span>
      </>
    ),
    paragraph:
      'We introspect your database to provide APIs instantly. Stop building repetitive CRUD endpoints and focus on your product.',
    cta: {
      label: 'Explore documentation',
      link: '/docs/guides/ai/vecs-python-client',
    },
    tabs: [
      {
        label: 'Create User',
        // paragraph:
        //   'Using Supabase client to create a new user with email and password for authentication.',
        lang: 'js' as 'js',
        code: `
import { createClient } from '@supabase/supabase-js'

// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Create a new user
const { user, error } = await supabase.auth.signUpWithPassword({
  email: 'example@email.com',
  password: 'example-password',
})
`,
      },
      {
        label: 'Realtime Subscriptions',
        // paragraph:
        //   'Using Supabase client to create a new user with email and password for authentication.',
        lang: 'js' as 'js',
        code: `import { createClient } from '@supabase/supabase-js'
    
// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Get notified of all new chat messages
const realtime = supabase
  .from('messages')
  .on('INSERT', message => {
    console.log('New message!', message)
  })
  .subscribe()
        `,
      },
      {
        label: 'Read a Record',
        // paragraph:
        //   'Using Supabase client to create a new user with email and password for authentication.',
        lang: 'js' as 'js',
        code: `import '@supabase/supabase-js'

// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Get public rooms and their messages
const publicRooms = await supabase
  .from('rooms')
  .select(\`
    name,
    messages ( text )
  \`)
  .eq('public', true)
        `,
      },
      {
        label: 'Create a Record',
        // paragraph:
        //   'Using Supabase client to create a new user with email and password for authentication.',
        lang: 'js' as 'js',
        code: `
import { createClient } from '@supabase/supabase-js'

// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Create a new chat room
const newRoom = await supabase
  .from('rooms')
  .insert({ name: 'Supabase Fan Club', public: true })
        `,
      },
      {
        label: 'Update a Record',
        // paragraph:
        //   'Using Supabase client to create a new user with email and password for authentication.',
        lang: 'js' as 'js',
        code: `import { createClient } from '@supabase/supabase-js'

// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Update multiple users
const updatedUsers = await supabase
  .from('users')
  .eq('account_type', 'paid')
  .update({ highlight_color: 'gold' })
        `,
      },
    ],
  },
  examplesSection: {
    title: <span className="heading-gradient">What will you build?</span>,
    paragraph: 'Kickstart your next project with one of the many examples available.',
    examples: [
      {
        type: 'example',
        products: ['database', 'auth'],
        frameworks: [frameworks['nextjs']],
        title: 'Next.js Subscription and Auth',
        description: 'The all-in-one starter kit for high-performance SaaS applications.',
        author: 'Vercel',
        author_url: 'https://github.com/vercel',
        author_img: 'https://avatars.githubusercontent.com/u/14985020',
        repo_name: 'nextjs-subscription-payments',
        cta: {
          link: 'https://github.com/vercel/nextjs-subscription-payments',
        },
        vercel_deploy_url:
          'https://vercel.com/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnextjs-subscription-payments&project-name=nextjs-subscription-payments&repo-name=nextjs-subscription-payments&demo-title=Next.js%20Subscription%20Payments%20Starter&demo-description=Demo%20project%20on%20Vercel&demo-url=https%3A%2F%2Fsubscription-payments.vercel.app&demo-image=https%3A%2F%2Fsubscription-payments.vercel.app%2Fdemo.png&integration-ids=oac_pb1dqJT8Ry2D99Q0o9qXWIhJ,oac_jUduyjQgOyzev1fjrW83NYOv&external-id=nextjs-subscription-payments',
        demo_url: 'https://subscription-payments.vercel.app/',
      },
      {
        type: 'example',
        products: ['database', 'realtime'],
        frameworks: [frameworks['nextjs']],
        title: 'Next.js Realtime chat app',
        description: 'Next.js Slack clone app using Supabase realtime subscriptions',
        author: 'supabase',
        author_url: 'https://github.com/supabase',
        author_img: 'https://avatars.githubusercontent.com/u/54469796',
        repo_name: 'nextjs-slack-clone',
        cta: {
          link: 'https://github.com/supabase/supabase/tree/master/examples/slack-clone/nextjs-slack-clone',
        },
        vercel_deploy_url: '',
        demo_url: '',
      },
      {
        type: 'example',
        products: ['database', 'storage'],
        frameworks: [frameworks['svelte']],
        title: 'Svelte kanban board',
        description: 'A Trello clone using Supabase as the storage system.',
        author: 'joshnuss',
        author_url: 'https://github.com/joshnuss',
        author_img: 'https://avatars.githubusercontent.com/u/4437',
        repo_name: 'supabase-kanban',
        cta: { link: 'https://github.com/joshnuss/supabase-kanban' },
        vercel_deploy_url: '',
        demo_url: 'https://supabase-kanban.vercel.app/',
      },
      {
        type: 'example',
        products: ['database', 'vector'],
        frameworks: [frameworks['python']],
        title: 'Langchain Chatbot',
        description: 'NextJS todo list example',
        author: 'supabase',
        author_url: 'https://github.com/supabase',
        author_img: 'https://avatars.githubusercontent.com/u/54469796',
        repo_name: 'langchain-chatbot-demo',
        cta: { link: 'https://github.com/supabase-community/langchain-chatbot-demo' },
        vercel_deploy_url: '',
        demo_url: 'https://supabase.com/docs/guides/ai/langchain',
      },
      {
        type: 'example',
        products: ['database', 'vector'],
        frameworks: [frameworks['python']],
        title: 'Langchain Chatbot',
        description: 'NextJS todo list example',
        author: 'supabase',
        author_url: 'https://github.com/supabase',
        author_img: 'https://avatars.githubusercontent.com/u/54469796',
        repo_name: 'langchain-chatbot-demo',
        cta: { link: 'https://github.com/supabase-community/langchain-chatbot-demo' },
        vercel_deploy_url: '',
        demo_url: 'https://supabase.com/docs/guides/ai/langchain',
      },
      {
        type: 'example',
        products: ['database'],
        frameworks: [frameworks['react']],
        title: 'User Management with Expo',
        description: 'React Native example with Supabase Auth',
        author: 'supabase',
        author_url: 'https://github.com/codingki',
        author_img: 'https://avatars.githubusercontent.com/u/39829726',
        repo_name: 'expo-user-management',
        cta: {
          link: 'https://github.com/supabase/supabase/tree/master/examples/user-management/expo-user-management',
        },
        vercel_deploy_url: '',
        demo_url: '',
      },
    ],
  },
  quotesSection: {
    title: <></>,
    cta: {
      label: 'Github Discussions',
      link: 'https://github.com/supabase/supabase/discussions',
    },
    secondaryCta: {
      label: 'Discord',
      link: 'https://discord.supabase.com',
    },
    customers: [
      {
        type: 'customer-story',
        avatar: '',
        customer: 'markprompt',
        author: 'Michael Fester',
        role: 'Co-Founder at Markprompt',
        quote:
          'We decided to use Supabase over other specialized vector databases because it enabled us to be GDPR compliant from day one with little effort.',
        image: '/images/customers/logos/markprompt.png',
        abstract: 'Markprompt and Supabase - GDPR-Compliant AI Chatbots for Docs and Websites.',
        url: '/customers/markprompt',
      },
      {
        type: 'customer-story',
        avatar: '',
        customer: 'mendableai',
        author: 'Caleb Peffer',
        role: 'CEO at Mendable',
        quote:
          'We tried other vector databases - we tried Faiss, we tried Weaviate, we tried Pinecone. If you’re just doing vector search they’re great, but if you need to store a bunch of metadata that becomes a huge pain.',
        image: '/images/customers/logos/mendableai.png',
        abstract: 'Mendable switches from Pinecone to Supabase for PostgreSQL vector embeddings.',
        url: '/customers/mendableai',
      },
    ],
    secondaryLinks: [
      // {
      //   customer: 'BerriAI',
      //   image: '/images/product/vector/community/berriAI.svg',
      //   url: '/customers/berriai',
      // },
    ],
  },
}
