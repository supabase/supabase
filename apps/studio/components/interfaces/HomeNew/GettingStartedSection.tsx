import { useParams } from 'common'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import GettingStarted, { GettingStartedStep } from './GettingStarted'

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
          description:
            'Start building your app by creating tables with the table editor or describe what you want with the assistant',
          imageUrl: '/img/getting-started/one.png',
          actions: [
            { label: 'View tables', href: `/project/${ref}/editor`, variant: 'default' },
            { label: 'Do it for me', href: `/project/${ref}/sql/templates`, variant: 'default' },
          ],
        },
        {
          key: 'add-data',
          status: 'incomplete',
          title: 'Add some data',
          description:
            'Use the table editor to create some sample data, or ask the Assistant to generate some data for you.',
          imageUrl: '/img/getting-started/two.jpg',
          actions: [
            { label: 'Table editor', href: `/project/${ref}/editor`, variant: 'default' },
            { label: 'Run SQL', href: `/project/${ref}/sql/new`, variant: 'default' },
          ],
        },
        {
          key: 'implement-auth',
          status: 'incomplete',
          title: 'Implement auth',
          description: 'Set up authentication and manage users using Supabase Auth.',
          imageUrl: '/img/getting-started/four.webp',
          actions: [
            { label: 'Users', href: `/project/${ref}/auth/users`, variant: 'default' },
            { label: 'Auth settings', href: `/project/${ref}/auth/settings`, variant: 'default' },
          ],
        },
        {
          key: 'implement-storage',
          status: 'incomplete',
          title: 'Implement storage',
          description: 'Create buckets and manage files with Supabase Storage.',
          imageUrl: '/img/getting-started/three.webp',
          actions: [
            { label: 'Buckets', href: `/project/${ref}/storage/buckets`, variant: 'default' },
            { label: 'Policies', href: `/project/${ref}/storage/policies`, variant: 'default' },
          ],
        },
        {
          key: 'connect-app',
          status: 'incomplete',
          title: 'Connect your app',
          description:
            'Install a client library and connect to your Supabase project to start querying your data',
          imageUrl: '/img/getting-started/one.png',
          actions: [
            { label: 'Client libraries', href: `/project/${ref}/settings/api`, variant: 'default' },
            { label: 'Quickstarts', href: `/project/${ref}/sql/quickstarts`, variant: 'default' },
          ],
        },
      ]}
    />
  )
}