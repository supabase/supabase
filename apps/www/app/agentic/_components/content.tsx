import {
  BRANCH_DRAWING,
  CODE_DRAWING,
  ISSUES_DRAWING,
  LOCAL_STACK_DRAWING,
  LOGS_DRAWING,
  NOTEBOOKS_DRAWING,
  SUPABASE_AGENT_DRAWING,
  type IsoDrawing,
} from './art'

/** Worded like the Studio Assistant's tool rows: "Checking advisors...", then "Checked advisors". */
export type ToolCall = { running: string; done: string; detail?: string }

export type ChatEmbedData =
  | { type: 'diff'; added: number; removed: number }
  | { type: 'status'; url: string }
  | { type: 'pull-request'; title: string; check: string }
  | { type: 'issue'; title: string; category: string }
  | {
      type: 'chart'
      title: string
      description: string
      values: number[]
      spikeFrom?: number
      /** Whether the bars from `spikeFrom` are good news or bad. Defaults to bad. */
      spikeTone?: 'good' | 'bad'
    }

export type ChatMessage =
  | { from: 'user'; text: string }
  /** An event or scheduled prompt that starts the agent, rather than a person. */
  | { from: 'system'; sender: string; text: string }
  | { from: 'agent'; tools?: ToolCall[]; embed?: ChatEmbedData; text: string }

export type Primitive = {
  id: string
  name: string
  summary: string
  drawing: IsoDrawing
  description: string
  offers: { title: string; description: string }[]
  /** A made-up example of an agent using this primitive. */
  conversation: ChatMessage[]
}

export type Stage = {
  id: string
  title: string
  primitives: Primitive[]
}

// A quiet baseline that jumps partway along. The numbers come from a fixed sequence, so the server
// and the browser draw the same bars.
const spikeSeries = ({
  seed,
  count,
  spikeFrom,
}: {
  seed: number
  count: number
  spikeFrom: number
}) => {
  let state = seed
  return Array.from({ length: count }, (_, index) => {
    state = (state * 31 + 11) % 97
    const noise = state / 97
    return index < spikeFrom ? 1 + noise * 2 : 7 + noise * 5
  })
}

// A steady climb from the same fixed sequence, which can jump near the end
const growthSeries = ({
  seed,
  count,
  surgeFrom = count,
}: {
  seed: number
  count: number
  surgeFrom?: number
}) => {
  let state = seed
  return Array.from({ length: count }, (_, index) => {
    state = (state * 31 + 11) % 97
    const value = 2 + (index / count) * 10 + (state / 97) * 1.5
    return index < surgeFrom ? value : value * 1.8
  })
}

