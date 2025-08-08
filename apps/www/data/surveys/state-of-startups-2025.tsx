const stateOfStartupsData = (isMobile?: boolean) => ({
  metaTitle: 'State of Startups 2025',
  metaDescription:
    'The latest trends among builders in tech stacks, AI usage, problem domains, and more.',
  metaImage: '/images/state-of-startups/2025/state-of-startups-og.png',
  docsUrl: '',
  heroSection: {
    title: 'State of Startups 2025',
    subheader:
      'We surveyed over 1,800 startup founders and builders to uncover What’s powering modern startups: their stacks, their go-to-market motion, and their approach to AI.',
    cta: 'This report is built for builders.',
    className: '[&_h1]:max-w-2xl',
  },
  pageChapters: [
    {
      title: 'Who’s Building Startups',
      shortTitle: 'Founder and Company',
      description:
        "Today's startup ecosystem is dominated by young, technical builders shipping fast with lean teams. They've done this before.",
      pullQuote: {
        quote:
          "We’re a two-person team, both technical. It's not our first rodeo, and that experience helped us move way faster this time.",
        author: 'John Doe',
        authorPosition: 'Founder',
        authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
      },
      sections: [
        {
          title: 'Roles and Experience',
          description:
            'Most builders are young, technical founders. Many are on their second or third company.',
          stats: [
            { number: 83, unit: '%', label: 'Founders that are technical' },
            { number: 82, unit: '%', label: 'Founders under age 40' },
            { number: 33, unit: '%', label: 'Founders that are repeat founders' },
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
            { number: 91, unit: '%', label: 'Startups with less than 10 employees' },
            { number: 65, unit: '%', label: 'Startups under one year old' },
            { number: 6, unit: '%', label: 'Startups over 5 years old' },
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
            { number: 17, unit: '%', label: 'Global startups based in Europe' },
            { number: 19, unit: '%', label: 'North American startups based in San Francisco' },
            { number: 9, unit: '%', label: 'North American startups based in New York City' },
          ],
          charts: ['HeadquartersChart'],
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
          'We’re experimenting in edtech for underserved regions. It’s early, but we’re learning fast.',
        author: 'Sarah Johnson',
        authorPosition: 'Founder',
        authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
      },
      sections: [
        {
          title: 'Industries and Focus',
          description:
            'Under-30s gravitate toward AI-driven productivity, education, and social tools; areas where rapid iteration and novelty matter. Over-50s skew toward SaaS and consumer products, often bringing domain-specific experience into more established markets. Developer tools and infrastructure attract all age groups.',
          stats: [
            { number: 38, unit: '%', label: 'Founders under 30 building in AI/ML' },
            { number: 33, unit: '%', label: 'Startups building for developers' },
            { number: 24, unit: '%', label: 'Startups targeting consumers' },
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
            { number: 59, unit: '%', label: 'Startups that have pivoted at least once' },
            { number: 58, unit: '%', label: 'Startups that are pre-revenue' },
            { number: 18, unit: '%', label: 'Startups that have joined accelerators' },
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
          'We’re experimenting in edtech for underserved regions. It’s early, but we’re learning fast.',
        author: 'Sarah Johnson',
        authorPosition: 'Founder',
        authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
      },
      sections: [
        {
          title: 'Frameworks and Cloud Infra',
          description:
            'Supabase and Postgres dominate backend infra. React and Node top the frontend and backend respectively. Cursor, Claude, and VS Code lead AI-assisted development. Developer tools like GitHub, Stripe, and Postman round out the stack.',
          stats: [
            {
              number: 75,
              unit: '%',
              label: 'Startups with a JavaScript framework in their frontend stack',
            },
            {
              number: 62,
              unit: '%',
              label: 'Startups with Supabase in their cloud provider stack',
            },
            { number: 61, unit: '%', label: 'Startups with Node.js in their backend stack' },
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
            { number: 57, unit: '%', label: 'Startups that pay for OpenAI or ChatGPT' },
            { number: 37, unit: '%', label: 'Startups that pay for Cursor' },
            { number: 5, unit: '%', label: 'Startups that don’t pay for AI tools at all' },
          ],
          charts: ['AICodingToolsChart'],
          wordCloud: {
            label: 'What are your must-have developer tools?',
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
          'AI is baked into the core. Semantic search and summarisation are what make the product usable.',
        author: 'Tom Anderson',
        authorPosition: 'Founder',
        authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
      },
      sections: [
        {
          title: 'In-Product AI Use',
          description:
            'AI is increasingly embedded in product workflows, not bolted on. Most startups are already integrating models like OpenAI or Claude, especially for semantic search, summarisation, and customer support. Half are building agents to automate real tasks, from onboarding flows to sales triage.',
          stats: [
            {
              number: 74,
              unit: '%',
              label: 'Startups using AI in their product',
            },
            { number: 50, unit: '%', label: 'Startups building agents within their product' },
            {
              number: 34,
              unit: '%',
              label: 'Startups adding natural language interfaces to their product',
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
      pullQuote: {
        quote:
          'I mostly lurk, but Twitter and Discord have been where I find the best tools and smartest minds.',
        author: 'Emma Davis',
        authorPosition: 'Founder',
        authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
      },
      sections: [
        {
          title: 'Online Communities',
          description:
            'There is a healthy diaspora of important online communities used by respondents. That said, many are just lurking; few actively contribute to the discussion.',
          stats: [
            { number: 58, unit: '%', label: 'Engineers using LinkedIn regularly' },
            { number: 46, unit: '%', label: 'Founders using X (Twitter) regularly' },
            { number: 7, unit: '%', label: 'Respondents that don’t use social media at all' },
          ],
          charts: ['RegularSocialMediaUseChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Inspiration Stack',
          description:
            'Founders follow newsletters like TLDR and Lenny’s, listen to The Diary of a CEO and Founders Podcasts. Tool discovery happens quite often via YouTube or GitHub. Physical event participation remains low.',
          stats: [
            { number: 45, unit: '%', label: 'Respondents that listen to industry podcasts' },
            { number: 36, unit: '%', label: 'Respondents that have built a developer community' },
            {
              number: 20,
              unit: '%',
              label: 'Respondents that pay for at least one industry newsletter',
            },
          ],
          charts: ['NewIdeasChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: [
            {
              label: 'Top podcasts listened to',
              answers: ['The Diary of a CEO', 'Founders Podcasts', 'Lightcone'],
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
      pullQuote: {
        quote:
          'Our first 10 customers came from one tweet. No landing page, no funnel. Just good timing and network.',
        author: 'Sophie Lee',
        authorPosition: 'Founder',
        authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
      },
      sections: [
        {
          title: 'Initial Customers',
          description:
            'Founders earn their earliest customers through networks, communities, and inbound content. Not performance marketing. Paid acquisition rarely works early on.',
          stats: [
            {
              number: 57,
              unit: '%',
              label: 'Startups that find their initial customers through word of mouth',
            },
            { number: 47, unit: '%', label: 'Startups that engage users through social media' },
            { number: 39, unit: '%', label: 'Startups that are still experimenting with pricing' },
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
              number: 75,
              unit: '%',
              label: 'Startups with their founders still directly responsible for sales',
            },
            {
              number: 18,
              unit: '%',
              label: 'Startups that got their initial customers from personal networks',
            },
            { number: 13, unit: '%', label: 'Startups that have a dedicated sales team' },
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
      sections: [
        {
          title: 'The Road Ahead',
          description:
            'The hardest problems are still the oldest ones: customer acquisition, product-market fit, and complexity. Startups cite AI-assisted coding and backend services as major time-savers, but many are still missing critical tools they want. Especially around onboarding, dashboards, and agents.',
          stats: [
            {
              number: 81,
              unit: '%',
              label: 'Respondents that evaluate potential tools via hands-on experience',
            },
            {
              number: 29,
              unit: '%',
              label: 'Respondents that saved the most time via AI coding assistance',
            },
            {
              number: 14,
              unit: '%',
              label: 'Respondents that saved the most time via BaaS platforms like Supabase',
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
            "Most startup founders remain upbeat about the future, but that confidence isn't shared equally. Engineers and marketers show more caution.",
          stats: [
            { number: 61, unit: '%', label: 'Founders that are optimistic' },
            { number: 32, unit: '%', label: 'Operations leads that are optimistic' },
            { number: 42, unit: '%', label: 'Other roles that are optimistic' },
          ],
          charts: ['WorldOutlookChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
  ],
})

export default stateOfStartupsData
