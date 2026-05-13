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
            {
              percent: 61,
              label: 'Startups with a single founder',
              source: { column: 'founder_count', aggregation: 'single', target: '1' },
            },
            {
              percent: 22,
              label: 'Startups founded by non-technical founders',
              source: {
                column: 'founders_are_technical',
                aggregation: 'boolean',
                target: 'FALSE',
              },
            },
            {
              percent: 26,
              label: 'Founders aged 40 or older',
              source: {
                column: 'person_age',
                aggregation: 'single',
                target: ['40–49', '50–59', '60+'],
              },
            },
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
            {
              percent: 91,
              label: 'Startups with 10 or fewer employees',
              source: { column: 'team_size', aggregation: 'single', target: '1–10' },
            },
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
            {
              percent: 25,
              label: 'Global startups based in Europe',
              source: { column: 'location', aggregation: 'single', target: 'Europe' },
            },
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
            {
              percent: 62,
              label: 'Startups that list Claude Code as a must-have',
              source: { column: 'ai_coding_tools', aggregation: 'multi', target: 'Claude Code' },
            },
            {
              percent: 37,
              label: 'Startups that list Cursor as a must-have',
              source: { column: 'ai_coding_tools', aggregation: 'multi', target: 'Cursor' },
            },
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
            {
              percent: 59,
              label: 'Startups that pay for Claude',
              source: { column: 'subscriptions', aggregation: 'multi', target: 'Claude' },
            },
            {
              percent: 39,
              label: 'Startups that pay for OpenAI or ChatGPT',
              source: {
                column: 'subscriptions',
                aggregation: 'multi',
                target: 'OpenAI / ChatGPT',
              },
            },
            {
              percent: 27,
              label: 'Startups that pay for Gemini',
              source: { column: 'subscriptions', aggregation: 'multi', target: 'Gemini' },
            },
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
            {
              percent: 64,
              label: 'Startups using Anthropic models',
              source: {
                column: 'ai_models_used',
                aggregation: 'multi',
                target: 'Anthropic/Claude',
              },
            },
            {
              percent: 51,
              label: 'Startups using OpenAI models',
              source: { column: 'ai_models_used', aggregation: 'multi', target: 'OpenAI' },
            },
            {
              percent: 43,
              label: 'Startups using Gemini',
              source: { column: 'ai_models_used', aggregation: 'multi', target: 'Gemini' },
            },
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
            {
              percent: 41,
              label: 'Startups with 76–100% of their codebase AI-generated',
              source: {
                column: 'ai_generated_codebase_percent',
                aggregation: 'single',
                target: '76-100%',
              },
            },
            {
              percent: 62,
              label: 'Startups with a majority AI-generated codebase',
              source: {
                column: 'ai_generated_codebase_percent',
                aggregation: 'single',
                target: ['51-75%', '76-100%'],
              },
            },
            {
              percent: 2,
              label: 'Startups with zero AI-generated code',
              source: {
                column: 'ai_generated_codebase_percent',
                aggregation: 'single',
                target: '0%',
              },
            },
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
        'Supabase gained ground as a primary database, landed strong in its first year as an auth provider, and overtook AWS in hosting. Every hyperscaler lost share. A quieter story: the frontend layer is diversifying fast.',
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
            {
              percent: 82,
              label: 'Startups using Supabase as a database',
              source: { column: 'databases', aggregation: 'multi', target: 'Supabase' },
            },
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
            {
              percent: 72,
              label: 'Startups using Supabase Auth',
              source: {
                column: 'auth_provider',
                aggregation: 'multi',
                target: 'Supabase Auth',
              },
            },
            {
              percent: 15,
              label: 'Startups using Auth0',
              source: { column: 'auth_provider', aggregation: 'multi', target: 'Auth0' },
            },
            {
              percent: 14,
              label: 'Startups using NextAuth or Auth.js',
              source: {
                column: 'auth_provider',
                aggregation: 'multi',
                target: 'NextAuth / Auth.js',
              },
            },
          ],
          charts: ['AuthProviderChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Hosting and Cloud',
          description:
            'Supabase held its lead. Vercel was already ahead of AWS in 2025, and in 2026 it extended that lead by 9 points. Cloudflare grew fastest of all, crossing 27% and passing AWS on the way up. Every hyperscaler lost share.',
          stats: [
            {
              percent: 27,
              label: 'Startups hosting on Cloudflare',
              source: { column: 'cloud_providers', aggregation: 'multi', target: 'Cloudflare' },
            },
            { percent: 9, label: 'Increase in Vercel hosting share over AWS' },
            { percent: 0, label: 'Hyperscaler that gained share this year' },
          ],
          charts: [],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Frontend Diversifies',
          description:
            'React and Next.js both grew. But the quieter story is that four tools went from effectively zero to real share in 12 months: Expo 10%, TanStack 8%, HTMX 4%, Astro 3%. Native mobile also picked up 3 points. The React-Next monoculture cracked.',
          stats: [
            {
              percent: 10,
              label: 'Startups using Expo (new in 2026)',
              source: { column: 'frontend_stack', aggregation: 'multi', target: 'Expo' },
            },
            {
              percent: 8,
              label: 'Startups using TanStack (new in 2026)',
              source: { column: 'frontend_stack', aggregation: 'multi', target: 'TanStack' },
            },
            { percent: 3, label: 'Increase in native iOS / Android adoption' },
          ],
          charts: [],
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
            {
              percent: 52,
              label: 'Startups building or planning to build AI agents',
              source: { column: 'building_ai_agents', aggregation: 'single', target: 'Yes' },
            },
            { percent: 34, label: 'Startups with agents automating customer support' },
            {
              percent: 16,
              label: 'Startups that are not building AI agents',
              source: { column: 'building_ai_agents', aggregation: 'single', target: 'No' },
            },
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
          title: 'Multi-agent Systems',
          description:
            'Three in four agent-builders are already doing multi-agent work. 25% say it is in production. 21% in development. 36% are planning. Only 16% said no. This question was new in 2026; the on-ramp is already steeper than the "are you building agents at all" question was in 2025.',
          stats: [
            {
              percent: 25,
              label: 'Agent builders running multi-agent systems in production',
              source: {
                column: 'building_multi_agent_systems',
                aggregation: 'single',
                target: 'Yes, in production',
              },
            },
            {
              percent: 21,
              label: 'Agent builders with multi-agent systems in development',
              source: {
                column: 'building_multi_agent_systems',
                aggregation: 'single',
                target: 'Yes, in development',
              },
            },
            {
              percent: 36,
              label: 'Agent builders planning multi-agent systems',
              source: {
                column: 'building_multi_agent_systems',
                aggregation: 'single',
                target: 'Planning to',
              },
            },
          ],
          charts: [],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'The Operational Gap',
          description:
            'Prompt management, evaluation, and AI observability questions were new in 2026. Every answer points to the same thing: most teams ship agents without the operator stack underneath them. Whoever builds the operator tools for the next 500k AI startups has an open market.',
          stats: [
            { percent: 33, label: 'Startups with no formal AI evaluation process' },
            { percent: 0, label: 'Standardized prompt-versioning workflow named by a plurality' },
            { percent: 0, label: 'AI observability tools used by a majority' },
          ],
          charts: [],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'MCP Adoption',
          description:
            'A year after the protocol launched, 57% of respondents have hands on it. Only 14% say they are unfamiliar. This question is new in 2026 so there is no year-over-year comparison; the speed of the on-ramp is what stands out.',
          stats: [
            { percent: 57, label: 'Respondents with hands on MCP servers or tools' },
            { percent: 14, label: 'Respondents unfamiliar with MCP' },
            { percent: 29, label: 'Respondents still evaluating MCP' },
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
            {
              percent: 53,
              label: 'Startups with no formal CRM',
              source: {
                column: 'sales_tools',
                aggregation: 'multi',
                target: 'We don’t have a formal CRM or sales tool yet',
              },
            },
            {
              percent: 18,
              label: 'Startups using Google Sheets as a CRM',
              source: { column: 'sales_tools', aggregation: 'multi', target: 'Google Sheets' },
            },
            {
              percent: 12,
              label: 'Startups using HubSpot',
              source: { column: 'sales_tools', aggregation: 'multi', target: 'HubSpot' },
            },
          ],
          charts: ['SalesToolsChart'],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Observability',
          description:
            '56% still don’t use observability tools. “Custom solution” is the fastest-growing answer, up 2.5pp. Datadog and Prometheus both lost share. Sentry kept its lead and grew slightly. The observability market is bifurcating between Sentry for errors and custom dashboards for everything else.',
          stats: [
            {
              percent: 56,
              label: 'Startups that don’t use observability tools',
              source: {
                column: 'observability',
                aggregation: 'multi',
                target: 'We don’t use observability tools yet',
              },
            },
            { percent: 2.5, label: 'Year-over-year growth in custom observability solutions' },
            { percent: 0, label: 'Hyperscaler observability vendor that gained share' },
          ],
          charts: [],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Analytics and Growth Tools',
          description:
            '“I don’t track this yet” grew 5pp. HubSpot, Salesforce, Mixpanel, Segment all lost share. Custom-built dashboards grew 6 points. The pattern repeats: skip the vendor, ship something internal, or don’t track at all.',
          stats: [
            { percent: 5, label: 'Year-over-year growth in “I don’t track this yet”' },
            { percent: 6, label: 'Year-over-year growth in custom-built dashboards' },
            { percent: 0, label: 'Named analytics vendor that gained share this year' },
          ],
          charts: [],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Developer Communities',
          description:
            '“No, we haven’t built a community” grew 4 points to 48%. “In progress / planning to” shrank. The “yes, we built one” share is flat at 11%. Dev-community-led marketing has a smaller top-of-funnel this year than last.',
          stats: [
            {
              percent: 48,
              label: 'Startups that have not built a developer community',
              source: { column: 'dev_community_built', aggregation: 'single', target: 'No' },
            },
            {
              percent: 11,
              label: 'Startups that have built a developer community',
              source: { column: 'dev_community_built', aggregation: 'single', target: 'Yes' },
            },
            { percent: 4, label: 'Year-over-year growth in “no community” share' },
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
        'Founders still do sales themselves. Two in three have never tried paid acquisition. Pricing is settling on tiered feature plans for the first time.',
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
              source: {
                column: 'initial_paying_customers',
                aggregation: 'multi',
                target: 'Personal/professional network',
              },
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
          title: 'Sales Motion',
          description:
            'Dedicated full-time sales hires usually do not arrive until after the tenth employee. Product-led growth as a motion climbed 4 points to half of respondents. “Not sure yet” is shrinking.',
          stats: [
            {
              percent: 50,
              label: 'Startups using a product-led growth motion',
              source: {
                column: 'market_model',
                aggregation: 'multi',
                target: 'Product-led growth',
              },
            },
            { percent: 4, label: 'Year-over-year growth in product-led motion adoption' },
            { percent: 0, label: 'Startups with a full-time sales team before headcount 10' },
          ],
          charts: [],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
        {
          title: 'Pricing Settles',
          description:
            'For the first time in the survey, startups are picking a pricing shape earlier in their lifecycle, and they are picking the same one. Tiered feature plans went from 23% to 36% of respondents. The “still experimenting” cohort shrank.',
          stats: [
            {
              percent: 36,
              label: 'Startups using tiered feature plans',
              source: {
                column: 'pricing',
                aggregation: 'multi',
                target: 'Tiered feature plans',
              },
            },
            { percent: 12, label: 'Year-over-year growth in tiered-plan adoption' },
            { percent: 23, label: 'Tiered-plan share in 2025' },
          ],
          charts: [],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
        },
      ],
    },
    {
      title: 'Founders Are Broadcasting Less',
      shortTitle: 'Where they show up',
      description:
        'Conferences emptied out. Social media lost users across every major platform except TikTok. 1 in 10 respondents now says they have given up on social media entirely. 1 in 3 says they have no online persona at all.',
      pullQuote: undefined,
      sections: [
        {
          title: 'The Quiet Exit From Social',
          description:
            'X lost 6 points. LinkedIn lost 3. Reddit and Discord lost 3–4. TikTok was the only platform that grew. The “I have no online persona” share grew 5 points to 33%. One in three respondents is fully offline.',
          stats: [
            {
              percent: 10,
              label: 'Founders that have given up on social media',
              source: {
                column: 'regular_social_media_use',
                aggregation: 'multi',
                target: 'I’ve given up social media',
              },
            },
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
        {
          title: 'Conferences Fell Off',
          description:
            '2 in 3 respondents are not attending any industry conference. The “none of the above” cohort jumped 10 points. Google Cloud Next, AWS re:Invent, Microsoft Build, and Y Combinator Demo Day all lost share. Conference-led developer marketing is working for a smaller slice of the market every year.',
          stats: [
            {
              percent: 67,
              label: 'Respondents not attending any industry conference',
              source: {
                column: 'events',
                aggregation: 'multi',
                target: 'None of the above',
              },
            },
            { percent: 10, label: 'Year-over-year growth in “none of the above” share' },
            { percent: 0, label: 'Named conference that gained share this year' },
          ],
          charts: [],
          wordCloud: undefined,
          summarizedAnswer: undefined,
          rankedAnswersPair: undefined,
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
            {
              percent: 11,
              label: 'Startups naming technical complexity their biggest challenge',
              source: {
                column: 'biggest_challenge',
                aggregation: 'single',
                target: 'Technical complexity',
              },
            },
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
