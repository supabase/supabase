import { useParams } from 'common'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import GettingStarted, { GettingStartedStep } from './GettingStarted'
import { Code, Database, File, Table, User, Upload, UserPlus, BarChart3 } from 'lucide-react'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useRouter } from 'next/router'
import { useState } from 'react'
import FrameworkSelector from './FrameworkSelector'
import { FRAMEWORKS } from 'components/interfaces/Connect/Connect.constants'
import { AiIconAnimation } from 'ui'

export default function GettingStartedSection() {
  const { data: project } = useSelectedProjectQuery()
  const { ref } = useParams()
  const aiSnap = useAiAssistantStateSnapshot()
  const router = useRouter()

  // Local state for framework selector preview
  const [selectedFramework, setSelectedFramework] = useState<string>(FRAMEWORKS[0]?.key ?? 'nextjs')

  const { data: tablesData } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'public',
  })

  const tablesCount = Math.max(0, tablesData?.length ?? 0)

  return (
    <GettingStarted
      steps={[
        {
          key: 'design-db',
          status: tablesCount > 0 ? 'complete' : 'incomplete',
          title: 'Design your database',
          icon: <Database strokeWidth={1} className="text-foreground-muted" size={16} />,
          description:
            'Start building your app by creating tables with the table editor, SQL editor, or describe what you want with the assistant.',
          actions: [
            { label: 'View tables', href: `/project/${ref}/editor`, variant: 'default' },
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
            { label: 'Table editor', href: `/project/${ref}/editor`, variant: 'default' },
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
          key: 'setup-auth',
          status: 'incomplete',
          title: 'Set up authentication',
          icon: <User strokeWidth={1} className="text-foreground-muted" size={16} />,
          description: 'Configure authentication providers and manage settings for Supabase Auth.',
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
            'Install a client library and connect to your Supabase project to start querying your data.',
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
            { label: 'Create function', href: `/project/${ref}/functions/new`, variant: 'default' },
            { label: 'View functions', href: `/project/${ref}/functions`, variant: 'default' },
          ],
        },
        {
          key: 'monitor-progress',
          status: 'incomplete',
          title: 'Monitor your progress',
          icon: <BarChart3 strokeWidth={1} className="text-foreground-muted" size={16} />,
          description: 'Create custom reports to track API, database, storage, and auth activity.',
          actions: [{ label: 'Reports', href: `/project/${ref}/reports`, variant: 'default' }],
        },
      ]}
    />
  )
}
