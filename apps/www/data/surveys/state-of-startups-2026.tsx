/**
 * Narrative data for the State of Startups 2026 microsite.
 *
 * Structure, copy, and comparison framing are ported verbatim from the
 * State of Startups source repo (supabase/state-of-startups, app/fancy/
 * survey-data.ts). Every number renders from the embedded static dataset
 * (data/surveys/state-of-startups-data.json) via the (column, aggregation,
 * target, filters) query on each stat/chart — no live database.
 *
 * Pull quotes are real, anonymized survey responses.
 *
 * Multi-select stats use the respondent-count denominator, so percentages read
 * as "% of respondents who picked X" rather than "% of selections".
 */

import type { Aggregation, SurveyFilters } from '../../app/state-of-startups/lib/survey-keys'
import { participants } from './state-of-startups-participants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StatQuery {
  column: string
  aggregation: Aggregation
  target: string | string[]
  filters?: SurveyFilters
  /** Flags the option as new-in-2026 so the card shows "new this year"
   *  instead of "—" when the year toggle is on 2025. */
  newIn2026?: boolean
}

export interface SurveyStat {
  label: string
  query: StatQuery
}

export interface CompareStat {
  kind: 'compare'
  label: string
  a: { caption: string; query: StatQuery }
  b: { caption: string; query: StatQuery }
}

export type TopLineItem = ({ kind: 'stat' } & SurveyStat) | CompareStat

export interface BarChartConfig {
  kind?: 'bar'
  title: string
  column: string
  aggregation: Aggregation
  filters?: SurveyFilters
  maxBars?: number
}

export interface CrossTabCohort {
  label: string
  filter: string
}

export interface CrossTabSeries {
  caption: string
  tone: 'accent' | 'muted'
  query: { column: string; aggregation: Aggregation; target: string | string[] }
}

export interface CrossTabChartConfig {
  kind: 'cross-tab'
  title: string
  eyebrow?: string
  axisColumn: string
  cohorts: CrossTabCohort[]
  series: CrossTabSeries[]
}

export interface ChannelCohort {
  label: string
  filter: string
  tone: 'accent' | 'muted'
}

export interface ChannelRow {
  target: string
  display: string
}

export interface ChannelMixChartConfig {
  kind: 'channel-mix'
  title: string
  eyebrow?: string
  column: string
  cohortColumn: string
  cohorts: ChannelCohort[]
  rows: ChannelRow[]
}

export type ChartConfig = BarChartConfig | CrossTabChartConfig | ChannelMixChartConfig

export interface SurveyPullQuote {
  quote: string
  author: string
  authorPosition?: string
  /** Optional short label for grid treatments (e.g. "Burn out"). */
  theme?: string
}

export interface CohortToggleOption {
  label: string
  filter: string | string[] | null
}

export interface CohortToggleConfig {
  eyebrow: string
  key: string
  options: CohortToggleOption[]
  defaultLabel: string
}

export interface SectionCallout {
  eyebrow: string
  body: string
  href: string
  cta: string
  external?: boolean
}

export interface SurveySection {
  id: string
  eyebrow: string
  title: string
  description: string
  stats: SurveyStat[]
  charts: ChartConfig[]
  pullQuote?: SurveyPullQuote
  pullQuotes?: SurveyPullQuote[]
  cohortToggle?: CohortToggleConfig
  callout?: SectionCallout
}

