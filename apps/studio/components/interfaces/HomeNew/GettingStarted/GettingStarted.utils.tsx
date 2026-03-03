import { DOCS_URL } from 'lib/constants'
import { BarChart3, Code, Database, GitBranch, Shield, Table, Upload, UserPlus } from 'lucide-react'
import { AiIconAnimation, CodeBlock } from 'ui'

import type { GettingStartedAction, GettingStartedStep } from './GettingStarted.types'
import type { GettingStartedStatuses } from './useGettingStartedProgress'

type BuildStepsBaseArgs = {
  ref: string | undefined
  openAiChat: (name: string, initialInput: string) => void
  connectActions: GettingStartedAction[]
  statuses: GettingStartedStatuses
}

type BuildCodeStepsArgs = BuildStepsBaseArgs

type BuildNoCodeStepsArgs = BuildStepsBaseArgs

export const getCodeWorkflowSteps = ({
  ref,
  openAiChat,
  connectActions,
  statuses,
}: BuildCodeStepsArgs): GettingStartedStep[] => {
  const {
    hasTables,
    hasCliSetup,
    hasSampleData,
    hasRlsPolicies,
    hasAppConnected,
    hasFirstUser,
    hasStorageObjects,
    hasEdgeFunctions,
    hasReports,
    hasGitHubConnection,
  } = statuses

  return [
    {
      key: 'install-cli',
      status: hasCliSetup ? 'complete' : 'incomplete',
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
      status: hasTables ? 'complete' : 'incomplete',
      title: 'Design your database schema',
      icon: <Database strokeWidth={1} className="text-foreground-muted" size={16} />,
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
      status: hasSampleData ? 'complete' : 'incomplete',
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
      status: hasRlsPolicies ? 'complete' : 'incomplete',
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
      key: 'connect-app',
      status: hasAppConnected ? 'complete' : 'incomplete',
      title: 'Connect your application',
      icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
      description:
        'Your project is ready; open the Connect sheet to grab connection details and setup guidance.',
      actions: connectActions,
    },
    {
      key: 'signup-first-user',
      status: hasFirstUser ? 'complete' : 'incomplete',
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
      status: hasStorageObjects ? 'complete' : 'incomplete',
      title: 'Upload a file',
      icon: <Upload strokeWidth={1} className="text-foreground-muted" size={16} />,
      description:
        'Integrate file storage by creating a bucket via SQL and uploading a file using our client libraries.',
      actions: [
        {
          label: 'Create a bucket via SQL',
          href: `${DOCS_URL}/guides/storage/buckets/creating-buckets?queryGroups=language&language=sql`,
          variant: 'default',
        },
        {
          label: 'Upload a file',
          href: `${DOCS_URL}/guides/storage/uploads/standard-uploads`,
          variant: 'default',
        },
      ],
    },
    {
      key: 'create-edge-function',
      status: hasEdgeFunctions ? 'complete' : 'incomplete',
      title: 'Deploy an Edge Function',
      icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
      description:
        'Add server-side logic by creating and deploying your first Edge Function—a lightweight TypeScript or JavaScript function that runs close to your users—then revisit the list to monitor and iterate on it.',
      actions: [
        {
          label: 'Create and deploy via CLI',
          href: `${DOCS_URL}/guides/functions/quickstart`,
          variant: 'default',
        },
        { label: 'View functions', href: `/project/${ref}/functions`, variant: 'default' },
      ],
    },
    {
      key: 'monitor-progress',
      status: hasReports ? 'complete' : 'incomplete',
      title: "Monitor your project's usage",
      icon: <BarChart3 strokeWidth={1} className="text-foreground-muted" size={16} />,
      description:
        "Track your project's activity by creating custom reports for API, database, and auth events right from the reports dashboard.",
      actions: [{ label: 'Reports', href: `/project/${ref}/reports`, variant: 'default' }],
    },
    {
      key: 'connect-github',
      status: hasGitHubConnection ? 'complete' : 'incomplete',
      title: 'Connect to GitHub',
      icon: <GitBranch strokeWidth={1} className="text-foreground-muted" size={16} />,
      description:
        'Link this project to a GitHub repository to keep production in sync and spin up preview branches from pull requests.',
      actions: [
        {
          label: 'Connect to GitHub',
          href: `/project/${ref}/settings/integrations`,
          variant: 'default',
        },
      ],
    },
  ]
}

export const getNoCodeWorkflowSteps = ({
  ref,
  openAiChat,
  connectActions,
  statuses,
}: BuildNoCodeStepsArgs): GettingStartedStep[] => {
  const {
    hasTables,
    hasSampleData,
    hasRlsPolicies,
    hasAppConnected,
    hasFirstUser,
    hasStorageObjects,
    hasEdgeFunctions,
    hasReports,
    hasGitHubConnection,
  } = statuses

  return [
    {
      key: 'design-db',
      status: hasTables ? 'complete' : 'incomplete',
      title: 'Create your first table',
      icon: <Database strokeWidth={1} className="text-foreground-muted" size={16} />,
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
      status: hasSampleData ? 'complete' : 'incomplete',
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
      status: hasRlsPolicies ? 'complete' : 'incomplete',
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
      key: 'connect-app',
      status: hasAppConnected ? 'complete' : 'incomplete',
      title: 'Connect your application',
      icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
      description:
        'Your project is ready; open the Connect sheet to grab connection details and setup guidance.',
      actions: connectActions,
    },
    {
      key: 'signup-first-user',
      status: hasFirstUser ? 'complete' : 'incomplete',
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
      status: hasStorageObjects ? 'complete' : 'incomplete',
      title: 'Upload a file',
      icon: <Upload strokeWidth={1} className="text-foreground-muted" size={16} />,
      description:
        "Let's add file storage to your app by creating a bucket and uploading your first file from the buckets dashboard.",
      actions: [{ label: 'Buckets', href: `/project/${ref}/storage/files`, variant: 'default' }],
    },
    {
      key: 'create-edge-function',
      status: hasEdgeFunctions ? 'complete' : 'incomplete',
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
      status: hasReports ? 'complete' : 'incomplete',
      title: "Monitor your project's health",
      icon: <BarChart3 strokeWidth={1} className="text-foreground-muted" size={16} />,
      description:
        "Keep an eye on your project's performance and usage by setting up custom reports from the reports dashboard.",
      actions: [{ label: 'Create a report', href: `/project/${ref}/reports`, variant: 'default' }],
    },
    {
      key: 'connect-github',
      status: hasGitHubConnection ? 'complete' : 'incomplete',
      title: 'Connect to GitHub',
      icon: <GitBranch strokeWidth={1} className="text-foreground-muted" size={16} />,
      description:
        'Connect your project to GitHub to automatically create preview branches and sync production changes.',
      actions: [
        {
          label: 'Connect to GitHub',
          href: `/project/${ref}/settings/integrations`,
          variant: 'default',
        },
      ],
    },
  ]
}
