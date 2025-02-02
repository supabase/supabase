import { Settings, Plus, Save, UserPlus, Database, Key, Trash } from 'lucide-react'
import { Button } from 'ui'
import { Page, PageContent, PageSection } from 'ui-patterns/Page'

export default function PageDemo() {
  return (
    <Page
      // isCompact
      size="small"
      title="Project Settings"
      subtitle="Manage your project settings and configurations"
      // icon={<Settings size={24} />}
      // breadcrumbs={[
      //   { label: 'Projects', href: '#projects' },
      //   { label: 'Example Project', href: '#example-project' },
      //   { label: 'Settings' },
      // ]}
      primaryActions={
        <Button icon={<Plus size={16} />} size="small">
          Create new
        </Button>
      }
      navigation={{
        items: [
          {
            id: 'general',
            label: 'General',
            href: '#general',
            icon: <Database size={16} />,
          },
          {
            id: 'team',
            label: 'Team Members',
            href: '#team',
            icon: <UserPlus size={16} />,
          },
          {
            id: 'api',
            label: 'API Keys',
            href: '#api',
            icon: <Key size={16} />,
          },
        ],
      }}
    >
      <PageContent size="small">
        <PageSection
          title="General Settings"
          subtitle="Basic configuration options for your project"
          actions={
            <Button icon={<Save size={16} />} type="outline" size="small">
              Save changes
            </Button>
          }
        >
          <div className="rounded-md border border-default bg-surface-100 p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-foreground-light">Project Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-default bg-surface-100 px-3 py-2"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="text-sm text-foreground-light">Description</label>
                <textarea
                  className="mt-1 block w-full rounded-md border border-default bg-surface-100 px-3 py-2"
                  rows={3}
                  placeholder="Enter project description"
                />
              </div>
            </div>
          </div>
        </PageSection>

        <PageSection
          title="Team Members"
          subtitle="Manage who has access to this project"
          actions={
            <Button icon={<UserPlus size={16} />} type="outline" size="small">
              Invite member
            </Button>
          }
        >
          <div className="rounded-md border border-default bg-surface-100 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-default">
                <div>
                  <p className="text-sm text-foreground">Alice Johnson</p>
                  <p className="text-xs text-foreground-light">alice@example.com</p>
                </div>
                <div className="text-xs text-foreground-light">Admin</div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-default">
                <div>
                  <p className="text-sm text-foreground">Bob Smith</p>
                  <p className="text-xs text-foreground-light">bob@example.com</p>
                </div>
                <div className="text-xs text-foreground-light">Developer</div>
              </div>
            </div>
          </div>
        </PageSection>

        <PageSection
          title="API Keys"
          subtitle="Manage API keys for accessing your project"
          actions={
            <Button icon={<Key size={16} />} type="outline" size="small">
              Generate key
            </Button>
          }
        >
          <div className="rounded-md border border-default bg-surface-100 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-default">
                <div>
                  <p className="text-sm text-foreground">Production API Key</p>
                  <p className="text-xs text-foreground-light">Created 2 months ago</p>
                </div>
                <Button icon={<Trash size={16} />} type="outline" size="small">
                  Revoke
                </Button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-default">
                <div>
                  <p className="text-sm text-foreground">Development API Key</p>
                  <p className="text-xs text-foreground-light">Created 5 days ago</p>
                </div>
                <Button type="outline" size="small">
                  Revoke
                </Button>
              </div>
            </div>
          </div>
        </PageSection>
      </PageContent>
    </Page>
  )
}