export const STAGES: Stage[] = [
  {
    id: 'build',
    title: 'Build',
    primitives: [
      {
        id: 'code',
        name: 'Code',
        summary: 'Your backend as a folder in your repo.',
        drawing: CODE_DRAWING,
        description:
          'Your backend sits in a folder in your repo, so your agent can read all of it, change it, and show you the diff.',
        offers: [
          {
            title: 'Database',
            description: 'A declarative schema, with migrations and types generated from it.',
          },
          {
            title: 'Compute',
            description: 'Edge Functions, in your functions folder.',
          },
          {
            title: 'Storage',
            description: 'Buckets, size limits, and file types, in config.toml.',
          },
          {
            title: 'Project settings',
            description: 'Auth, API, and database settings, in config.toml.',
          },
        ],
        conversation: [
          {
            from: 'user',
            text: 'Add bookmarks, with thumbnails and link previews. People should only see their own.',
          },
          {
            from: 'agent',
            tools: [
              { running: 'Editing schema', done: 'Edited schema', detail: 'in supabase/schemas' },
              { running: 'Adding bucket', done: 'Added bucket', detail: 'in config.toml' },
              {
                running: 'Writing function',
                done: 'Wrote function',
                detail: 'in supabase/functions',
              },
            ],
            embed: { type: 'diff', added: 86, removed: 0 },
            text: 'Done. RLS limits each bookmark to its owner, thumbnails have their own bucket, and a function fetches link previews. It’s all files, so you can review it before anything runs.',
          },
        ],
      },
      {
        id: 'local-stack',
        name: 'Local stack',
        summary: 'Every service running on your machine.',
        drawing: LOCAL_STACK_DRAWING,
        description:
          'The whole platform runs on your machine, so your agent has somewhere safe to work. It can create, break, and reset a database without going near production.',
        offers: [
          {
            title: 'Every service',
            description: 'Postgres, Auth, Storage, Realtime, and Edge Functions, in Docker.',
          },
          {
            title: 'Studio, locally',
            description: 'A local instance of the dashboard for your local project.',
          },
          {
            title: 'A local MCP server',
            description:
              'Your agent can connect to the stack the same way it connects to a project.',
          },
          {
            title: 'Reset anytime',
            description: 'Rebuild the database from your migrations and seed data.',
          },
        ],
        conversation: [
          { from: 'user', text: 'Try that before we ship it.' },
          {
            from: 'agent',
            tools: [
              { running: 'Starting stack', done: 'Started stack', detail: 'on your machine' },
              { running: 'Resetting database', done: 'Reset database', detail: 'from migrations' },
              { running: 'Checking advisors', done: 'Checked advisors' },
            ],
            embed: { type: 'status', url: 'http://127.0.0.1:54321' },
            text: 'It applies cleanly. The advisors flagged an unindexed foreign key on bookmarks, so I added an index and reset again. All of this stayed on your machine.',
          },
        ],
      },
    ],
  },
  {
    id: 'deploy',
    title: 'Deploy',
    primitives: [
      {
        id: 'branching',
        name: 'Branching',
        summary: 'Preview each pull request, and deploy on merge.',
        drawing: BRANCH_DRAWING,
        description:
          'Each pull request gets its own Supabase instance, built from your migrations rather than copied from production. A person still decides what merges. Branching requires a paid plan.',
        offers: [
          {
            title: 'GitHub integration',
            description: 'Each Git branch gets a Supabase branch.',
          },
          {
            title: 'Built on every push',
            description: 'Config, migrations, seed data, then functions.',
          },
          {
            title: 'No production data',
            description: 'A branch only has the rows your seed files add.',
          },
          {
            title: 'Deploy on merge',
            description: 'New migrations, Edge Functions, and Storage buckets ship with the merge.',
          },
          {
            title: 'A required check',
            description: 'A migration that fails can block the merge.',
          },
        ],
        conversation: [
          { from: 'user', text: 'Looks good. Open a pull request.' },
          {
            from: 'agent',
            tools: [
              { running: 'Opening pull request', done: 'Opened pull request' },
              { running: 'Checking preview', done: 'Checked preview', detail: 'branch' },
            ],
            embed: {
              type: 'pull-request',
              title: 'Add bookmarks',
              check: 'Supabase Preview check passed',
            },
            text: 'The preview branch is up with only your seed data. Merging is up to you.',
          },
          { from: 'user', text: 'Merged.' },
          {
            from: 'agent',
            tools: [
              { running: 'Checking deploy', done: 'Checked deploy', detail: 'to production' },
            ],
            text: 'The migration, bucket, and function are live in production.',
          },
        ],
      },
    ],
  },
  {
    id: 'operate',
    title: 'Operate',
    primitives: [
      {
        id: 'logs',
        name: 'Logs',
        summary: 'Every service in one place, queried with SQL.',
        drawing: LOGS_DRAWING,
        description:
          'Logs from the API, Auth, Storage, Edge Functions, Realtime, and Postgres share one table, so your agent can follow a request across services.',
        offers: [
          {
            title: 'SQL over your logs',
            description: 'Filter, aggregate, and join across log fields.',
          },
          {
            title: 'Read-only access',
            description: 'Your agent can look at production without changing it.',
          },
        ],
        conversation: [
          { from: 'user', text: 'Some people can’t check out. What’s going on?' },
          {
            from: 'agent',
            tools: [
              { running: 'Querying logs', done: 'Queried logs', detail: 'for 500 responses' },
              { running: 'Tracing request', done: 'Traced request', detail: 'into Postgres logs' },
            ],
            embed: {
              type: 'chart',
              title: '500 responses on checkout',
              description: 'Failed checkout requests jump at 14:02 and stay high',
              values: spikeSeries({ seed: 7, count: 64, spikeFrom: 41 }),
              spikeFrom: 41,
            },
            text: 'About 1 in 20 checkout requests have failed since 14:02. Each one hits permission denied on the orders table, right after the last deploy added an RLS policy. I haven’t changed anything yet.',
          },
        ],
      },
      {
        id: 'notebooks',
        name: 'Notebooks',
        summary: 'Evidence, checks, and reports your agent can rerun.',
        drawing: NOTEBOOKS_DRAWING,
        description:
          'A notebook holds queries and notes that your agent can write, run, and read back. The queries stay the same from run to run, so the answer comes from your data rather than the model.',
        offers: [
          {
            title: 'Evidence for a finding',
            description: 'The queries behind what your agent reports, so you can run them too.',
          },
          {
            title: 'Deterministic checks',
            description: 'The same queries whenever your agent runs it.',
          },
          {
            title: 'Personalized reports',
            description: 'Built around what you care about, and readable by your agent.',
          },
          {
            title: 'Queries and charts',
            description: 'Markdown, Postgres, and log cells, and any query can be a chart.',
          },
        ],
        conversation: [
          {
            from: 'user',
            text: 'Create a notebook to monitor user growth, and run it every morning.',
          },
          {
            from: 'agent',
            tools: [
              {
                running: 'Creating notebook',
                done: 'Created notebook',
                detail: 'with a signups query',
              },
              {
                running: 'Setting schedule',
                done: 'Set schedule',
                detail: 'for 9:00 each morning',
              },
            ],
            embed: {
              type: 'chart',
              title: 'User growth',
              description: 'Daily signups climbing steadily',
              values: growthSeries({ seed: 23, count: 64 }),
            },
            text: 'Done. I’ll run it for you every morning at 9:00. It uses the same queries each time, so you can open the notebook to see exactly what I looked at.',
          },
          {
            from: 'system',
            sender: 'your schedule',
            text: 'Look at user growth and highlight any new activity.',
          },
          {
            from: 'agent',
            tools: [{ running: 'Running notebook', done: 'Ran notebook' }],
            embed: {
              type: 'chart',
              title: 'User growth',
              description: 'Signups climb steadily, then jump over the last few days',
              values: growthSeries({ seed: 41, count: 64, surgeFrom: 58 }),
              spikeFrom: 58,
              spikeTone: 'good',
            },
            text: 'Growth is steady, up 18% this week. The new activity is from the last few days: signups nearly doubled, mostly through Google sign-in.',
          },
        ],
      },
      {
        id: 'issues',
        name: 'Issues',
        summary: 'What needs attention, sent to you and your agent.',
        drawing: ISSUES_DRAWING,
        description:
          'An issue is anything that needs attention, with its history attached. Built-in security, performance, and health checks open them when they fail and notify your agent, and agents and people can open them too.',
        offers: [
          {
            title: 'Built-in checks',
            description: 'Missing RLS policies, unindexed foreign keys, and high error rates.',
          },
          {
            title: 'Sent to your agent',
            description: 'A new issue reaches your agent right away, so it can start on the fix.',
          },
          {
            title: 'Linked to the evidence',
            description: 'References the logs and notebooks behind it.',
          },
          {
            title: 'Closed by the fix',
            description: 'An issue closes when its check passes again.',
          },
        ],
        conversation: [
          { from: 'system', sender: 'Supabase', text: 'New issue: RLS is off on public.invoices' },
          {
            from: 'agent',
            tools: [
              { running: 'Reading issue', done: 'Read issue', detail: 'on public.invoices' },
              { running: 'Checking policies', done: 'Checked policies', detail: 'in public' },
            ],
            embed: { type: 'issue', title: 'RLS is off on public.invoices', category: 'Security' },
            text: 'The table is exposed through the API, and it started with yesterday’s deploy. Want me to fix it?',
          },
          { from: 'user', text: 'Yes, go ahead.' },
          {
            from: 'agent',
            tools: [
              { running: 'Writing migration', done: 'Wrote migration' },
              { running: 'Opening pull request', done: 'Opened pull request' },
            ],
            embed: {
              type: 'pull-request',
              title: 'Turn on RLS for invoices',
              check: 'Supabase Preview check passed',
            },
            text: 'Once you merge, the check runs again and the issue closes on its own.',
          },
          {
            from: 'system',
            sender: 'Supabase',
            text: 'New issue: Elevated error rates on checkout',
          },
          {
            from: 'agent',
            tools: [
              { running: 'Reading issue', done: 'Read issue', detail: 'on checkout errors' },
              { running: 'Querying logs', done: 'Queried logs', detail: 'for failed requests' },
            ],
            embed: {
              type: 'chart',
              title: 'Errors on checkout',
              description: 'Checkout errors jump in the last hour',
              values: spikeSeries({ seed: 59, count: 64, spikeFrom: 50 }),
              spikeFrom: 50,
            },
            text: 'The checkout function is timing out on calls to your payment provider. Nothing changed on your side, so I’ve added these logs to the issue and I’ll check again in an hour.',
          },
        ],
      },
      {
        id: 'supabase-agent',
        name: 'Supabase Agent',
        summary: 'A bundled agent that does all of this for you.',
        drawing: SUPABASE_AGENT_DRAWING,
        description:
          'An agent that comes with Supabase and automates everything above, so you don’t have to set it all up yourself with your own agent.',
        offers: [
          {
            title: 'Bundled with Supabase',
            description: 'There’s no agent of your own to connect and configure.',
          },
          {
            title: 'Automates the work',
            description: 'It runs your notebooks, files issues, and acts on what it finds.',
          },
        ],
        conversation: [
          { from: 'system', sender: 'Supabase', text: 'Scheduled run: overnight checks' },
          {
            from: 'agent',
            tools: [
              { running: 'Running checks', done: 'Ran checks' },
              { running: 'Querying logs', done: 'Queried logs', detail: 'for failed sign-ins' },
              {
                running: 'Creating notebook',
                done: 'Created notebook',
                detail: 'with accounts to review',
              },
              { running: 'Opening issues', done: 'Opened issues' },
            ],
            embed: {
              type: 'chart',
              title: 'Notebook: Failed sign-ins overnight',
              description: 'Failed sign-ins jump overnight',
              values: spikeSeries({ seed: 41, count: 64, spikeFrom: 44 }),
              spikeFrom: 44,
            },
            text: 'Two findings. Failed sign-ins jumped against 14 accounts, all from one IP range, so I made this notebook of those accounts and logs for you to review. A slow query on orders has also doubled response times, and the fix is one new index.',
          },
          { from: 'user', text: 'Go ahead with the index.' },
          {
            from: 'agent',
            tools: [
              { running: 'Opening pull request', done: 'Opened pull request' },
              { running: 'Checking preview', done: 'Checked preview', detail: 'branch' },
            ],
            embed: {
              type: 'pull-request',
              title: 'Add an index on orders',
              check: 'Supabase Preview check passed',
            },
            text: 'It’s ready for your review. I’ll close that issue once it’s live.',
          },
        ],
      },
    ],
  },
]
