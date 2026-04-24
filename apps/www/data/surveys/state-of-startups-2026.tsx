// Narrative sourced from the State of Startups 2026 mid-point results
// (supabase/state-of-startups repo, app/fancy/survey-data.ts). Explicit
// percentages below are quoted directly from that narrative; a handful of
// stats for sections without an explicit number in the prose are carried
// over from 2025 and should be refreshed against responses_2026 before
// launch.

const stateOfStartupsData = {
  metaTitle: 'State of Startups 2026 | Supabase',
  metaDescription:
    'The latest trends among builders in tech stacks, AI usage, problem domains, and more.',
  metaImage: '/images/state-of-startups/2026/state-of-startups-og.png',
  heroSection: {
    title: 'State of Startups 2026',
    subheader:
      'We surveyed over 2,000 startup founders and builders to uncover what’s powering modern startups: their stacks, their go-to-market motion, and their approach to AI.',
    cta: 'The ground moved between 2025 and 2026. This report shows where.',
  },
  pageChapters: [
    {
      title: 'Who’s Building Startups',
      shortTitle: 'Founder and Company',
      description:
        'The respondent base got older, more European, more solo, and less self-described-technical. Experienced operators with AI in their pocket are starting companies again.',
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
            'Solo founders were already the largest group in 2025 at 52%. In 2026 they are 61% of respondents, up 8 points. Technical-founder share dropped from 82% to 78%, and every age band above 40 grew by a statistically significant margin.',
          stats: [
            { percent: 61, label: 'Startups with a single founder' },
            { percent: 22, label: 'Startups founded by non-technical founders' },
            { percent: 26, label: 'Founders aged 40 or older' },
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
            'The top metros are still the top metros. But AI has flattened the development gap everywhere else. Europe grew 4pp; Africa grew 2pp. Startups are setting up across Toronto, Chicago, Denver, Austin, across Europe, Asia, and Africa. The playbook no longer requires a specific zip code.',
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
      title: 'One Company Swept the Tooling Layer',
      shortTitle: 'Anthropic generation',
      description:
        'Claude Code became the most-named must-have dev tool. Claude paid subscriptions nearly doubled. Anthropic overtook OpenAI on the model-provider question. The Anthropic Agent SDK leads SDK adoption. This is the largest single-year re-ordering in any category in the survey.',
      pullQuote: undefined,
      sections: [
        {
          title: 'Must-have Dev Tools',
          description:
            'Claude Code went from 1% in 2025 to 62% in 2026 (+61pp). Cursor dropped 19 points. v0, Bolt, and Windsurf each lost 6–9 points. VS Code held flat. Antigravity appeared for the first time and took the 4th spot in its debut year.',
          stats: [
            { percent: 62, label: 'Startups that list Claude Code as a must-have' },
            { percent: 37, label: 'Startups that list Cursor as a must-have' },
            { percent: 12, label: 'Startups that don’t pay for AI tools at all' },
          ],
          charts: ['AICodingToolsChart'],
          wordCloud: {
            label: 'Must-have developer tools by keyword frequency',
            words: [
              { text: 'claude', count: 512 },
              { text: 'code', count: 420 },
              { text: 'cursor', count: 315 },
              { text: 'supabase', count: 302 },
              { text: 'github', count: 272 },
              { text: 'vscode', count: 160 },
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
              { text: 'gemini', count: 39 },
              { text: 'google', count: 37 },
              { text: 'testing', count: 36 },
              { text: 'tailwind', count: 35 },
              { text: 'chrome', count: 34 },
              { text: 'typescript', count: 33 },
              { text: 'control', count: 33 },
              { text: 'python', count: 32 },
              { text: 'antigravity', count: 28 },
            ],
          },
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Paid AI Subscriptions',
          description:
            'Paid Claude subscriptions jumped from 28% to 59% of respondents. Paid OpenAI dropped from 57% to 39%. Gemini entered the list at 27%. The money is moving faster than any lagging indicator could capture.',
          stats: [
            { percent: 59, label: 'Startups that pay for Claude' },
            { percent: 39, label: 'Startups that pay for OpenAI or ChatGPT' },
            { percent: 27, label: 'Startups that pay for Gemini' },
          ],
          charts: ['PaidSubscriptionsChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Model Providers',
          description:
            'Anthropic/Claude climbed from 38% to 64%; OpenAI fell from 69% to 51%. Gemini entered at 43%. Hugging Face and custom models lost material share, suggesting fewer teams are running their own inference.',
          stats: [
            { percent: 64, label: 'Startups using Anthropic models' },
            { percent: 51, label: 'Startups using OpenAI models' },
            { percent: 43, label: 'Startups using Gemini' },
          ],
          charts: ['AIModelsChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'AI-generated Code is the Median Experience',
      shortTitle: 'AI-written code',
      description:
        '62% of startups have more than half their codebase written by AI. 41% are at 76–100%. Only 2% are at zero. Older founders use it more heavily than younger ones, and non-technical founders more than technical ones.',
      pullQuote: {
        quote:
          'Cursor has been my favourite tool so far. It’s made my life easier by documenting code on my behalf.',
        author: 'Kevinton B',
        authorPosition: 'Engineer, FlutterFlow',
        authorAvatar: '/images/state-of-startups/quote-avatars/kevinton-b-120x120.jpg',
      },
      sections: [
        {
          title: 'Share of Codebase',
          description:
            'This question was new in 2026. Among non-technical founders, the 76-to-100% share rises to 54%. Among 50-to-59-year-olds it rises to 80%. AI code generation is a median practice, not a fringe one.',
          stats: [
            { percent: 41, label: 'Startups with 76–100% of their codebase AI-generated' },
            { percent: 62, label: 'Startups with a majority AI-generated codebase' },
            { percent: 2, label: 'Startups with zero AI-generated code' },
          ],
          charts: ['AICodebasePercentChart'],
          wordCloud: undefined,
          summarizedAnswer: {
            label: 'How AI is changing the way startups build',
            answers: [
              'Menial coding tasks handed off entirely',
              'Founders focused on design and architecture',
              'Non-technical founders shipping production code',
              'Docs and tests written alongside features',
              'Faster iteration on product-market fit',
              'Smaller teams doing the work of larger ones',
              'Prototypes in hours instead of weeks',
              'Refactors and migrations that used to be deferred',
              'More confidence picking up unfamiliar stacks',
              'Solo founders competing with funded teams',
            ],
          },
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'The Stack Consolidated',
      shortTitle: 'Tech Stack',
      description:
        'Supabase gained ground as a primary database, landed strong in its first year as an auth provider, and Postgres became the default analytics store. AWS, GCP, and Azure all lost share to Supabase, Vercel, and Cloudflare. A quieter story: the frontend layer is diversifying fast.',
      pullQuote: {
        quote:
          'We’re building an end-to-end system for wedding planners, all running as one SvelteKit / Supabase instance.',
        author: 'Waldemar Pross',
        authorPosition: 'CTO, Peach Perfect Weddings',
        authorAvatar: '/images/state-of-startups/quote-avatars/waldemar-k-120x120.jpg',
      },
      sections: [
        {
          title: 'Primary Database',
          description:
            'Supabase went from 76% to 82%. Every legacy NoSQL option lost share: MongoDB dropped 5pp, MySQL 3pp, Firebase 2pp. Neon, DynamoDB, and Convex appeared as options for the first time and took small but measurable shares.',
          stats: [
            { percent: 82, label: 'Startups using Supabase as a database' },
            { percent: 60, label: 'Startups with Node.js in their backend stack' },
            { percent: 83, label: 'Startups with a JavaScript framework in their frontend stack' },
          ],
          charts: ['DatabasesChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Auth and Identity',
          description:
            'This question was new in 2026, so there is no prior baseline. Three in four respondents who answered the auth question picked Supabase Auth. The firm migration floor is the ~25% who picked no Supabase option at all.',
          stats: [
            { percent: 72, label: 'Startups using Supabase Auth' },
            { percent: 15, label: 'Startups using Auth0' },
            { percent: 14, label: 'Startups using NextAuth or Auth.js' },
          ],
          charts: ['AuthProviderChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'Agents Shipped. The Operator Tools Did Not.',
      shortTitle: 'AI and Agents',
      description:
        'Half of respondents are building agents. Multi-agent systems are in production at a quarter of them. MCP adoption crossed 57% in its first year. But the operational layer beneath all of this is missing: most teams do not monitor AI workloads, most have no formal prompt management, and one in three has no eval process.',
      pullQuote: {
        quote:
          'AI is embedded in how we build and scale. From using Claude and Cursor in dev, to voice AI in product for smarter, faster recruiting (which is our business).',
        author: 'Jinal Jhaveri',
        authorPosition: 'Founder, Mismo',
        authorAvatar: '/images/state-of-startups/quote-avatars/jinal-j-120x120.jpg',
      },
      sections: [
        {
          title: 'Who’s Building Agents',
          description:
            'Agent-building share is statistically flat year over year. The “not sure” cohort shrank, which means undecided builders are making up their minds and shipping. What they automate has shifted: workflow and data analysis climbed; customer support fell off the top spot.',
          stats: [
            { percent: 52, label: 'Startups building or planning to build AI agents' },
            { percent: 34, label: 'Startups with agents automating customer support' },
            { percent: 16, label: 'Startups that are not building AI agents' },
          ],
          charts: ['BuildingAgentsChart'],
          wordCloud: undefined,
          summarizedAnswer: {
            label: 'Most common AI agent use cases',
            answers: [
              'Workflow and process automation',
              'Data analysis and reporting',
              'Customer support triage',
              'Sales outreach and lead qualification',
              'Onboarding and activation flows',
              'Content generation and summarization',
              'Internal knowledge search',
              'Developer productivity and code review',
              'Scheduling and meeting assistance',
              'Personalization and recommendations',
            ],
          },
          rankedAnswersPair: undefined,
        },
        {
          title: 'Multi-agent and MCP',
          description:
            '25% of agent builders say multi-agent is in production. 21% in development. 36% planning. Only 16% said no. A year after MCP launched, 57% of respondents have hands on it. Only 14% say they are unfamiliar.',
          stats: [
            { percent: 25, label: 'Agent builders running multi-agent systems in production' },
            { percent: 57, label: 'Respondents with hands on MCP servers or tools' },
            { percent: 14, label: 'Respondents unfamiliar with MCP' },
          ],
          charts: ['MCPAdoptionChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'Every Operator Tool Lost Ground',
      shortTitle: 'Operator tools',
      description:
        'Five separate questions show the same pattern this year. CRMs, analytics, observability, dev communities, prompt management. In every one, named vendors lost share, and either “we don’t have one yet” or “custom-built” grew. Startups are not buying operator tools. They are building their own or doing without.',
      pullQuote: undefined,
      sections: [
        {
          title: 'Sales Tools and CRM Absence',
          description:
            '53% of startups with a GTM motion have no formal CRM, up from 43%. Every named CRM lost share: HubSpot, Salesforce, Notion/Airtable, Google Sheets. Build-your-own, or nothing at all.',
          stats: [
            { percent: 53, label: 'Startups with no formal CRM' },
            { percent: 18, label: 'Startups using Google Sheets as a CRM' },
            { percent: 12, label: 'Startups using HubSpot' },
          ],
          charts: ['SalesToolsChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'The Operator Stack Startups Wish Existed',
          description:
            '56% still don’t use observability tools. “Custom solution” is the fastest-growing answer in observability, up 2.5pp. Custom-built dashboards grew 6 points for growth analytics. “I don’t track this yet” grew 5pp.',
          stats: [
            { percent: 56, label: 'Startups that don’t use observability tools' },
            { percent: 48, label: 'Startups that have not built a developer community' },
            { percent: 11, label: 'Startups that have built a developer community' },
          ],
          charts: [],
          wordCloud: undefined,
          summarizedAnswer: {
            label: 'Operator tools startups wish existed',
            answers: [
              'Unified backend platform combining auth, edge, database, and queues',
              'AI agents with real memory and workflow context',
              'Local-first dev environments that sync to Supabase or Git',
              'AI copilots for sales, marketing, or documentation',
              'UI builders with direct-to-code export and stateful logic',
              'Better CLI-driven or REPL-native dev tools',
              'Automated integration layers between SaaS APIs',
              'Real-time dashboards that don’t require BI tools',
              'One-click staging, testing, and preview environments',
              'AI validators for production database migrations',
              'Visual version control and state inspection for app logic',
              'Agent-like task runners for cron jobs, workflows, monitoring',
              'Prompt versioning and evaluation as a first-class product',
              'Observability that understands AI workloads natively',
              'CRMs designed for founder-led, product-led motions',
            ],
          },
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'Founder-led. No CRM. Mostly Bootstrapped.',
      shortTitle: 'Go-To-Market',
      description:
        'Founders still do sales themselves. Two in three have never tried paid acquisition. Pricing is settling on tiered feature plans for the first time. And founders are broadcasting less: X lost six points, conferences emptied out, and one in three respondents now says they have no online persona at all.',
      pullQuote: undefined,
      sections: [
        {
          title: 'Initial Customers',
          description:
            'Personal networks remain the top source of initial paying customers. 67% of respondents still haven’t tried paid acquisition at all, up from 62% last year.',
          stats: [
            {
              percent: 67,
              label:
                'Startups that get their first customers via personal and professional networks',
            },
            { percent: 48, label: 'Startups that engage users through social media' },
            { percent: 36, label: 'Startups that use tiered feature plans for pricing' },
          ],
          charts: ['InitialPayingCustomersChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Where Founders Show Up Online',
          description:
            'X lost 6 points. LinkedIn lost 3. Reddit and Discord lost 3–4. TikTok was the only platform that grew. The “I have no online persona” share grew 5 points to 33%. One in three respondents is fully offline.',
          stats: [
            { percent: 10, label: 'Founders that have given up on social media' },
            { percent: 33, label: 'Respondents with no online persona' },
            { percent: 55, label: 'Engineers using LinkedIn regularly' },
          ],
          charts: ['RegularSocialMediaUseChart'],
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
      title: 'Technical Complexity Collapsed. New Fears Took Its Place.',
      shortTitle: 'Outlook',
      description:
        'The biggest single movement in the entire survey: “technical complexity” as the largest business challenge fell from 24% to 11%. AI ate the hard parts of shipping. What replaced it: burn out, AI-competition fear, runway anxiety. Optimism is mostly flat. Engineers less so.',
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
            'The largest year-over-year shift in any single category. Three new challenge options came online: burn out, AI competition, runway anxiety. Together they absorb roughly the same share that used to pick technical complexity. Among 1–10 person teams, burn out has already overtaken technical complexity as the second-biggest challenge.',
          stats: [
            { percent: 11, label: 'Startups naming technical complexity their biggest challenge' },
            { percent: 82, label: 'Founders that evaluate tools via hands-on experience' },
            {
              percent: 45,
              label:
                'Startups with over 250 employees whose biggest challenge is getting customers',
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
            '56% say they are optimistic, down 2 points from last year, not statistically significant. Founders are 58% optimistic; non-founders are 49%. The gap widens among engineers and marketers.',
          stats: [
            { percent: 58, label: 'Founders that are optimistic' },
            { percent: 49, label: 'Non-founders that are optimistic' },
            { percent: 56, label: 'Respondents overall that are optimistic' },
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
