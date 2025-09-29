import {
  BarChart3,
  Code,
  Database,
  GitBranch,
  Shield,
  Table,
  Table2,
  Upload,
  User,
  UserPlus,
} from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

import { useParams } from 'common'
import { FRAMEWORKS } from 'components/interfaces/Connect/Connect.constants'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH, DOCS_URL } from 'lib/constants'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  AiIconAnimation,
  Button,
  Card,
  CardContent,
  CodeBlock,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'
import { FrameworkSelector } from './FrameworkSelector'
import { GettingStarted } from './GettingStarted'

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
  image?: string
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
  const { data: organization } = useSelectedOrganizationQuery()
  const { ref } = useParams()
  const aiSnap = useAiAssistantStateSnapshot()
  const router = useRouter()
  const { mutate: sendEvent } = useSendEventMutation()

  // Local state for framework selector preview
  const [selectedFramework, setSelectedFramework] = useState<string>(FRAMEWORKS[0]?.key ?? 'nextjs')
  const workflow: 'no-code' | 'code' | null = value === 'code' || value === 'no-code' ? value : null
  const [previousWorkflow, setPreviousWorkflow] = useState<'no-code' | 'code' | null>(null)

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

  const selectedFrameworkMeta = useMemo(
    () => FRAMEWORKS.find((item) => item.key === selectedFramework),
    [selectedFramework]
  )

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
        variant: 'primary',
        onClick: openConnect,
      },
    ],
    [openConnect, openAiChat, selectedFramework, selectedFrameworkMeta?.label]
  )

  const codeSteps: GettingStartedStep[] = useMemo(
    () => [
      {
        key: 'install-cli',
        status: 'incomplete',
        title: 'Install the Supabase CLI',
        icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          'To get started, install the Supabase CLI—our command-line toolkit for managing projects locally, handling migrations, and seeding data—using the npm command below to add it to your workspace.',
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
        image: `${BASE_PATH}/img/getting-started/declarative-schemas.png`,
        description:
          'Next, create a schema file that defines the structure of your database, either following our declarative schema guide or asking the AI assistant to generate one for you.',
        actions: [
          {
            label: 'Create schema file',
            href: `${DOCS_URL}/guides/local-development/declarative-database-schemas`,
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
        description:
          'Now, create a seed file to populate your database with initial data, using the docs for guidance or letting the AI assistant draft realistic inserts.',
        actions: [
          {
            label: 'Create a seed file',
            href: `${DOCS_URL}/guides/local-development/seeding-your-database`,
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
          "Let's secure your data by enabling Row Level Security (per-row access rules that decide who can read or write specific records) and defining policies in a migration file, either configuring them manually or letting the AI assistant draft policies for your tables.",
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
          "It's time to configure your authentication providers and settings for Supabase Auth, so jump into the configuration page and tailor the providers you need.",
        actions: [
          { label: 'Configure', href: `/project/${ref}/auth/providers`, variant: 'default' },
        ],
      },
      {
        key: 'connect-app',
        status: 'incomplete',
        title: 'Connect your application',
        icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          'Your project is ready; use the framework selector to preview starter code and launch the Connect flow with the client library you prefer.',
        actions: connectActions,
      },
      {
        key: 'signup-first-user',
        status: 'incomplete',
        title: 'Sign up your first user',
        icon: <UserPlus strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          'Test your authentication setup by creating the first user account, following the docs if you need a step-by-step walkthrough.',
        actions: [
          {
            label: 'Read docs',
            href: `${DOCS_URL}/guides/auth`,
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
          'Integrate file storage by creating a bucket and uploading a file, starting from the buckets dashboard linked below.',
        actions: [
          { label: 'Buckets', href: `/project/${ref}/storage/buckets`, variant: 'default' },
        ],
      },
      {
        key: 'create-edge-function',
        status: 'incomplete',
        title: 'Deploy an Edge Function',
        icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          'Add server-side logic by creating and deploying your first Edge Function—a lightweight TypeScript or JavaScript function that runs close to your users—then revisit the list to monitor and iterate on it.',
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
          "Track your project's activity by creating custom reports for API, database, and auth events right from the reports dashboard.",
        actions: [{ label: 'Reports', href: `/project/${ref}/reports`, variant: 'default' }],
      },
      {
        key: 'create-first-branch',
        status: hasNonDefaultBranch ? 'complete' : 'incomplete',
        title: 'Connect to GitHub',
        icon: <GitBranch strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          'Streamline your development workflow by connecting your project to GitHub, using the integrations page to automate branch management.',
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
        image: `${BASE_PATH}/img/getting-started/sample.png`,
        description:
          "To kick off your new project, let's start by creating your very first database table using either the table editor or the AI assistant to shape the structure for you.",
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
          "Next, let's add some sample data that you can play with once you connect your app, either by inserting rows yourself or letting the AI assistant craft realistic examples.",
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
          "Now that you have some data, let's secure it by enabling Row Level Security (row-specific access rules that control who can view or modify records) and creating policies yourself or with help from the AI assistant.",
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
        description:
          "It's time to set up authentication so you can start signing up users, configuring providers and settings from the auth dashboard.",
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
        description:
          'Your project is ready; use the framework selector to preview starter code and launch the Connect flow to wire up your app.',
        actions: connectActions,
      },
      {
        key: 'signup-first-user',
        status: 'incomplete',
        title: 'Sign up your first user',
        icon: <UserPlus strokeWidth={1} className="text-foreground-muted" size={16} />,
        description:
          'Test your authentication by signing up your first user, referencing the docs if you need sample flows or troubleshooting tips.',
        actions: [
          {
            label: 'Read docs',
            href: `${DOCS_URL}/guides/auth`,
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
          "Let's add file storage to your app by creating a bucket and uploading your first file from the buckets dashboard.",
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
          "Extend your app's functionality by creating an Edge Function—a lightweight serverless function that executes close to your users—for server-side logic directly from the functions page.",
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
          "Keep an eye on your project's performance and usage by setting up custom reports from the reports dashboard.",
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
          'Safely test changes by creating a preview branch before deploying to production, using the branches view to spin one up.',
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
            onValueChange={(v) => {
              if (v) {
                const newWorkflow = v as 'no-code' | 'code'
                setPreviousWorkflow(workflow)
                onChange(newWorkflow)
                sendEvent({
                  action: 'home_getting_started_workflow_clicked',
                  properties: {
                    workflow: newWorkflow === 'no-code' ? 'no_code' : 'code',
                    is_switch: previousWorkflow !== null,
                  },
                  groups: {
                    project: project?.ref || '',
                    organization: organization?.slug || '',
                  },
                })
              }
            }}
          >
            <ToggleGroupItem
              value="no-code"
              aria-label="No-code workflow"
              size="sm"
              className="text-xs gap-2 h-auto"
            >
              <Table2 size={16} strokeWidth={1.5} />
              Code
            </ToggleGroupItem>
            <ToggleGroupItem
              value="code"
              size="sm"
              aria-label="Code workflow"
              className="text-xs gap-2 h-auto"
            >
              <Code size={16} strokeWidth={1.5} />
              No-code
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            size="tiny"
            type="outline"
            onClick={() => {
              onChange('hidden')
              if (workflow) {
                const completedSteps = (workflow === 'code' ? codeSteps : noCodeSteps).filter(
                  (step) => step.status === 'complete'
                ).length
                const totalSteps = (workflow === 'code' ? codeSteps : noCodeSteps).length
                sendEvent({
                  action: 'home_getting_started_closed',
                  properties: {
                    workflow: workflow === 'no-code' ? 'no_code' : 'code',
                    steps_completed: completedSteps,
                    total_steps: totalSteps,
                  },
                  groups: {
                    project: project?.ref || '',
                    organization: organization?.slug || '',
                  },
                })
              }
            }}
          >
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
                onClick={() => {
                  setPreviousWorkflow(workflow)
                  onChange('no-code')
                  sendEvent({
                    action: 'home_getting_started_workflow_clicked',
                    properties: {
                      workflow: 'no_code',
                      is_switch: previousWorkflow !== null,
                    },
                    groups: {
                      project: project?.ref || '',
                      organization: organization?.slug || '',
                    },
                  })
                }}
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
                onClick={() => {
                  setPreviousWorkflow(workflow)
                  onChange('code')
                  sendEvent({
                    action: 'home_getting_started_workflow_clicked',
                    properties: {
                      workflow: 'code',
                      is_switch: previousWorkflow !== null,
                    },
                    groups: {
                      project: project?.ref || '',
                      organization: organization?.slug || '',
                    },
                  })
                }}
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
        <GettingStarted
          steps={steps}
          onStepClick={({ stepIndex, stepTitle, actionType, wasCompleted }) => {
            if (workflow) {
              sendEvent({
                action: 'home_getting_started_step_clicked',
                properties: {
                  workflow: workflow === 'no-code' ? 'no_code' : 'code',
                  step_number: stepIndex + 1,
                  step_title: stepTitle,
                  action_type: actionType,
                  was_completed: wasCompleted,
                },
                groups: {
                  project: project?.ref || '',
                  organization: organization?.slug || '',
                },
              })
            }
          }}
        />
      )}
    </section>
  )
}
