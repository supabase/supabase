const stateOfStartupsData = (isMobile?: boolean) => ({
  metaTitle: 'State of Startups 2025',
  metaDescription:
    'The latest trends among builders in tech stacks, AI usage, problem domains, and more.',
  metaImage: '/images/state-of-startups/2025/state-of-startups-og.png',
  docsUrl: '',
  heroSection: {
    title: 'State of Startups 2025',
    subheader: (
      <>
        We surveyed over 1,800 startup founders and builders to uncover What’s powering modern
        startups: their stacks, their go-to-market motion, and their approach to AI.
        <br />
        This report is built for builders.
      </>
    ),
    className: '[&_h1]:max-w-2xl',
  },
  pageChapters: [
    {
      title: 'Who’s Building Startups',
      description:
        "Today's startup ecosystem is dominated by young, technical builders shipping fast with lean teams. They've done this before.",
      sections: [
        {
          title: 'Roles and Experience',
          description:
            'Most builders are young, technical founders. Many are on their second or third company.',
          stats: [
            { number: 83, unit: '%', label: 'Technical founders' },
            { number: 82, unit: '%', label: 'Under age 40' },
            { number: 33, unit: '%', label: 'Repeat founders' },
          ],
          charts: ['RoleChart'],
          pullQuote: {
            quote:
              "We’re a two-person team, both technical. It's not our first rodeo, and that experience helped us move way faster this time.",
            author: 'John Doe',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Team Size and Funding',
          description:
            'Startups are mostly bootstrapped or at early stages of funding. They are small teams, and usually less than a year old.',
          stats: [
            { number: 91, unit: '%', label: 'Under 10 employees' },
            { number: 65, unit: '%', label: 'Under one year old' },
            { number: 6, unit: '%', label: 'Over 5 years old' },
          ],
          charts: ['FundingStageChart'],
          pullQuote: {
            quote:
              'We’re bootstrapped and under a year old… just three of us wearing every hat imaginable.',
            author: 'Jane Smith',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Where They’re Based',
          description:
            'Startups are building globally, but North America—especially San Francisco—remains overrepresented. Europe and Asia also feature prominently, with hubs like Toronto and NYC following close behind.',
          stats: [
            { number: 17, unit: '%', label: 'Global startups in Europe' },
            { number: 19, unit: '%', label: 'North American startups in SF' },
            { number: 9, unit: '%', label: 'North American startups in NYC' },
          ],
          charts: ['HeadquartersChart'],
          pullQuote: {
            quote:
              'We’re building from Toronto, but most of our early users are still in San Francisco.',
            author: 'Alex Chen',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'What Startups are Building',
      description:
        'Startups are still experimenting. They’re building a diverse mix of software products, iterating quickly, and pursuing monetization selectively.',
      sections: [
        {
          title: 'Industries and Focus',
          description:
            'Under-30s gravitate toward AI-driven productivity, education, and social tools; areas where rapid iteration and novelty matter. Over-50s skew toward SaaS and consumer products, often bringing domain-specific experience into more established markets. Developer tools and infrastructure attract all age groups.',
          stats: [
            { number: 33, unit: '%', label: 'Building for developers' },
            { number: 24, unit: '%', label: 'Targeting consumers' },
            { number: 38, unit: '%', label: 'Founders under 30 building in AI/ML' },
          ],
          charts: ['IndustryChart'],
          pullQuote: {
            quote:
              "We’re experimenting in edtech for underserved regions. It's early, but we’re learning fast.",
            author: 'Sarah Johnson',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
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
            { number: 18, unit: '%', label: 'Joined accelerators' },
            { number: 59, unit: '%', label: 'Pivoted at least once' },
            { number: 58, unit: '%', label: 'Pre-revenue' },
          ],
          charts: ['AcceleratorParticipationChart'],
          pullQuote: {
            quote:
              'We joined an accelerator outside the US, which gave us credibility but we still had to pivot twice.',
            author: 'Mike Rodriguez',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'What’s in a Startup’s Tech Stack',
      description:
        'The modern stack centers around open tools, modular infrastructure, and cautious spending.',
      sections: [
        {
          title: 'Frameworks and Cloud Infra',
          description:
            'Supabase and Postgres dominate backend infra. React and Node top the frontend and backend respectively. Cursor, Claude, and VS Code lead AI-assisted development. Developer tools like GitHub, Stripe, and Postman round out the stack.',
          stats: [
            { number: 75, unit: '%', label: 'JavaScript framework in frontend stack' },
            { number: 61, unit: '%', label: 'Node.js in backend stack' },
            { number: 62, unit: '%', label: 'Supabase as cloud provider stack' },
            { number: 30, unit: '%', label: 'Sentry in observability stack' },
            { number: 75, unit: '%', label: 'Supabase for databases' },
          ],
          charts: ['DatabasesChart'],
          pullQuote: {
            quote:
              'Supabase gave us everything we needed out of the box. We hooked it up in a weekend and haven’t looked back.',
            author: 'David Kim',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Dev Tools and Time Savers',
          description:
            'AI coding tools are indispensable for startups, and not just Cursor and Visual Studio Code. ‘Vibe coding’ tools like Loveable, Bolt.new, and v0 are also common.',
          stats: [
            { number: 57, unit: '%', label: 'Pay for OpenAI or ChatGPT' },
            { number: 27, unit: '%', label: 'Pay for Claude' },
            { number: 37, unit: '%', label: 'Pay for Cursor' },
            { number: 5, unit: '%', label: 'Don’t pay for AI tools' },
          ],
          charts: ['AICodingToolsChart'],
          pullQuote: {
            quote:
              'I spend less time fighting code thanks to Cursor and Claude. It’s like pair programming without the scheduling.',
            author: 'Lisa Wang',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
          wordCloud: {
            label: 'Must-have developer tools',
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
      description:
        'AI is a core product capability, not an afterthought. Most teams are using models like OpenAI or Claude for real features, not just demos.',
      sections: [
        {
          title: 'In-Product AI Use',
          description:
            'AI is increasingly embedded in product workflows, not bolted on. Most startups are already integrating models like OpenAI or Claude, especially for semantic search, summarisation, and customer support. Half are building agents to automate real tasks, from onboarding flows to sales triage.',
          stats: [
            { number: 74, unit: '%', label: 'Use or plan to use AI' },
            { number: 50, unit: '%', label: 'Building agents' },
          ],
          charts: ['AIModelsChart'],
          pullQuote: {
            quote:
              'AI is baked into the core. Semantic search and summarisation are what make the product usable.',
            author: 'Tom Anderson',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
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
      description: 'Online communities are the learning engine behind every early-stage startup.',
      sections: [
        {
          title: 'Online Communities',
          description:
            'There is a healthy diaspora of important online communities used by respondents. That said, many are just lurking; few actively contribute to the discussion.',
          stats: [
            { number: 58, unit: '%', label: 'Engineers using LinkedIn regularly' },
            { number: 46, unit: '%', label: 'Founders using X (Twitter) regularly' },
            { number: 20, unit: '%', label: 'Regularly post content' },
            { number: 7, unit: '%', label: 'Don’t use social media' },
          ],
          charts: ['RegularSocialMediaUseChart'],
          pullQuote: {
            quote:
              'I mostly lurk, but Twitter and Discord have been where I find the best tools and smartest minds.',
            author: 'Emma Davis',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Inspiration Stack',
          description:
            'Founders follow newsletters like TLDR and Lenny’s, listen to The Diary of a CEO and Founders Podcasts. Tool discovery happens quite often via YouTube or GitHub. Physical event participation remains low.',
          stats: [
            { number: 53, unit: '%', label: 'Don’t attend large events' },
            { number: 45, unit: '%', label: 'Listen to podcasts' },
            { number: 20, unit: '%', label: 'Pay for a newsletter' },
            { number: 36, unit: '%', label: 'Built a dev community' },
          ],
          charts: ['NewIdeasChart'],
          pullQuote: {
            quote:
              'I discovered most of our stack via GitHub and indie YouTubers showing their setups.',
            author: 'Ryan Chen',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
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
      description:
        'Startups start selling through their networks and dev communities. Only when they grow do they layer in more structured growth via CRMs and sales.',
      sections: [
        {
          title: 'Initial Customers',
          description:
            'Founders earn their earliest customers through networks, communities, and inbound content. Not performance marketing. Paid acquisition rarely works early on.',
          stats: [
            { number: 57, unit: '%', label: 'Word of mouth as their best organic channel' },
            { number: 32, unit: '%', label: 'No success with paid channels' },
            { number: 47, unit: '%', label: 'Engage users through social media' },
            { number: 39, unit: '%', label: 'Still experimenting with pricing' },
            {
              number: 36,
              unit: '%',
              label: 'Built or building a dev community around their product',
            },
          ],
          charts: ['InitialPayingCustomersChart'],
          pullQuote: {
            quote:
              'Our first 10 customers came from one tweet. No landing page, no funnel. Just good timing and network.',
            author: 'Sophie Lee',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Founder-led Sales',
          description:
            'Sales is still founder-led at most startups. Dedicated sales hires usually don’t arrive until after 10+ employees. Many still use Google Sheets or nothing at all to track sales activity.',
          stats: [
            { number: 75, unit: '%', label: 'Founder still responsible for sales' },
            { number: 13, unit: '%', label: 'Dedicated sales team' },
            { number: 62, unit: '%', label: 'Yet to start paid customer acquisition' },
            { number: 18, unit: '%', label: 'Initial customers from personal network' },
          ],
          charts: ['SalesToolsChart'],
          pullQuote: {
            quote:
              "I'm still doing sales calls manually. No CRM yet. It's scrappy, but it keeps me close to the customer.",
            author: 'Marcus Johnson',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'Biggest Challenges for Startups',
      description:
        'Startups remain optimistic about the future but are weighed down by technical complexity, customer acquisition hurdles, and a wish list of tools that still don’t exist.',
      sections: [
        {
          title: 'The Road Ahead',
          description:
            'The hardest problems are still the oldest ones: customer acquisition, product-market fit, and complexity. Startups cite AI-assisted coding and backend services as major time-savers, but many are still missing critical tools they want. Especially around onboarding, dashboards, and agents.',
          stats: [
            { number: 29, unit: '%', label: 'Saved the most time via AI coding assistance' },
            { number: 15, unit: '%', label: 'Wish for better AI agents or automation tools' },
            {
              number: 14,
              unit: '%',
              label: 'Saved the most time via BaaS platforms like Supabase',
            },
            { number: 81, unit: '%', label: 'Evaluate tools via hands-on experience' },
          ],
          charts: ['BiggestChallengeChart'],
          pullQuote: {
            quote:
              'Growth is still our hardest problem. We’ve got a good product, but breaking through the noise is brutal.',
            author: 'Nina Patel',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
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
            { number: 32, unit: '%', label: 'Operations leads are optimistic' },
            { number: 42, unit: '%', label: 'Other roles that are optimistic' },
          ],
          charts: ['WorldOutlookChart'],
          pullQuote: {
            quote:
              "I'm cautiously optimistic. There's more uncertainty, but also more tools and leverage than ever.",
            author: 'Carlos Rodriguez',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
  ],
})

export default stateOfStartupsData