export interface SurveyChapter {
  shortTitle: string
  title: string
  description: string
  pullQuote?: SurveyPullQuote
  sections: SurveySection[]
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

const stat = (
  label: string,
  column: string,
  aggregation: Aggregation,
  target: string | string[],
  filters?: SurveyFilters
): SurveyStat => ({ label, query: { column, aggregation, target, filters } })

const newStat = (
  label: string,
  column: string,
  aggregation: Aggregation,
  target: string | string[],
  filters?: SurveyFilters
): SurveyStat => ({
  label,
  query: { column, aggregation, target, filters, newIn2026: true },
})

const q = (
  column: string,
  aggregation: Aggregation,
  target: string | string[],
  filters?: SurveyFilters
): StatQuery => ({ column, aggregation, target, filters })

// Age bands are stored with an en-dash.
const AGE_UNDER_40 = ['18–21', '22–29', '30–39']
const AGE_40_PLUS = ['40–49', '50–59', '60+']
const AGE_50_PLUS = ['50–59', '60+']

// AI codebase cohorts, in display order. Used by the cost-of-vibes (Chapter 3)
// and optimism-gap (Chapter 9) cross-tab charts.
const AI_CODEBASE_COHORTS: CrossTabCohort[] = [
  { label: '0%', filter: '0%' },
  { label: '1–10%', filter: '1-10%' },
  { label: '11–25%', filter: '11-25%' },
  { label: '26–50%', filter: '26-50%' },
  { label: '51–75%', filter: '51-75%' },
  { label: '76–100%', filter: '76-100%' },
]

// Option labels that use a curly apostrophe, as the export stored them. Use
// verbatim so the lookup matches the dataset.
const NO_CRM = 'We don’t have a formal CRM or sales tool yet'
const NO_OBSERVABILITY = 'We don’t use observability tools yet'
const NO_ANALYTICS = 'I don’t track this yet'
const NON_FOUNDERS = [
  'Engineer',
  'Product Management',
  'Marketing',
  'Sales',
  'Legal or Ops',
  'Other',
]

// ---------------------------------------------------------------------------
// Narrative
// ---------------------------------------------------------------------------

const stateOfStartupsData = {
  metaTitle: 'State of Startups 2026 | Supabase',
  metaDescription:
    'The latest trends among builders in tech stacks, AI usage, problem domains, and more.',
  metaImage: '/images/state-of-startups/2026/state-of-startups-og.png',

  heroSection: {
    eyebrow: 'State of Startups 2026 · Final results',
    title: 'State of Startups 2026',
    subheader:
      'Two thousand startup builders told us what they picked up and what they put down between 2025 and 2026. Anthropic rewrote the tooling layer, AI-written code became the median experience, and great companies are now starting up from anywhere.',
    cta: 'Startups are the leading indicator. The tools founders pick up, the habits they drop, and the channels they stop trusting disrupt the status quo. If startups succeed, the effects ripple through the ecosystem. We track them so we can see what is coming.',
  },

  topLineHero: [
    {
      kind: 'stat',
      label: 'have 76 to 100% of their codebase AI-generated',
      query: q('ai_generated_codebase_percent', 'single', '76-100%'),
    },
    {
      kind: 'compare',
      label:
        'Claude Code came out of nowhere and took the crown. Cursor gave up almost exactly as much share as Claude Code picked up.',
      a: { caption: 'Claude Code', query: q('ai_coding_tools', 'multi', 'Claude Code') },
      b: { caption: 'Cursor', query: q('ai_coding_tools', 'multi', 'Cursor') },
    },
    {
      kind: 'stat',
      label: 'use Supabase as their primary database',
      query: q('databases', 'multi', 'Supabase'),
    },
  ] as TopLineItem[],

  topLineSecondary: {
    eyebrow: 'Two more patterns worth watching',
    items: [
      {
        kind: 'stat',
        label: 'of AI-agent builders already have multi-agent systems in production',
        query: q('building_multi_agent_systems', 'single', 'Yes, in production'),
      },
      {
        kind: 'stat',
        label: 'of startups with a GTM motion have no formal CRM. The number grew 11pp.',
        query: q('sales_tools', 'multi', NO_CRM),
      },
    ] as TopLineItem[],
  },

  pageChapters: [
    {
      shortTitle: 'Who is building',
      title: 'The founder changed shape.',
      description:
        'The respondent base got older, more European, more solo, and less self-described-technical. One pattern connects it: experienced operators with AI in their pocket are starting companies again.',
      sections: [
        {
          id: 'solo-founders',
          eyebrow: '01 · One person, one platform',
          title: 'Solo founders continue to thrive.',
          description:
            'Solo founders were already the largest group in 2025 at 52%. In 2026 they are 61% of respondents, up 9 points. Cofounder pairs slipped. The one-person startup is the dominant shape and it is still growing.',
          pullQuote: {
            quote:
              'Before I had to recruit engineers, now I’ve become the engineer doing pair or mob programming with multiple LlMs',
            author: 'Your Friend Fido',
          },
          stats: [
            stat('are one-founder startups', 'founder_count', 'single', '1'),
            stat('are two-founder startups', 'founder_count', 'single', '2'),
            stat('have three or more founders', 'founder_count', 'single', ['3', '4+']),
          ],
          charts: [
            {
              title: 'How many founders at your current startup?',
              column: 'founder_count',
              aggregation: 'single',
            },
          ],
        },
        {
          id: 'non-technical-founders',
          eyebrow: '02 · Not what an engineer looks like',
          title: '22% of startups are founded by non-technical founders.',
          description:
            'Technical-founder share dropped from 82% to 78%. The same cohort leans harder on AI code generation than anyone else.',
          pullQuote: {
            quote:
              'I am a brand developer unfamiliar with coding. This opens up an entire realm of possibilities in what I am able to build for clients.',
            author: 'Anonymous respondent in North America',
          },
          stats: [
            stat('say their founders are technical', 'founders_are_technical', 'boolean', 'TRUE'),
            stat('had previously started a company', 'previous_company', 'boolean', 'TRUE'),
          ],
          charts: [
            {
              title: 'Is the founder(s) at your current startup technical?',
              column: 'founders_are_technical',
              aggregation: 'boolean',
            },
          ],
        },
        {
          id: 'older-founders',
          eyebrow: '03 · Older is the new younger',
          title: 'Founders 40 and older grew from 18% to 25%.',
          description:
            'Every age band above 40 grew by a statistically significant margin. The 22 to 29 cohort shrank by 5 points. Seasoned operators are filling the gap, often with AI doing the typing.',
          pullQuote: {
            quote: 'It has allowed me to build the vision that has been in my head for decades',
            author: 'Mazz Ink',
          },
          stats: [
            stat('are aged 40 or older', 'person_age', 'single', AGE_40_PLUS),
            stat('are aged 22 to 29', 'person_age', 'single', '22–29'),
            stat('are aged 50 or older', 'person_age', 'single', AGE_50_PLUS),
          ],
          charts: [{ title: 'What is your age?', column: 'person_age', aggregation: 'single' }],
        },
        {
          id: 'geo-shift',
          eyebrow: '04 · From anywhere',
          title: 'You can build a great company from anywhere now.',
          description:
            'The top metros are still the top metros. But AI has flattened the development gap everywhere else. Europe grew 4pp; Africa grew 2pp. Startups are setting up across Toronto, Chicago, Denver, Austin, across Europe, Asia, and Africa. The playbook no longer requires a specific zip code.',
          pullQuote: {
            quote:
              'Speed of iteration is mind blowing. Even non-technical people can now translate creativity and ideas into tangible assets.',
            author: 'Anonymous respondent in Europe',
          },
          stats: [
            stat('are headquartered in Europe', 'location', 'single', 'Europe'),
            stat('are headquartered in North America', 'location', 'single', 'North America'),
            stat('are headquartered in Asia', 'location', 'single', 'Asia'),
          ],
          charts: [
            {
              title: 'Where is your startup headquartered?',
              column: 'location',
              aggregation: 'single',
            },
            {
              title: 'Which North American metro are you based in?',
              column: 'location_north_america',
              aggregation: 'single',
              filters: { location: 'North America' },
              maxBars: 10,
            },
          ],
        },
      ],
    },
    {
      shortTitle: 'The Anthropic generation',
      title: 'One company swept the tooling layer.',
      description:
        'Claude Code became the most-named must-have dev tool. Claude paid subscriptions nearly doubled. Anthropic overtook OpenAI on the model-provider question. The Anthropic Agent SDK leads SDK adoption. This is the largest single-year re-ordering in any category in the survey.',
      sections: [
        {
          id: 'coding-tools',
          eyebrow: '05 · Must-have dev tools',
          title: 'Claude Code eclipsed everything else.',
          description:
            'Claude Code went from 1% in 2025 to 62% in 2026 (+61pp). Cursor dropped 19 points. v0, Bolt, and Windsurf each lost 6-9 points. VS Code held flat. Antigravity appeared for the first time and took the 4th spot in its debut year.',
          pullQuote: {
            quote:
              'Claude models in Claude code and Cursor. Supabase MCP has also been a game changer',
            author: 'Adrian, FindHomes',
          },
          stats: [
            stat('list Claude Code as a must-have', 'ai_coding_tools', 'multi', 'Claude Code'),
            stat('list Cursor as a must-have', 'ai_coding_tools', 'multi', 'Cursor'),
            stat('list VS Code as a must-have', 'ai_coding_tools', 'multi', 'Visual Studio Code'),
          ],
          charts: [
            {
              title: 'Which AI coding tools do you use?',
              column: 'ai_coding_tools',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
        {
          id: 'paid-subs',
          eyebrow: '06 · Paid AI subscriptions',
          title: 'Claude overtook OpenAI in the wallet.',
          description:
            'Paid Claude subscriptions jumped from 28% to 59% of respondents. Paid OpenAI dropped from 57% to 39%. Gemini entered the list at 27%. The money is moving faster than any lagging indicator could capture.',
          stats: [
            stat('pay for Claude', 'subscriptions', 'multi', 'Claude'),
            stat('pay for OpenAI / ChatGPT', 'subscriptions', 'multi', 'OpenAI / ChatGPT'),
            stat('pay for Cursor', 'subscriptions', 'multi', 'Cursor'),
          ],
          charts: [
            {
              title: 'Which subscriptions does your startup pay for?',
              column: 'subscriptions',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
        {
          id: 'model-providers',
          eyebrow: '07 · Model providers',
          title: 'Anthropic is the default model provider.',
          description:
            'Anthropic/Claude climbed from 38% to 64%; OpenAI fell from 69% to 51%. Gemini entered at 44%. Hugging Face and custom models lost material share, suggesting fewer teams are running their own inference.',
          stats: [
            stat('use Anthropic models', 'ai_models_used', 'multi', 'Anthropic/Claude'),
            stat('use OpenAI models', 'ai_models_used', 'multi', 'OpenAI'),
            stat('use Gemini', 'ai_models_used', 'multi', 'Gemini'),
          ],
          charts: [
            {
              title: 'Which AI models are you using?',
              column: 'ai_models_used',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
      ],
    },
    {
      shortTitle: 'AI-written code',
      title: 'AI-generated code is the median experience.',
      description:
        '62% of startups have more than half their codebase written by AI. 41% are at 76 to 100%. Only 2% are at zero. Older founders use it more heavily than younger ones, and non-technical founders more than technical ones.',
      sections: [
        {
          id: 'ai-codebase',
          eyebrow: '08 · Share of codebase',
          title: '41% of respondents have more than three-quarters of their code AI-generated.',
          description:
            'This question was new in 2026. Among non-technical founders, the 76-to-100% share rises to 54%. Among 50-to-59-year-olds it rises to 80%. AI code generation is a median practice, not a fringe one. Flip the age cohort toggle to see it climb with age.',
          pullQuote: {
            quote:
              'It has made entirely efficient the most menial coding tasks, elevating the developer focus to matters of design and architecture.',
            author: 'Anonymous respondent in the San Francisco Bay Area',
          },
          stats: [
            stat(
              'have 76 to 100% AI-generated code',
              'ai_generated_codebase_percent',
              'single',
              '76-100%'
            ),
            stat('have majority AI-generated code', 'ai_generated_codebase_percent', 'single', [
              '51-75%',
              '76-100%',
            ]),
            stat('have zero AI-generated code', 'ai_generated_codebase_percent', 'single', '0%'),
          ],
          charts: [
            {
              title: 'What percentage of your codebase was generated by AI?',
              column: 'ai_generated_codebase_percent',
              aggregation: 'single',
            },
          ],
          cohortToggle: {
            eyebrow: 'Age cohort',
            key: 'person_age',
            defaultLabel: 'All',
            options: [
              { label: 'All', filter: null },
              { label: 'Under 40', filter: AGE_UNDER_40 },
              { label: '40–49', filter: '40–49' },
              { label: '50–59', filter: '50–59' },
              { label: '60+', filter: '60+' },
            ],
          },
        },
        {
          id: 'cost-of-vibes',
          eyebrow: '08b · The cost of vibes',
          title: 'Building got easier. Selling did not.',
          description:
            'Heavy AI users ship more code and have less revenue to show for it. 31% of startups with 76 to 100% AI-generated code are currently monetizing, vs 61% of those at zero. The same cohort is most likely to name customer acquisition as their biggest challenge: 38% at the heavy end, 22% at zero. AI ate the building. Distribution is the new bottleneck.',
          pullQuote: {
            quote:
              'The hardest is getting the first paying customer to care, because AI-native dev tooling is a crowded space where every founder ships fast but almost nobody converts.',
            author: 'Shteryo Dzhimov, FixSense',
          },
          stats: [
            stat(
              'of heavy AI users (76 to 100% AI-generated code) are currently monetizing',
              'currently_monetizing',
              'single',
              'Yes',
              { ai_generated_codebase_percent: '76-100%' }
            ),
            stat(
              'of zero-AI users are currently monetizing, almost twice the rate',
              'currently_monetizing',
              'single',
              'Yes',
              { ai_generated_codebase_percent: '0%' }
            ),
            stat(
              'of heavy AI users name customer acquisition as their biggest challenge',
              'biggest_challenge',
              'single',
              'Customer acquisition',
              { ai_generated_codebase_percent: '76-100%' }
            ),
          ],
          charts: [
            {
              kind: 'cross-tab',
              title: 'Two slopes that go in opposite directions',
              eyebrow: 'Cost of vibes',
              axisColumn: 'ai_generated_codebase_percent',
              cohorts: AI_CODEBASE_COHORTS,
              series: [
                {
                  caption: 'Currently monetizing',
                  tone: 'accent',
                  query: { column: 'currently_monetizing', aggregation: 'single', target: 'Yes' },
                },
                {
                  caption: 'Customer acquisition is the biggest challenge',
                  tone: 'muted',
                  query: {
                    column: 'biggest_challenge',
                    aggregation: 'single',
                    target: 'Customer acquisition',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      shortTitle: 'Supabase deepens',
      title: 'The stack consolidated.',
      description:
        'Supabase gained ground as a primary database, landed strong in its first year as an auth provider, and Postgres became the default analytics store. AWS, GCP, and Azure all lost share to Supabase, Vercel, and Cloudflare. A quieter story: the frontend layer is diversifying fast.',
      sections: [
        {
          id: 'databases',
          eyebrow: '09 · Primary database',
          title: 'Supabase went from 76% to 80%.',
          description:
            'Every legacy NoSQL option lost share: MongoDB dropped 5%, MySQL 3%, Firebase 2%.',
          pullQuote: {
            quote: 'No hand written code anymore. We are building around AI coding agents.',
            author: 'Anonymous respondent in the San Francisco Bay Area',
          },
          stats: [
            stat('use Supabase as a database', 'databases', 'multi', 'Supabase'),
            stat('use MongoDB', 'databases', 'multi', 'MongoDB'),
            stat('use MySQL', 'databases', 'multi', 'MySQL'),
          ],
          charts: [
            {
              title: 'Which databases are your startup using?',
              column: 'databases',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
        {
          id: 'auth',
          eyebrow: '10 · Auth (new this year)',
          title: 'Supabase Auth landed at 72%.',
          description:
            'This question was new in 2026, so there is no prior baseline. Three in four respondents who answered the auth question picked Supabase Auth. The firm migration floor is the ~25% who picked no Supabase option at all.',
          stats: [
            stat('use Supabase Auth', 'auth_provider', 'multi', 'Supabase Auth'),
            stat('use Auth0', 'auth_provider', 'multi', 'Auth0'),
            stat('use NextAuth / Auth.js', 'auth_provider', 'multi', 'NextAuth / Auth.js'),
          ],
          charts: [
            {
              title: 'What authentication provider do you use?',
              column: 'auth_provider',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
        {
          id: 'hosting',
          eyebrow: '11 · Hosting and cloud',
          title: 'Supabase and Vercel are running away with startup hosting.',
          description:
            'Supabase held its lead. Vercel was already ahead of AWS in 2025, and in 2026 it extended that lead by 9 points. Cloudflare grew fastest of all, crossing 27% and passing AWS on the way up. Every hyperscaler lost share.',
          stats: [
            stat('build on Supabase', 'cloud_providers', 'multi', 'Supabase'),
            stat('host on Vercel', 'cloud_providers', 'multi', 'Vercel'),
            stat('run on Cloudflare', 'cloud_providers', 'multi', 'Cloudflare'),
          ],
          charts: [
            {
              title: 'Which cloud providers is your startup using?',
              column: 'cloud_providers',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
        {
          id: 'frontend',
          eyebrow: '12 · Frontend diversifies',
          title: 'Expo, TanStack, HTMX, and Astro all arrived this year.',
          description:
            'React and Next.js both grew. But the quieter story is that four tools went from effectively zero to real share in 12 months: Expo 10%, TanStack 8%, HTMX 4%, Astro 3%. Native mobile also picked up 3 points. The React-Next monoculture cracked.',
          stats: [
            newStat('use Expo', 'frontend_stack', 'multi', 'Expo'),
            newStat('use TanStack', 'frontend_stack', 'multi', 'TanStack'),
            stat(
              'use native mobile (iOS / Android)',
              'frontend_stack',
              'multi',
              'Native mobile (iOS / Android)'
            ),
          ],
          charts: [
            {
              title: 'What frontend technologies are you using?',
              column: 'frontend_stack',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
      ],
    },
    {
      shortTitle: 'Agents mainstream',
      title: 'Agents shipped. The operator tools did not.',
      description:
        'Half of respondents are building agents. Multi-agent systems are in production at a quarter of them. MCP adoption crossed 57% in its first year. But the operational layer beneath all of this is missing: most teams do not monitor AI workloads, most have no formal prompt management, and one in three has no eval process.',
      sections: [
        {
          id: 'agent-building',
          eyebrow: '13 · Who is building agents',
          title: '52% of respondents are building agents.',
          description:
            'Agent-building share is statistically flat year over year. The "not sure" cohort shrank, which means undecided builders are making up their minds and shipping. What-they-automate has shifted: workflow and data analysis climbed; customer support fell off the top spot.',
          stats: [
            stat(
              'are building or planning to build AI agents',
              'building_ai_agents',
              'single',
              'Yes'
            ),
            stat('are not building AI agents', 'building_ai_agents', 'single', 'No'),
            stat('are undecided about AI agents', 'building_ai_agents', 'single', 'Not sure yet'),
          ],
          charts: [
            {
              title: 'Are you building or planning to build AI agents?',
              column: 'building_ai_agents',
              aggregation: 'single',
            },
            {
              title: 'What problems are your AI agents solving?',
              column: 'ai_agents_problems',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
        {
          id: 'multi-agent',
          eyebrow: '14 · Multi-agent (new this year)',
          title: 'Three in four agent-builders are doing multi-agent work.',
          description:
            '25% say multi-agent is in production. 21% in development. 36% planning. Only 16% said no. This question was new this year; the on-ramp is already steeper than the "are you building agents at all" question was in 2025.',
          stats: [
            stat(
              'have multi-agent systems in production',
              'building_multi_agent_systems',
              'single',
              'Yes, in production'
            ),
            stat(
              'have multi-agent systems in development',
              'building_multi_agent_systems',
              'single',
              'Yes, in development'
            ),
            stat(
              'are planning multi-agent systems',
              'building_multi_agent_systems',
              'single',
              'Planning to'
            ),
          ],
          charts: [
            {
              title: 'Are you building multi-agent systems?',
              column: 'building_multi_agent_systems',
              aggregation: 'single',
            },
          ],
        },
        {
          id: 'agent-infra-gap',
          eyebrow: '15 · The operational gap (new this year)',
          title: 'Agents ship without the operations stack.',
          description:
            'These questions were new in 2026. Every number is a wedge for a product play: no monitoring, no prompt versioning, no evaluation. Whoever builds the operator tools for the next 500k AI startups has an open market.',
          stats: [],
          charts: [
            {
              title: 'How do you manage prompts in production?',
              column: 'prompt_management',
              aggregation: 'multi',
              maxBars: 8,
            },
            {
              title: 'How do you handle AI model evaluation and testing?',
              column: 'ai_evaluation_testing',
              aggregation: 'multi',
              maxBars: 8,
            },
            {
              title: 'What observability tools do you use for AI workloads?',
              column: 'ai_observability',
              aggregation: 'multi',
              maxBars: 8,
            },
          ],
        },
        {
          id: 'mcp',
          eyebrow: '16 · MCP (new this year)',
          title: 'MCP went mainstream fast.',
          description:
            'A year after the protocol launched, 57% of respondents have hands on it. Only 14% say they are unfamiliar. This question is new in 2026 so there is no year-over-year comparison; the speed of the on-ramp is what stands out.',
          stats: [],
          charts: [
            {
              title: 'Have you adopted any MCP servers or tools?',
              column: 'mcp_adoption',
              aggregation: 'single',
            },
          ],
          callout: {
            eyebrow: 'Supabase AI Tools',
            body: 'Learn more about Supabase MCP servers and Supabase Agent Skills and level up your AI-driven development.',
            href: 'https://supabase.com/docs/guides/getting-started/mcp',
            cta: 'Read the docs',
            external: true,
          },
        },
      ],
    },
    {
      shortTitle: 'What happens to SaaS?',
      title: 'What is going to happen to SaaS?',
      description:
        'Five separate questions show the same pattern this year. CRMs, analytics, observability, dev communities, prompt management. In every one, named SaaS vendors lost share, and either "we don’t have one yet" or "custom-built" grew. Startups are not buying operator SaaS. They are building their own or doing without. What happens to SaaS tools is going to be the biggest question of the year.',
      sections: [
        {
          id: 'no-crm',
          eyebrow: '17 · Sales tools',
          title: 'CRM absence jumped 11 points.',
          description:
            '53% of startups with a GTM motion have no formal CRM, up from 43%. Every named CRM lost share: HubSpot, Salesforce, Notion/Airtable, Google Sheets. Build-your-own, or nothing at all.',
          stats: [
            stat('have no formal CRM', 'sales_tools', 'multi', NO_CRM),
            stat('use Google Sheets as a CRM', 'sales_tools', 'multi', 'Google Sheets'),
            stat('use HubSpot', 'sales_tools', 'multi', 'HubSpot'),
          ],
          charts: [
            {
              title: 'Which sales tools are you using?',
              column: 'sales_tools',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
        {
          id: 'observability',
          eyebrow: '18 · Observability',
          title: '56% still don’t use observability tools. Those who do are building their own.',
          description:
            '"Custom solution" is the fastest-growing answer, up 2.5pp. Datadog and Prometheus both lost share. Sentry kept its lead and grew slightly. The observability market is bifurcating between Sentry for errors and custom dashboards for everything else.',
          stats: [
            stat('don’t use observability tools yet', 'observability', 'multi', NO_OBSERVABILITY),
            stat('use Sentry', 'observability', 'multi', 'Sentry'),
            stat('built a custom solution', 'observability', 'multi', 'Custom solution'),
          ],
          charts: [
            {
              title: 'Which observability tools are you using?',
              column: 'observability',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
        {
          id: 'analytics',
          eyebrow: '19 · Analytics and growth tools',
          title: 'Custom-built dashboards grew 6 points.',
          description:
            '"I don’t track this yet" grew 5pp. HubSpot, Salesforce, Mixpanel, Segment all lost share. The pattern repeats: skip the vendor, ship something internal, or don’t track at all.',
          stats: [
            stat('don’t track growth yet', 'growth_tools', 'multi', NO_ANALYTICS),
            stat('use custom-built dashboards', 'growth_tools', 'multi', 'Custom-built dashboards'),
            stat('use Google Analytics', 'growth_tools', 'multi', 'Google Analytics'),
          ],
          charts: [
            {
              title: 'What tools does your startup use to track growth and conversions?',
              column: 'growth_tools',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
        {
          id: 'dev-community',
          eyebrow: '20 · Developer communities',
          title: 'The 11% who built one have a different growth playbook.',
          description:
            'Most teams are not even trying. "No, we haven’t built a community" grew 4 points to 48%. "In progress / planning to" shrank. The "yes, we built one" share held flat at 11%. The smaller top-of-funnel hides the better signal: the small slice of startups that did build a community pulls customers from a completely different mix of channels. See section 21b for the divergence.',
          stats: [
            stat('have built a developer community', 'dev_community_built', 'single', 'Yes'),
            stat(
              'are planning a developer community',
              'dev_community_built',
              'single',
              'In progress / planning to'
            ),
            stat('have not built one', 'dev_community_built', 'single', 'No'),
          ],
          charts: [
            {
              title: 'Have you built a developer community around your product?',
              column: 'dev_community_built',
              aggregation: 'single',
            },
          ],
        },
      ],
    },
    {
      shortTitle: 'Getting customers',
      title: 'Founder-led. No CRM. Mostly bootstrapped.',
      description:
        'Founders still do sales themselves. Two in three have never tried paid acquisition. Pricing is settling on tiered feature plans for the first time.',
      sections: [
        {
          id: 'initial-customers',
          eyebrow: '21 · Initial customers',
          title: 'Personal networks still work best.',
          description:
            'Personal networks remain the top source of initial paying customers. 67% of respondents still haven’t tried paid acquisition at all, up from 62% last year.',
          pullQuote: {
            quote:
              'Building is the easy part. Distribution is the hardest. A lot of competition now a days. There is no unique ideas/products anymore.',
            author: 'Bill Hinostroza, Abriz',
          },
          stats: [
            stat(
              'got first customers from personal networks',
              'initial_paying_customers',
              'multi',
              'Personal/professional network'
            ),
            stat(
              'got first customers from cold outreach',
              'initial_paying_customers',
              'multi',
              'Cold outreach or sales'
            ),
            stat(
              'got first customers from inbound social',
              'initial_paying_customers',
              'multi',
              'Inbound from social media (Twitter, LinkedIn, etc.)'
            ),
          ],
          charts: [
            {
              title: "Where did your startup's initial paying customers come from?",
              column: 'initial_paying_customers',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
        {
          id: 'community-moat',
          eyebrow: '21b · Community is the moat',
          title: 'The teams that built a community do not need to borrow yours.',
          description:
            'When anyone can ship anything, distribution is the bottleneck. Personal networks run dry. Cold outreach gets ignored. The startups that built a developer community ship into a different funnel: open-source users and developer communities convert into paying customers at multiples of the rate non-community teams see. The chart below splits the customer-source mix by community status. Same survey. A different growth playbook.',
          pullQuote: {
            quote:
              'The hardest part has been gaining consistent user traction, cutting through noise, reaching the right audience, and turning early interest into active, retained users.',
            author: 'Aviral Mathur, PlantPal',
          },
          stats: [
            stat(
              'of community-builders convert open-source users into paying customers',
              'initial_paying_customers',
              'multi',
              'Open source users who converted',
              { dev_community_built: 'Yes' }
            ),
            stat(
              'of community-builders pull first customers directly out of Discord, Slack, and Reddit',
              'initial_paying_customers',
              'multi',
              'Developer communities (Discord, Slack, Reddit, etc.)',
              { dev_community_built: 'Yes' }
            ),
            stat(
              'of community-builders rely on personal networks for first customers',
              'initial_paying_customers',
              'multi',
              'Personal/professional network',
              { dev_community_built: 'Yes' }
            ),
          ],
          charts: [
            {
              kind: 'channel-mix',
              title: 'Where first customers come from, split by community status',
              eyebrow: 'The moat',
              column: 'initial_paying_customers',
              cohortColumn: 'dev_community_built',
              cohorts: [
                { label: 'Built a developer community', filter: 'Yes', tone: 'accent' },
                { label: 'No community', filter: 'No', tone: 'muted' },
              ],
              rows: [
                {
                  target: 'Developer communities (Discord, Slack, Reddit, etc.)',
                  display: 'Discord / Slack / Reddit',
                },
                {
                  target: 'Open source users who converted',
                  display: 'Open-source users who converted',
                },
                {
                  target: 'Content (blog, newsletter, SEO)',
                  display: 'Content (blog, newsletter, SEO)',
                },
                {
                  target: 'Inbound from social media (Twitter, LinkedIn, etc.)',
                  display: 'Inbound from social',
                },
                { target: 'Cold outreach or sales', display: 'Cold outreach or sales' },
                {
                  target: 'Personal/professional network',
                  display: 'Personal / professional network',
                },
              ],
            },
          ],
        },
        {
          id: 'sales-motion',
          eyebrow: '22 · Sales motion',
          title: 'Founder-led sales is still the norm.',
          description:
            'Dedicated full-time sales hires usually do not arrive until after the tenth employee. Product-led growth as a motion climbed 4 points to half of respondents. "Not sure yet" is shrinking.',
          stats: [
            stat('have any dedicated sales function', 'dedicated_sales_function', 'single', [
              'Yes, full-time sales team',
              'Yes, but it’s founder-led or part-time',
            ]),
            stat('have no dedicated sales function', 'dedicated_sales_function', 'single', [
              'No, and no plans to add one yet',
              'No, but planning to build one',
            ]),
            stat('use a product-led growth motion', 'market_model', 'multi', 'Product-led growth'),
          ],
          charts: [
            {
              title: 'Who is primarily responsible for sales?',
              column: 'sales_primary_responsible',
              aggregation: 'single',
            },
          ],
        },
        {
          id: 'pricing-settling',
          eyebrow: '23 · Pricing is settling',
          title: 'Tiered feature plans jumped 12 points.',
          description:
            'For the first time in the survey, startups are picking a pricing shape earlier in their lifecycle, and they are picking the same one. Tiered feature plans went from 23% to 36% of respondents who picked any pricing model. The "still experimenting" cohort shrank.',
          stats: [
            stat('use tiered feature plans', 'pricing', 'multi', 'Tiered feature plans'),
            stat('use usage-based pricing', 'pricing', 'multi', 'Usage-based pricing'),
            stat('are still experimenting with pricing', 'pricing', 'multi', 'Still experimenting'),
          ],
          charts: [
            {
              title: 'How do you price your product?',
              column: 'pricing',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
      ],
    },
    {
      shortTitle: 'Where they show up',
      title: 'Founders are broadcasting less.',
      description:
        'Conferences emptied out. Social media lost users across every major platform except TikTok. 1 in 10 respondents now says they have given up on social media entirely. 1 in 3 says they have no online persona at all.',
      sections: [
        {
          id: 'social-exit',
          eyebrow: '24 · The quiet exit',
          title: '10% of founders have given up on social media.',
          description:
            'X lost 6 points. LinkedIn lost 3. Reddit and Discord lost 3-4. TikTok was the only platform that grew. The "I have no online persona" share grew 5 points to 33%. One in three respondents is fully offline.',
          stats: [
            stat(
              'use LinkedIn at least 3x a week',
              'regular_social_media_use',
              'multi',
              'LinkedIn'
            ),
            stat(
              'use X (Twitter) at least 3x a week',
              'regular_social_media_use',
              'multi',
              'X (Twitter)'
            ),
            stat(
              'have given up on social media',
              'regular_social_media_use',
              'multi',
              'I’ve given up social media'
            ),
          ],
          charts: [
            {
              title: 'Which social media platforms do you use at least 3x per week?',
              column: 'regular_social_media_use',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
        {
          id: 'conferences',
          eyebrow: '25 · Conferences fell',
          title: '2 in 3 respondents are not attending any industry conference.',
          description:
            'The "none of the above" cohort jumped 10 points. Google Cloud Next, AWS re:Invent, Microsoft Build, and Y Combinator Demo Day all lost share. Conference-led developer marketing is working for a smaller slice of the market every year.',
          stats: [],
          charts: [
            {
              title: 'Which events have you attended or plan to attend?',
              column: 'events',
              aggregation: 'multi',
              maxBars: 10,
            },
          ],
        },
      ],
    },
    {
      shortTitle: 'Outlook',
      title: 'Technical complexity collapsed. New fears took its place.',
      description:
        'The biggest single movement in the entire survey: "technical complexity" as the largest business challenge fell from 24% to 11%. AI ate the hard parts of shipping. What replaced it: burn out, AI-competition fear, runway anxiety. Optimism is mostly flat. Engineers less so.',
      sections: [
        {
          id: 'challenges',
          eyebrow: '26 · Biggest challenge',
          title: 'Technical complexity fell 13 points.',
          description:
            'The largest year-over-year shift in any single category. Three new challenge options came online: burn out, AI competition, runway anxiety. Together they absorb roughly the same share that used to pick technical complexity. Among 1-10 person teams, burn out has already overtaken technical complexity as the second-biggest challenge.',
          pullQuotes: [
            {
              theme: 'Burn out',
              quote: 'Dealing with burn out. I have so much work to do and I feel so overwhelmed',
              author: 'Anonymous respondent in Europe',
            },
            {
              theme: 'Pace of change',
              quote:
                'The fast pace of AI advancement, the feeling that anything I build will be outdated in a month.',
              author: 'Anonymous respondent in Asia',
            },
            {
              theme: 'Competition',
              quote:
                'The environment is very competitive as every can now vibe code and everyone is extra driven to capture opportunity, making everyone have to work harder to keep up.',
              author: 'Anonymous respondent in the San Francisco Bay Area',
            },
            {
              theme: 'Runway',
              quote:
                'Full time work taking up too much of our time, but little runway has us scared to quit and focus on the startup.',
              author: 'Anonymous respondent in North America',
            },
          ],
          stats: [
            stat(
              'name customer acquisition as their biggest challenge',
              'biggest_challenge',
              'single',
              'Customer acquisition'
            ),
            stat(
              'name product-market fit as their biggest challenge',
              'biggest_challenge',
              'single',
              'Product-market fit'
            ),
            stat(
              'name technical complexity as their biggest challenge',
              'biggest_challenge',
              'single',
              'Technical complexity'
            ),
          ],
          charts: [
            {
              title: "What is your startup's biggest business challenge today?",
              column: 'biggest_challenge',
              aggregation: 'single',
              maxBars: 10,
            },
          ],
        },
        {
          id: 'outlook',
          eyebrow: '27 · World outlook',
          title: 'Founders remain upbeat, but not equally.',
          description:
            '57% say they are optimistic, down 1 point from last year, not statistically significant. Founders are 58% optimistic; non-founders are 49%. Flip the cohort toggle to see the gap for yourself.',
          stats: [],
          charts: [
            {
              title: 'Given the state of the world, are you...',
              column: 'world_outlook',
              aggregation: 'single',
            },
          ],
          cohortToggle: {
            eyebrow: 'Cohort',
            key: 'role',
            defaultLabel: 'All',
            options: [
              { label: 'All', filter: null },
              { label: 'Founders', filter: 'Founder / Co-founder' },
              { label: 'Non-Founders', filter: NON_FOUNDERS },
            ],
          },
        },
        {
          id: 'optimism-gap',
          eyebrow: '27b · The optimism gap',
          title: 'The most optimistic founders are also the farthest from revenue.',
          description:
            'Optimism rises with AI codebase share: 49% of zero-AI founders feel optimistic about the world, 60% of heavy AI users do. Revenue runs the other way. 61% of zero-AI users are currently monetizing. 31% of heavy AI users are. The easy reading is that hands-on AI experience demystifies the technology and turns it into something founders feel they can wield. The data is harder than that. The heaviest AI users are also the most likely to be bootstrapped, the earliest in their lifecycle, and the least exposed to whether the market actually wants what they have built. Read the chart as a posture, not a verdict. Shipping faster makes founders feel better. It does not, on its own, make customers pay.',
          pullQuote: {
            quote:
              'Speed of iteration is mind blowing. Even non-technical people can now translate creativity and ideas into tangible assets.',
            author: 'Anonymous respondent in Europe',
          },
          stats: [
            stat(
              'of heavy AI users feel optimistic about the world',
              'world_outlook',
              'single',
              'Optimistic',
              { ai_generated_codebase_percent: '76-100%' }
            ),
            stat(
              'of those same heavy AI users are currently monetizing',
              'currently_monetizing',
              'single',
              'Yes',
              { ai_generated_codebase_percent: '76-100%' }
            ),
            stat(
              'of zero-AI users feel optimistic. The least optimistic cohort builds with the least AI.',
              'world_outlook',
              'single',
              'Optimistic',
              { ai_generated_codebase_percent: '0%' }
            ),
          ],
          charts: [
            {
              kind: 'cross-tab',
              title: 'Optimism rises. Revenue falls. Same x-axis.',
              eyebrow: 'Optimism gap',
              axisColumn: 'ai_generated_codebase_percent',
              cohorts: AI_CODEBASE_COHORTS,
              series: [
                {
                  caption: 'Feel optimistic about the world',
                  tone: 'accent',
                  query: { column: 'world_outlook', aggregation: 'single', target: 'Optimistic' },
                },
                {
                  caption: 'Currently monetizing',
                  tone: 'muted',
                  query: { column: 'currently_monetizing', aggregation: 'single', target: 'Yes' },
                },
              ],
            },
          ],
        },
      ],
    },
  ] as SurveyChapter[],

  participantsList: participants,
}

export default stateOfStartupsData
