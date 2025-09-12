import { useParams } from 'common'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { GettingStarted } from './GettingStarted'
import {
  Code,
  Database,
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
import { useCallback, useMemo, useState } from 'react'
import { FrameworkSelector } from './FrameworkSelector'
import { FRAMEWORKS } from 'components/interfaces/Connect/Connect.constants'
import {
  AiIconAnimation,
  Button,
  Card,
  CardContent,
  CodeBlock,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'
import { BASE_PATH } from 'lib/constants'

export type GettingStartedAction = {
  label: string
  href?: string
  onClick?: () => void
  variant?: React.ComponentProps<typeof Button>['type']
  icon?: React.ReactNode
  component?: React.ReactNode
}

export type GettingStartedStep = {
  key: string
  status: 'complete' | 'incomplete'
  icon?: React.ReactNode
  title: string
  description: string
  image?: React.ReactNode
  actions: GettingStartedAction[]
}

export type GettingStartedState = 'empty' | 'code' | 'no-code' | 'hidden'

export function GettingStartedSection({
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

  // Helpers
  const openAiChat = useCallback(
    (name: string, initialInput: string) => aiSnap.newChat({ name, open: true, initialInput }),
    [aiSnap]
  )

  const openConnect = useCallback(() => {
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
    )
  }, [router, selectedFramework])

  const connectActions: GettingStartedAction[] = useMemo(
    () => [
      {
        label: 'Framework selector',
        component: (
          <FrameworkSelector
            value={selectedFramework}
            onChange={setSelectedFramework}
            items={FRAMEWORKS}
          />
        ),
      },
      {
        label: 'Connect',
        variant: 'default',
        onClick: openConnect,
      },
    ],
    [openConnect, selectedFramework]
  )

  const codeSteps: GettingStartedStep[] = useMemo(
    () => [
      {
        key: 'install-cli',
        status: 'incomplete',
        title: 'Install the Supabase CLI',
        icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          'To get started, install the Supabase CLI to manage your project locally, handle migrations, and seed data.',
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
        title: 'Design your database schema',
        icon: <Database strokeWidth={1} className="text-foreground-muted" size={16} />,
        description: 'Next, create a schema file that defines the structure of your database.',
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
              openAiChat(
                'Design my database',
                'Help me create a schema file for my database. We will be using Supabase declarative schemas which you can learn about by searching docs for declarative schema.'
              ),
          },
        ],
      },
      {
        key: 'add-data',
        status: 'incomplete',
        title: 'Seed your database with data',
        icon: <Table strokeWidth={1} className="text-foreground-muted" size={16} />,
        description: 'Now, create a seed file to populate your database with initial data.',
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
              openAiChat(
                'Generate seed data',
                'Generate SQL INSERT statements for realistic seed data that I can run via the Supabase CLI.'
              ),
          },
        ],
      },
      {
        key: 'add-rls-policies',
        status: 'incomplete',
        title: 'Secure your data with RLS policies',
        icon: <Shield strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          "Let's secure your data by enabling Row Level Security and defining access policies in a migration file.",
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
              openAiChat(
                'Generate RLS policies',
                'Generate RLS policies for my existing tables in the public schema and guide me through the process of adding them as migration files to my codebase '
              ),
          },
        ],
      },
      {
        key: 'setup-auth',
        status: 'incomplete',
        title: 'Configure authentication',
        icon: <User strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          "It's time to configure your authentication providers and settings for Supabase Auth.",
        actions: [
          { label: 'Configure', href: `/project/${ref}/auth/providers`, variant: 'default' },
        ],
      },
      {
        key: 'connect-app',
        status: 'incomplete',
        title: 'Connect your application',
        icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
        description: 'Your project is ready. Connect your app using one of our client libraries.',
        actions: connectActions,
      },
      {
        key: 'signup-first-user',
        status: 'incomplete',
        title: 'Sign up your first user',
        icon: <UserPlus strokeWidth={1} className="text-foreground-muted" size={16} />,
        description: 'Test your authentication setup by creating the first user account.',
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
        description: 'Integrate file storage by creating a bucket and uploading a file.',
        actions: [
          { label: 'Buckets', href: `/project/${ref}/storage/buckets`, variant: 'default' },
        ],
      },
      {
        key: 'create-edge-function',
        status: 'incomplete',
        title: 'Deploy an Edge Function',
        icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
        description: 'Add server-side logic by creating and deploying your first Edge Function.',
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
        title: "Monitor your project's usage",
        icon: <BarChart3 strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          "Track your project's activity by creating custom reports for API, database, and auth events.",
        actions: [{ label: 'Reports', href: `/project/${ref}/reports`, variant: 'default' }],
      },
      {
        key: 'create-first-branch',
        status: hasNonDefaultBranch ? 'complete' : 'incomplete',
        title: 'Connect to GitHub',
        icon: <GitBranch strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          'Streamline your development workflow by connecting your project to GitHub to automatically manage branches.',
        actions: [
          {
            label: 'Connect to GitHub',
            href: `/project/${ref}/settings/integrations`,
            variant: 'default',
          },
        ],
      },
    ],
    [tablesCount, ref, openAiChat, connectActions, hasNonDefaultBranch]
  )

  const noCodeSteps: GettingStartedStep[] = useMemo(
    () => [
      {
        key: 'design-db',
        status: tablesCount > 0 ? 'complete' : 'incomplete',
        title: 'Create your first table',
        icon: <Database strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          "To kick off your new project, let's start by creating your very first database table using either the table editor or AI Assistant.",
        actions: [
          { label: 'Create a table', href: `/project/${ref}/editor`, variant: 'default' },
          {
            label: 'Do it for me',
            variant: 'default',
            icon: <AiIconAnimation size={14} />,
            onClick: () =>
              openAiChat(
                'Design my database',
                'I want to design my database schema. Please propose tables, relationships, and SQL to create them for my app. Ask clarifying questions if needed.'
              ),
          },
        ],
      },
      {
        key: 'add-data',
        status: 'incomplete',
        title: 'Add sample data',
        icon: <Table strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          "Next, let's add some sample data that you can play with once you connect your app.",
        actions: [
          { label: 'Add data', href: `/project/${ref}/editor`, variant: 'default' },
          {
            label: 'Do it for me',
            variant: 'default',
            icon: <AiIconAnimation size={14} />,
            onClick: () =>
              openAiChat(
                'Generate sample data',
                'Generate SQL INSERT statements to add realistic sample data to my existing tables. Use safe defaults and avoid overwriting data.'
              ),
          },
        ],
      },
      {
        key: 'add-rls-policies',
        status: 'incomplete',
        title: 'Secure your data with Row Level Security',
        icon: <Shield strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          "Now that you have some data, let's secure it by enabling Row Level Security and creating policies.",
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
              openAiChat(
                'Generate RLS policies',
                'Generate RLS policies for my existing tables in the public schema. '
              ),
          },
        ],
      },
      {
        key: 'setup-auth',
        status: 'incomplete',
        title: 'Set up authentication',
        icon: <User strokeWidth={1} className="text-foreground-muted" size={16} />,
        description: "It's time to set up authentication so you can start signing up users.",
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
        title: 'Connect your application',
        icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
        description: "Your project is ready. Let's connect your application to Supabase.",
        actions: connectActions,
      },
      {
        key: 'signup-first-user',
        status: 'incomplete',
        title: 'Sign up your first user',
        icon: <UserPlus strokeWidth={1} className="text-foreground-muted" size={16} />,
        description: 'Test your authentication by signing up your first user.',
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
        description:
          "Let's add file storage to your app by creating a bucket and uploading your first file.",
        actions: [
          { label: 'Buckets', href: `/project/${ref}/storage/buckets`, variant: 'default' },
        ],
      },
      {
        key: 'create-edge-function',
        status: 'incomplete',
        title: 'Add server-side logic',
        icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          "Extend your app's functionality by creating an Edge Function for server-side logic.",
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
        title: "Monitor your project's health",
        icon: <BarChart3 strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          "Keep an eye on your project's performance and usage by setting up custom reports.",
        actions: [
          { label: 'Create a report', href: `/project/${ref}/reports`, variant: 'default' },
        ],
      },
      {
        key: 'create-first-branch',
        status: hasNonDefaultBranch ? 'complete' : 'incomplete',
        title: 'Create a branch to test changes',
        icon: <GitBranch strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          'Safely test changes by creating a preview branch before deploying to production.',
        actions: [
          { label: 'Create a branch', href: `/project/${ref}/branches`, variant: 'default' },
        ],
      },
    ],
    [tablesCount, ref, openAiChat, connectActions, hasNonDefaultBranch]
  )

  const steps = workflow === 'code' ? codeSteps : workflow === 'no-code' ? noCodeSteps : []

  return (
    <section className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="heading-section">Getting started</h3>
        <div className="flex items-center gap-2">
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
          <Button size="tiny" type="outline" onClick={() => onChange('hidden')}>
            Dismiss
          </Button>
        </div>
      </div>

      {steps.length === 0 ? (
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
      ) : (
        <GettingStarted steps={steps} />
      )}
    </section>
  )
}
