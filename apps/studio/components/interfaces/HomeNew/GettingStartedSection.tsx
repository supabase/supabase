import { useParams } from 'common'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import GettingStarted, { GettingStartedStep } from './GettingStarted'
import {
  Code,
  Database,
  File,
  Table,
  User,
  Upload,
  UserPlus,
  BarChart3,
  Shield,
  Table2,
  GitBranch,
} from 'lucide-react'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useRouter } from 'next/router'
import { useState } from 'react'
import FrameworkSelector from './FrameworkSelector'
import { FRAMEWORKS } from 'components/interfaces/Connect/Connect.constants'
import {
  AiIconAnimation,
  Button,
  Card,
  CardContent,
  CodeBlock,
  SimpleCodeBlock,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'
import { BASE_PATH } from 'lib/constants'

type GettingStartedState = 'empty' | 'code' | 'no-code' | 'hidden'

export default function GettingStartedSection({
  value,
  onChange,
}: {
  value: GettingStartedState
  onChange: (v: GettingStartedState) => void
}) {
  const { data: project } = useSelectedProjectQuery()
  const { ref } = useParams()
  const aiSnap = useAiAssistantStateSnapshot()
  const router = useRouter()

  // Local state for framework selector preview
  const [selectedFramework, setSelectedFramework] = useState<string>(FRAMEWORKS[0]?.key ?? 'nextjs')
  const workflow: 'no-code' | 'code' | null = value === 'code' || value === 'no-code' ? value : null

  const { data: tablesData } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'public',
  })

  const tablesCount = Math.max(0, tablesData?.length ?? 0)
  const { data: branchesData } = useBranchesQuery({
    projectRef: project?.parent_project_ref ?? project?.ref,
  })
  const isDefaultProject = project?.parent_project_ref === undefined
  const hasNonDefaultBranch =
    (branchesData ?? []).some((b) => !b.is_default) || isDefaultProject === false

  const steps: GettingStartedStep[] =
    workflow === 'code'
      ? [
          {
            key: 'install-cli',
            status: 'incomplete',
            title: 'Install CLI',
            icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
            description: 'Install the Supabase CLI for local development, migrations, and seeding.',
            actions: [
              {
                label: 'Install via npm',
                component: (
                  <CodeBlock className="w-full text-xs p-3 !bg" language="bash">
                    npm install supabase --save-dev
                  </CodeBlock>
                ),
              },
            ],
          },
          {
            key: 'design-db',
            status: tablesCount > 0 ? 'complete' : 'incomplete',
            title: 'Design your database',
            icon: <Database strokeWidth={1} className="text-foreground-muted" size={16} />,
            description:
              'Create your first schema file with the state you want your database to be in',
            actions: [
              {
                label: 'Create schema file',
                href: 'https://supabase.com/docs/guides/local-development/declarative-database-schemas',
                variant: 'default',
              },
              {
                label: 'Generate it',
                variant: 'default',
                icon: <AiIconAnimation size={14} />,
                onClick: () =>
                  aiSnap.newChat({
                    name: 'Design my database',
                    open: true,
                    initialInput:
                      'Help me create a schema file for my database. We will be using Supabase declarative schemas which you can learn about by searching docs for declarative schema.',
                  }),
              },
            ],
          },
          {
            key: 'add-data',
            status: 'incomplete',
            title: 'Add some data',
            icon: <Table strokeWidth={1} className="text-foreground-muted" size={16} />,
            description:
              'Create a seed file to populate your database and any branches with seed data',
            actions: [
              {
                label: 'Create a seed file',
                href: 'https://supabase.com/docs/guides/local-development/seeding-your-database',
                variant: 'default',
              },
              {
                label: 'Generate data',
                variant: 'default',
                icon: <AiIconAnimation size={14} />,
                onClick: () =>
                  aiSnap.newChat({
                    name: 'Generate seed data',
                    open: true,
                    initialInput:
                      'Generate SQL INSERT statements for realistic seed data that I can run via the Supabase CLI.',
                  }),
              },
            ],
          },
          {
            key: 'add-rls-policies',
            status: 'incomplete',
            title: 'Add RLS policies',
            icon: <Shield strokeWidth={1} className="text-foreground-muted" size={16} />,
            description:
              'Enable Row Level Security and define policies to control access to your data.',
            actions: [
              {
                label: 'Create a migration file',
                href: `/project/${ref}/auth/policies`,
                variant: 'default',
              },
              {
                label: 'Create policies for me',
                variant: 'default',
                icon: <AiIconAnimation size={14} />,
                onClick: () =>
                  aiSnap.newChat({
                    name: 'Generate RLS policies',
                    open: true,
                    initialInput:
                      'Generate RLS policies for my existing tables in the public schema and guide me through the process of adding them as migration files to my codebase ',
                  }),
              },
            ],
          },
          {
            key: 'setup-auth',
            status: 'incomplete',
            title: 'Set up authentication',
            icon: <User strokeWidth={1} className="text-foreground-muted" size={16} />,
            description:
              'Configure authentication providers and manage settings for Supabase Auth.',
            actions: [
              { label: 'Configure', href: `/project/${ref}/auth/providers`, variant: 'default' },
            ],
          },
          {
            key: 'connect-app',
            status: 'incomplete',
            title: 'Connect your app',
            icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
            description:
              'Connect your app to your Supabase project using one of our client libraries and optional, pre-built UI components',
            actions: [
              {
                label: 'Framework selector',
                component: (
                  <FrameworkSelector
                    value={selectedFramework}
                    onChange={setSelectedFramework}
                    items={FRAMEWORKS}
                    label="Framework"
                  />
                ),
              },
              {
                label: 'Connect',
                variant: 'default',
                onClick: () =>
                  router.push(
                    {
                      pathname: router.pathname,
                      query: {
                        ...router.query,
                        showConnect: true,
                        connectTab: 'frameworks',
                        framework: selectedFramework,
                      },
                    },
                    undefined,
                    { shallow: true }
                  ),
              },
            ],
          },
          {
            key: 'signup-first-user',
            status: 'incomplete',
            title: 'Sign up your first user',
            icon: <UserPlus strokeWidth={1} className="text-foreground-muted" size={16} />,
            description: 'Create your first user account to test authentication flows.',
            actions: [
              {
                label: 'Read docs',
                href: 'https://supabase.com/docs/guides/auth',
                variant: 'default',
              },
            ],
          },
          {
            key: 'upload-file',
            status: 'incomplete',
            title: 'Upload a file',
            icon: <Upload strokeWidth={1} className="text-foreground-muted" size={16} />,
            description: 'Create a bucket and upload your first file with Supabase Storage.',
            actions: [
              { label: 'Buckets', href: `/project/${ref}/storage/buckets`, variant: 'default' },
            ],
          },
          {
            key: 'create-edge-function',
            status: 'incomplete',
            title: 'Create your first edge function',
            icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
            description:
              'Build and deploy an edge function to run server-side logic close to your users.',
            actions: [
              {
                label: 'Create a function',
                href: `/project/${ref}/functions/new`,
                variant: 'default',
              },
              { label: 'View functions', href: `/project/${ref}/functions`, variant: 'default' },
            ],
          },
          {
            key: 'monitor-progress',
            status: 'incomplete',
            title: 'Monitor your progress',
            icon: <BarChart3 strokeWidth={1} className="text-foreground-muted" size={16} />,
            description:
              'Create custom reports to track API, database, storage, and auth activity.',
            actions: [{ label: 'Reports', href: `/project/${ref}/reports`, variant: 'default' }],
          },
          {
            key: 'create-first-branch',
            status: hasNonDefaultBranch ? 'complete' : 'incomplete',
            title: 'Create your first branch',
            icon: <GitBranch strokeWidth={1} className="text-foreground-muted" size={16} />,
            description:
              'Connect GitHub to automatically create and merge Supabase branches for every PR',
            actions: [
              {
                label: 'Connect to GitHub',
                href: `/project/${ref}/settings/integrations`,
                variant: 'default',
              },
            ],
          },
        ]
      : workflow === 'no-code'
        ? [
            {
              key: 'design-db',
              status: tablesCount > 0 ? 'complete' : 'incomplete',
              title: 'Design your database',
              icon: <Database strokeWidth={1} className="text-foreground-muted" size={16} />,
              description:
                'Start building your app by creating tables with the table editor, SQL editor, or describe what you want with the assistant.',
              actions: [
                { label: 'Create a table', href: `/project/${ref}/editor`, variant: 'default' },
                {
                  label: 'Do it for me',
                  variant: 'default',
                  icon: <AiIconAnimation size={14} />,
                  onClick: () =>
                    aiSnap.newChat({
                      name: 'Design my database',
                      open: true,
                      initialInput:
                        'I want to design my database schema. Please propose tables, relationships, and SQL to create them for my app. Ask clarifying questions if needed.',
                    }),
                },
              ],
            },
            {
              key: 'add-data',
              status: 'incomplete',
              title: 'Add some data',
              icon: <Table strokeWidth={1} className="text-foreground-muted" size={16} />,
              description:
                'Use the table editor to create sample data, or ask the Assistant to generate it for you.',
              actions: [
                { label: 'Add data', href: `/project/${ref}/editor`, variant: 'default' },
                {
                  label: 'Do it for me',
                  variant: 'default',
                  icon: <AiIconAnimation size={14} />,
                  onClick: () =>
                    aiSnap.newChat({
                      name: 'Generate sample data',
                      open: true,
                      initialInput:
                        'Generate SQL INSERT statements to add realistic sample data to my existing tables. Use safe defaults and avoid overwriting data.',
                    }),
                },
              ],
            },
            {
              key: 'add-rls-policies',
              status: 'incomplete',
              title: 'Add RLS policies',
              icon: <Shield strokeWidth={1} className="text-foreground-muted" size={16} />,
              description:
                'Create a migration file to enable Row Level Security and create policies on each of your tables',
              actions: [
                {
                  label: 'Create a policy',
                  href: `/project/${ref}/auth/policies`,
                  variant: 'default',
                },
                {
                  label: 'Do it for me',
                  variant: 'default',
                  icon: <AiIconAnimation size={14} />,
                  onClick: () =>
                    aiSnap.newChat({
                      name: 'Generate RLS policies',
                      open: true,
                      initialInput:
                        'Generate RLS policies for my existing tables in the public schema. ',
                    }),
                },
              ],
            },
            {
              key: 'setup-auth',
              status: 'incomplete',
              title: 'Set up authentication',
              icon: <User strokeWidth={1} className="text-foreground-muted" size={16} />,
              description:
                'Configure authentication providers and manage settings for Supabase Auth.',
              actions: [
                {
                  label: 'Configure auth',
                  href: `/project/${ref}/auth/providers`,
                  variant: 'default',
                },
              ],
            },
            {
              key: 'connect-app',
              status: 'incomplete',
              title: 'Connect your app',
              icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
              description:
                'Connect your app to your Supabase project using one of our client libraries and optional, pre-built React components',
              actions: [
                {
                  label: 'Framework selector',
                  component: (
                    <FrameworkSelector
                      value={selectedFramework}
                      onChange={setSelectedFramework}
                      items={FRAMEWORKS}
                      label="Framework"
                    />
                  ),
                },
                {
                  label: 'Connect',
                  variant: 'default',
                  onClick: () =>
                    router.push(
                      {
                        pathname: router.pathname,
                        query: {
                          ...router.query,
                          showConnect: true,
                          connectTab: 'frameworks',
                          framework: selectedFramework,
                        },
                      },
                      undefined,
                      { shallow: true }
                    ),
                },
              ],
            },
            {
              key: 'signup-first-user',
              status: 'incomplete',
              title: 'Sign up your first user',
              icon: <UserPlus strokeWidth={1} className="text-foreground-muted" size={16} />,
              description: 'Create your first user account to test authentication flows.',
              actions: [
                {
                  label: 'Read docs',
                  href: 'https://supabase.com/docs/guides/auth',
                  variant: 'default',
                },
              ],
            },
            {
              key: 'upload-file',
              status: 'incomplete',
              title: 'Upload a file',
              icon: <Upload strokeWidth={1} className="text-foreground-muted" size={16} />,
              description: 'Create a bucket and upload your first file with Supabase Storage.',
              actions: [
                { label: 'Buckets', href: `/project/${ref}/storage/buckets`, variant: 'default' },
              ],
            },
            {
              key: 'create-edge-function',
              status: 'incomplete',
              title: 'Create your first edge function',
              icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
              description:
                'Build and deploy an edge function to run server-side logic close to your users.',
              actions: [
                {
                  label: 'Create a function',
                  href: `/project/${ref}/functions/new`,
                  variant: 'default',
                },
              ],
            },
            {
              key: 'monitor-progress',
              status: 'incomplete',
              title: 'Monitor your progress',
              icon: <BarChart3 strokeWidth={1} className="text-foreground-muted" size={16} />,
              description:
                'Create custom reports to track API, database, storage, and auth activity.',
              actions: [
                { label: 'Create a report', href: `/project/${ref}/reports`, variant: 'default' },
              ],
            },
            {
              key: 'create-first-branch',
              status: hasNonDefaultBranch ? 'complete' : 'incomplete',
              title: 'Create your first branch',
              icon: <GitBranch strokeWidth={1} className="text-foreground-muted" size={16} />,
              description: 'Create a preview branch to safely test changes before merging.',
              actions: [
                { label: 'Create a branch', href: `/project/${ref}/branches`, variant: 'default' },
              ],
            },
          ]
        : []

  return (
    <GettingStarted
      onDismiss={() => onChange('hidden')}
      headerRight={
        <ToggleGroup
          type="single"
          value={workflow ?? undefined}
          onValueChange={(v) => v && onChange(v as 'no-code' | 'code')}
        >
          <ToggleGroupItem
            value="no-code"
            aria-label="No-code workflow"
            className="w-[26px] h-[26px] p-0"
          >
            <Table2 size={16} strokeWidth={1.5} className="text-foreground" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="code"
            aria-label="Code workflow"
            className="w-[26px] h-[26px] p-0"
          >
            <Code size={16} strokeWidth={1.5} className="text-foreground" />
          </ToggleGroupItem>
        </ToggleGroup>
      }
      steps={steps}
      emptyContent={
        <Card className="bg-background/25 border-dashed relative">
          <div className="absolute -inset-16 z-0 opacity-50">
            <img
              src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
              alt="Supabase Grafana"
              className="w-full h-full object-cover object-right hidden dark:block"
            />
            <img
              src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
              alt="Supabase Grafana"
              className="w-full h-full object-cover object-right dark:hidden"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
          </div>
          <CardContent className="relative z-10 p-8 md:p-12 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="heading-subSection mb-0 heading-meta text-foreground-light mb-4">
                Choose a preferred workflow
              </h2>
              <p className="text-foreground">
                With Supabase, you have the flexibility to adopt a workflow that works for you. You
                can do everything via the dashboard, or manage your entire project within your own
                codebase.
              </p>
            </div>
            <div className="flex items-stretch gap-4">
              <Button
                size="medium"
                type="outline"
                onClick={() => onChange('no-code')}
                className="block gap-2 h-auto p-4 md:p-8 max-w-80 text-left justify-start bg-background "
              >
                <Table2 size={20} strokeWidth={1.5} className="text-brand" />
                <div className="mt-4">
                  <div>No-code</div>
                  <div className="text-foreground-light w-full whitespace-normal">
                    Ideal for prototyping or getting your project up and running
                  </div>
                </div>
              </Button>
              <Button
                size="medium"
                type="outline"
                onClick={() => onChange('code')}
                className="bg-background block gap-2 h-auto p-4 md:p-8 max-w-80 text-left justify-start"
              >
                <Code size={20} strokeWidth={1.5} className="text-brand" />
                <div className="mt-4">
                  <div>Code</div>
                  <div className="text-foreground-light whitespace-normal">
                    Ideal for teams that want full control of their project
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      }
    />
  )
}
