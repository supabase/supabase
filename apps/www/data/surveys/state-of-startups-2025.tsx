const stateOfStartupsData = {
  metaTitle: 'State of Startups 2025 | Supabase',
  metaDescription:
    'The latest trends among builders in tech stacks, AI usage, problem domains, and more.',
  metaImage: '/images/state-of-startups/2025/state-of-startups-og.png',
  heroSection: {
    title: 'State of Startups 2025',
    subheader:
      'We surveyed over 2,000 startup founders and builders to uncover what’s powering modern startups: their stacks, their go-to-market motion, and their approach to AI.',
    cta: 'This report is built for builders.',
  },
  pageChapters: [
    {
      title: 'Who’s Building Startups',
      shortTitle: 'Founder and Company',
      description:
        'Today’s startup ecosystem is dominated by young, technical builders shipping fast with lean teams.',
      pullQuote: {
        quote:
          'Our team is just two people at the moment. We’re funding the proof-of-concept stage out of our own pockets.',
        author: 'Richard Kranendonk',
        authorPosition: 'CEO, Thinking Security Works',
        authorAvatar: '/images/state-of-startups/quote-avatars/richard-k-120x120.jpg',
      },
      sections: [
        {
          title: 'Roles and Experience',
          description:
            'Founders are overwhelmingly technical and under 40, with most building their first company.',
          stats: [
            { percent: 81, label: 'Founders that are technical' },
            { percent: 82, label: 'Founders that are under 40' },
            { percent: 36, label: 'Founders that are repeat founders' },
          ],
          charts: ['RoleChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Team Size and Funding',
          description:
            'Startups are mostly bootstrapped or at early stages of funding. They are small teams, and usually less than a year old.',
          stats: [
            { percent: 91, label: 'Startups with 10 or fewer employees' },
            { percent: 66, label: 'Startups under one year old' },
            { percent: 6, label: 'Startups over 5 years old' },
          ],
          charts: ['FundingStageChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Where They’re Based',
          description:
            'Startups are building globally, but North America—especially San Francisco—remains overrepresented. Europe and Asia also feature prominently, with hubs like Toronto and NYC following close behind.',
          stats: [
            { percent: 25, label: 'Global startups based in Europe' },
            { percent: 19, label: 'North American startups based in San Francisco' },
            { percent: 9, label: 'North American startups based in New York City' },
          ],
          charts: ['LocationChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'What Startups are Building',
      shortTitle: 'Product and Market',
      description:
        'Startups are still experimenting. They’re building a diverse mix of software products, iterating quickly, and pursuing monetization selectively.',
      pullQuote: {
        quote:
          'We’re building an end-to-end system for wedding planners, all running as one SvelteKit / Supabase instance.',
        author: 'Waldemar Pross',
        authorPosition: 'CTO, Peach Perfect Weddings',
        authorAvatar: '/images/state-of-startups/quote-avatars/waldemar-k-120x120.jpg',
      },
      sections: [
        {
          title: 'Industries and Focus',
          description:
            'Under-30s gravitate toward AI-driven productivity, education, and social tools; areas where rapid iteration and novelty matter. Over-50s skew toward SaaS and consumer products, often bringing domain-specific experience into more established markets. Developer tools and infrastructure attract all age groups.',
          stats: [
            { percent: 82, label: 'Founders under 30 building in AI/ML' },
            { percent: 60, label: 'Startups building for end consumers' },
            { percent: 16, label: 'Startups building for developers' },
          ],
          charts: ['IndustryChart'],

          wordCloud: undefined,
          summarizedAnswer: {
            label: 'Problems startups are solving',
            answers: [
              'AI-powered productivity tools',
              'Agent workflows (internal or customer-facing)',
              'Career preparation and job search',
              'AI copilots for small businesses',
              'AI-enhanced education and tutoring',
              'Tools for solopreneurs and creators',
              'Developer experience and API abstraction',
              'Sales and outreach automation',
              'Healthcare access and diagnostics',
              'Financial planning and forecasting',
              'Sustainability and climate data',
              'Privacy and compliance automation',
              'Time management and prioritization',
              'Collaboration and communication',
              'Mental health and wellness tracking',
            ],
          },
          rankedAnswersPair: undefined,
        },
        {
          title: 'Traction and Early Growth',
          description:
            'One in five startups joined an accelerator. Y Combinator is the most common choice, especially in North America. Elsewhere, participation was more evenly distributed. Pivoting remains the norm, and less than half of startups are monetizing today.',
          stats: [
            { percent: 64, label: 'Startups that are pre-revenue' },
            { percent: 59, label: 'Startups that pivoted at least once' },
            { percent: 19, label: 'Startups that joined accelerators' },
          ],
          charts: ['AcceleratorParticipationChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'What’s in a Startup’s Tech Stack',
      shortTitle: 'Tech Stack',
      description:
        'The modern stack centers around open tools, modular infrastructure, and cautious spending.',
      pullQuote: {
        quote:
          'Cursor has been my favourite tool so far. It’s made my life easier by documenting code on my behalf.',
        author: 'Kevinton B',
        authorPosition: 'Engineer, FlutterFlow',
        authorAvatar: '/images/state-of-startups/quote-avatars/kevinton-b-120x120.jpg',
      },
      sections: [
        {
          title: 'Frameworks and Cloud Infra',
          description:
            'Supabase and Postgres dominate backend infrastructure. React and Node top frontend and backend respectively. Cursor, Claude, and VS Code lead AI-assisted development. Developer tools like GitHub, Stripe, and Postman round out the stack.',
          stats: [
            {
              percent: 83,
              label: 'Startups with a JavaScript framework in their frontend stack',
            },
            {
              percent: 62,
              label: 'Startups with Supabase in their cloud provider stack',
            },
            { percent: 60, label: 'Startups with Node.js in their backend stack' },
          ],
          charts: ['DatabasesChart'],

          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Dev Tools and Time Savers',
          description:
            'AI coding tools are indispensable for startups, and not just Cursor and Visual Studio Code. ‘Vibe coding’ tools like Loveable, Bolt.new, and v0 are also common.',
          stats: [
            { percent: 57, label: 'Startups that pay for OpenAI or ChatGPT' },
            { percent: 37, label: 'Startups that pay for Cursor' },
            { percent: 12, label: 'Startups that don’t pay for AI tools at all' },
          ],
          charts: ['AICodingToolsChart'],
          wordCloud: {
            label: 'Must-have developer tools by keyword frequency',
            words: [
              { text: 'cursor', count: 495 },
              { text: 'code', count: 396 },
              { text: 'supabase', count: 302 },
              { text: 'github', count: 272 },
              { text: 'vscode', count: 160 },
              { text: 'claude', count: 143 },
              { text: 'docker', count: 114 },
              { text: 'git', count: 113 },
              { text: 'studio', count: 112 },
              { text: 'chatgpt', count: 92 },
              { text: 'postman', count: 89 },
              { text: 'copilot', count: 88 },
              { text: 'lovable', count: 83 },
              { text: 'visual', count: 76 },
              { text: 'vercel', count: 71 },
              { text: 'react', count: 70 },
              { text: 'figma', count: 68 },
              { text: 'ide', count: 58 },
              { text: 'windsurf', count: 51 },
              { text: 'backend', count: 44 },
              { text: 'api', count: 40 },
              { text: 'google', count: 37 },
              { text: 'testing', count: 36 },
              { text: 'tailwind', count: 35 },
              { text: 'chrome', count: 34 },
              { text: 'typescript', count: 33 },
              { text: 'control', count: 33 },
              { text: 'python', count: 32 },
              { text: 'gemini', count: 30 },
            ],
          },
          summarizedAnswer: {
            label: 'Tools that startups wish existed',
            answers: [
              'Unified backend platform combining auth, edge, database, and queues',
              'AI agents with real memory and workflow context',
              'Local-first dev environments that sync to Supabase or Git',
              'AI copilots for sales, marketing, or documentation',
              'UI builders with direct-to-code export and stateful logic',
              'Better CLI-driven or REPL-native dev tools',
              'Automated integration layers between SaaS APIs',
              'Real-time dashboards that don’t require BI tools',
              'Supabase + Neon or PlanetScale seamless sync',
              'One-click staging, testing, and preview environments',
              'AI validators for production database migrations',
              'Visual version control and state inspection for app logic',
              'Time-aware tools (versioned environments, snapshots, undoable infra)',
              'GPT-based toolchain composers (meta-dev agents)',
              'Agent-like task runners for cron jobs, workflows, monitoring',
            ],
          },
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'How Startups are Integrating AI',
      shortTitle: 'AI and Agents',
      description:
        'AI is a core product capability, not an afterthought. Most teams are using models like OpenAI or Claude for real features, not just demos.',
      pullQuote: {
        quote:
          'AI is embedded in how we build and scale. From using Claude and Cursor in dev, to voice AI in product for smarter, faster recruiting (which is our business).',
        author: 'Jinal Jhaveri',
        authorPosition: 'Founder, Mismo',
        authorAvatar: '/images/state-of-startups/quote-avatars/jinal-j-120x120.jpg',
      },
      sections: [
        {
          title: 'In-Product AI Use',
          description:
            'Most startups are already integrating models like OpenAI or Claude, especially for semantic search, summarisation, and customer support. Half are building agents to automate real tasks, from onboarding flows to sales triage.',
          stats: [
            {
              percent: 81,
              label: 'Startups using AI in their product',
            },
            { percent: 50, label: 'Startups building agents within their product' },
            {
              percent: 34,
              label: 'Startups with agents automating customer support',
            },
          ],
          charts: ['AIModelsChart'],
          wordCloud: undefined,
          summarizedAnswer: {
            label: 'Most important AI use cases in product',
            answers: [
              'Summarization / content generation',
              'Recommendations / personalization',
              'Workflow / agent-based automation',
              'Search / semantic search',
              'Customer support automation',
            ],
          },
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'Where Startups Go to Learn',
      shortTitle: 'Influence',
      description: 'Online communities are the learning engine behind every early-stage startup.',
      pullQuote: undefined,
      sections: [
        {
          title: 'Online Communities',
          description:
            'There is a healthy diaspora of important online communities. That said, many people just lurk; few actively contribute to the discussion.',
          stats: [
            { percent: 55, label: 'Engineers using LinkedIn regularly' },
            { percent: 45, label: 'Founders using X (Twitter) regularly' },
            { percent: 7, label: 'Respondents that don’t use social media at all' },
          ],
          charts: ['RegularSocialMediaUseChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Inspiration Stack',
          description:
            'Founders follow newsletters like TLDR and Lenny’s, and they listen to podcasts like The Diary of a CEO and Founders. Tool discovery happens quite often via YouTube or GitHub. Physical event participation remains low.',
          stats: [
            { percent: 47, label: 'Respondents that listen to industry podcasts' },
            {
              percent: 20,
              label: 'Respondents that subscribe to industry newsletters',
            },
            { percent: 12, label: 'Founders that have built a developer community' },
          ],
          charts: ['NewIdeasChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: [
            {
              label: 'Top podcasts listened to',
              answers: ['The Diary of a CEO', 'Founders', 'My First Million'],
            },
            {
              label: 'Top newsletters subscribed to',
              answers: ['TLDR', 'Lenny’s Newsletter', 'The Pragmatic Engineer'],
            },
          ],
        },
      ],
    },
    {
      title: 'How Startups are Finding Customers',
      shortTitle: 'Go-To-Market',
      description:
        'Startups start selling through their networks and dev communities. Only when they grow do they layer in more structured growth via CRMs and sales.',
      pullQuote: undefined,
      sections: [
        {
          title: 'Initial Customers',
          description:
            'Founders earn their earliest customers through networks, communities, and inbound content. Paid acquisition rarely works early on, nor does performance marketing.',
          stats: [
            {
              percent: 58,
              label:
                'Startups that get their first customers via personal and professional networks',
            },
            { percent: 48, label: 'Startups that engage users through social media' },
            { percent: 39, label: 'Startups that are still experimenting with pricing models' },
          ],
          charts: ['InitialPayingCustomersChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Founder-led Sales',
          description:
            'Sales is still founder-led at most startups. Dedicated sales hires usually don’t arrive until after 10+ employees. Many still use Google Sheets or nothing at all to track sales activity.',
          stats: [
            {
              percent: 75,
              label: 'Startups with their founders still directly responsible for sales',
            },
            {
              percent: 58,
              label: 'Startups that got their initial customers from personal networks',
            },
            { percent: 7, label: 'Startups that have a dedicated sales team' },
          ],
          charts: ['SalesToolsChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'Biggest Challenges for Startups',
      shortTitle: 'Outlook',
      description:
        'Startups remain optimistic about the future but are weighed down by technical complexity, customer acquisition hurdles, and a wish list of tools that still don’t exist.',
      pullQuote: {
        quote:
          'There’s plenty of uncertainty, but we’re building something that feels deeply worth it. That gives us a lot of confidence in the long run.',
        author: 'Robert Wolski',
        authorPosition: 'Founder, Keepsake',
        authorAvatar: '/images/state-of-startups/quote-avatars/robert-w-120x120.jpg',
      },
      sections: [
        {
          title: 'The Road Ahead',
          description:
            'The hardest problems are still the oldest ones: customer acquisition, product-market fit, and complexity. Startups cite AI-assisted coding and backend services as major time-savers, but many are still missing critical tools they want. Especially around onboarding, dashboards, and agents.',
          stats: [
            {
              percent: 82,
              label: 'Founders that evaluate tools via hands-on experience',
            },
            {
              percent: 45,
              label:
                'Startups with over 250 employees whose biggest challenge is getting customers',
            },
            {
              percent: 4,
              label: 'Startups with under 10 employees whose biggest challenge is hiring',
            },
          ],
          charts: ['BiggestChallengeChart'],

          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Worldview and Optimism',
          description:
            'Most startup founders remain upbeat about the future, but that confidence isn’t shared equally. Engineers and marketers show more caution.',

          stats: [
            { percent: 61, label: 'Founders that are optimistic' },
            { percent: 50, label: 'Engineers that are optimistic' },
            { percent: 42, label: 'Other roles that are optimistic' },
          ],
          charts: ['WorldOutlookChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
  ],
  participantsList: [
    {
      company: 'Wasp',
      url: 'https://wasp.sh/',
    },
    {
      company: 'Greptile',
      url: 'https://www.greptile.com/',
    },
    {
      company: 'Zaymo',
      url: 'https://zaymo.com',
    },
    {
      company: 'Jazzberry',
      url: 'https://jazzberry.ai',
    },
    {
      company: 'Shor',
      url: 'https://tryshor.com',
    },

    {
      company: 'Mono',
      url: 'https://www.mono.la',
    },
    {
      company: 'Affl.ai',
      url: 'https://www.affil.ai',
    },
    {
      company: 'Docsum',
      url: 'https://www.docsum.ai/',
    },
    {
      company: 'Hazel',
      url: 'https://hazelai.com/',
    },
    {
      company: 'Rivet',
      url: 'https://rivet.gg/',
    },
    {
      company: 'Trieve',
      url: 'https://trieve.ai/',
    },
    {
      company: 'Artificial Societies',
      url: 'https://societies.io/',
    },
    {
      company: 'Gauge',
      url: 'https://withgauge.com/',
    },
    {
      company: 'Stardex',
      url: 'https://www.stardex.com/',
    },
    {
      company: 'TrueClaim',
      url: 'https://www.trytrueclaim.com/',
    },
    {
      company: 'Autosana',
      url: 'https://autosana.ai/',
    },
    {
      company: 'Vespper',
      url: 'https://vespper.com/',
    },
    {
      company: 'Curo',
      url: 'https://www.curocharging.com/',
    },
    {
      company: 'Kombo',
      url: 'https://kombo.dev/',
    },
    {
      company: 'Candle',
      url: 'https://www.trycandle.app/',
    },
    {
      company: 'Trainloop',
      url: 'http://trainloop.ai/',
    },
    {
      company: 'Replit',
      url: 'https://replit.com/',
    },
    {
      company: 'Roe AI',
      url: 'https://getroe.ai/',
    },
    {
      company: 'Kestral',
      url: 'https://kestral.team/',
    },
    {
      company: 'Revyl',
      url: 'https://www.revyl.ai/',
    },
    {
      company: 'Arva AI',
      url: 'https://www.arva.ai/',
    },
    {
      company: 'Posthog',
      url: 'https://www.posthog.com',
    },
    {
      company: 'Rootly',
      url: 'https://rootly.com/',
    },
    {
      company: 'Throxy',
      url: 'https://throxy.com/',
    },
    {
      company: 'Zapi',
      url: 'https://heyzapi.com/',
    },
    {
      company: 'Leaping AI',
      url: 'https://www.leapingai.com/',
    },
    {
      company: 'WarpBuild',
      url: 'https://www.warpbuild.com/',
    },
    {
      company: 'Domu',
      url: 'https://www.domu.ai/',
    },
    {
      company: 'Bilanc',
      url: 'https://www.bilanc.co/',
    },
    {
      company: 'Miru',
      url: 'https://www.miruml.com/',
    },
    {
      company: 'Repaint',
      url: 'https://repaint.com/',
    },
    {
      company: 'Cubic',
      url: 'https://cubic.dev/',
    },
    {
      company: 'CTGT',
      url: 'https://www.ctgt.ai/',
    },
    {
      company: 'Integrated Reasoning',
      url: 'https://integrated-reasoning.com/',
    },
    {
      company: 'Datafruit',
      url: 'https://datafruit.dev/',
    },
    {
      company: 'mcp-use',
      url: 'https://mcp-use.com/',
    },
    {
      company: 'Weave',
      url: 'http://getweave.com/',
    },
    {
      company: 'Palmier',
      url: 'https://www.palmier.io/',
    },
    {
      company: 'Rainmaker',
      url: 'http://www.rainmaker.nyc/',
    },
    {
      company: 'Wasmer',
      url: 'https://wasmer.io/',
    },
    {
      company: 'Artie',
      url: 'https://www.artie.com/',
    },
    {
      company: 'Lumari',
      url: 'https://www.lumari.io/',
    },
    {
      company: 'Hitpay',
      url: 'https://www.hitpayapp.com/',
    },
    {
      company: 'Tempo',
      url: 'https://www.tempo.new/',
    },
    {
      company: 'SalesPatriot',
      url: 'https://www.salespatriot.com/',
    },
    {
      company: 'Surge',
      url: 'https://surge.app/',
    },
    {
      company: 'Linum',
      url: 'https://www.linum.ai/',
    },
    {
      company: 'Rebill',
      url: 'https://www.rebill.com/',
    },
    {
      company: 'Careswift',
      url: 'https://www.careswift.com/',
    },
    {
      company: 'Autumn',
      url: 'https://useautumn.com/',
    },
    {
      company: 'Rollstack',
      url: 'https://www.rollstack.com/',
    },
    {
      company: 'OpenNote',
      url: 'https://opennote.com/',
    },
    {
      company: 'Coverage Cat',
      url: 'https://www.coveragecat.com/',
    },
    {
      company: 'Flair Labs',
      url: 'https://www.flairlabs.ai/',
    },
    {
      company: 'Percival',
      url: 'https://www.percivaltech.com/',
    },
    {
      company: 'Morphik',
      url: 'https://morphik.ai/',
    },
    {
      company: 'DrDroid',
      url: 'https://drdroid.io/',
    },
    {
      company: 'Nautilus',
      url: 'https://nautilus.co/',
    },
  ],
}

export default stateOfStartupsData
