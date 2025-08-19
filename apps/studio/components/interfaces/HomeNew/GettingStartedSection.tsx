import { useParams } from 'common'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import GettingStarted, { GettingStartedStep } from './GettingStarted'
import { Code, Database, File, Table, User } from 'lucide-react'

export default function GettingStartedSection() {
  const { data: project } = useSelectedProjectQuery()
  const { ref } = useParams()

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
            'Start building your app by creating tables with the table editor, sql editor or describe what you want with the assistant',
          actions: [
            { label: 'View tables', href: `/project/${ref}/editor`, variant: 'default' },
            { label: 'Do it for me', href: `/project/${ref}/sql/templates`, variant: 'default' },
          ],
        },
        {
          key: 'add-data',
          status: 'incomplete',
          title: 'Add some data',
          icon: <Table strokeWidth={1} className="text-foreground-muted" size={16} />,
          description:
            'Use the table editor to create some sample data, or ask the Assistant to generate some data for you.',
          actions: [
            { label: 'Table editor', href: `/project/${ref}/editor`, variant: 'default' },
            { label: 'Run SQL', href: `/project/${ref}/sql/new`, variant: 'default' },
          ],
        },
        {
          key: 'implement-auth',
          status: 'incomplete',
          title: 'Implement auth',
          icon: <User strokeWidth={1} className="text-foreground-muted" size={16} />,
          description: 'Set up authentication and manage users using Supabase Auth.',
          actions: [
            { label: 'Users', href: `/project/${ref}/auth/users`, variant: 'default' },
            { label: 'Auth settings', href: `/project/${ref}/auth/settings`, variant: 'default' },
          ],
        },
        {
          key: 'implement-storage',
          status: 'incomplete',
          title: 'Implement storage',
          icon: <File strokeWidth={1} className="text-foreground-muted" size={16} />,
          description: 'Create buckets and manage files with Supabase Storage.',
          actions: [
            { label: 'Buckets', href: `/project/${ref}/storage/buckets`, variant: 'default' },
            { label: 'Policies', href: `/project/${ref}/storage/policies`, variant: 'default' },
          ],
        },
        {
          key: 'connect-app',
          status: 'incomplete',
          title: 'Connect your app',
          icon: <Code strokeWidth={1} className="text-foreground-muted" size={16} />,
          description:
            'Install a client library and connect to your Supabase project to start querying your data',
          actions: [
            { label: 'Client libraries', href: `/project/${ref}/settings/api`, variant: 'default' },
            { label: 'Quickstarts', href: `/project/${ref}/sql/quickstarts`, variant: 'default' },
          ],
        },
      ]}
    />
  )
}
