import { useState } from 'react'
import { useParams } from 'react-router'
import {
  Badge,
  Button,
  Card,
  Checkbox_Shadcn_ as Checkbox,
  Input,
  Label_Shadcn_ as Label,
  Separator,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
  Toggle,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { Route } from './+types/projects.$ref'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Project Overview' },
    { name: 'description', content: 'Manage your Supabase project' },
  ]
}

export default function ProjectPage() {
  const { ref } = useParams()
  const [loading, setLoading] = useState(false)
  const [enableRls, setEnableRls] = useState(true)

  return (
    <div className="py-8 space-y-8">
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{`Project: ${ref}`}</PageHeaderTitle>
            <PageHeaderDescription>
              Manage your project settings and resources
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <Admonition
        type="default"
        title="Getting started"
        description="This is a lite version of the Supabase Studio. Explore the tabs below to manage your project."
      />

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard title="Database" status="healthy" description="PostgreSQL 15.4" />
            <StatusCard title="API" status="healthy" description="REST & GraphQL" />
            <StatusCard title="Auth" status="warning" description="3 providers active" />
          </div>

          <Card className="p-6 space-y-4">
            <h3>Quick Actions</h3>
            <Separator />
            <div className="flex flex-wrap gap-3">
              <Button type="primary">New Table</Button>
              <Button type="default">SQL Editor</Button>
              <Button type="default">View Logs</Button>
              <Button
                type="outline"
                loading={loading}
                onClick={() => {
                  setLoading(true)
                  setTimeout(() => setLoading(false), 2000)
                }}
              >
                Refresh Status
              </Button>
            </div>
          </Card>

          {loading && (
            <div className="space-y-2">
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="database" className="space-y-6 pt-4">
          <Card className="p-6 space-y-4">
            <h3>Tables</h3>
            <Separator />
            <div className="space-y-3">
              {['users', 'posts', 'comments'].map((table) => (
                <div
                  key={table}
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{table}</span>
                    <Badge variant="default">public</Badge>
                  </div>
                  <Button type="text" size="tiny">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Admonition
            type="warning"
            title="Row Level Security"
            description="Some tables do not have RLS enabled. Consider enabling it for production."
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 pt-4">
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-medium">Project Settings</h3>
            <Separator />

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input id="project-name" placeholder="my-project" defaultValue={ref} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="project-url">Project URL</Label>
                <Input
                  id="project-url"
                  placeholder="https://xyz.supabase.co"
                  disabled
                  defaultValue={`https://${ref}.supabase.co`}
                />
              </div>

              <div className="flex items-center gap-3">
                <Toggle checked={enableRls} onChange={() => setEnableRls(!enableRls)} />
                <Label>Enable RLS by default on new tables</Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox id="confirm" />
                <Label htmlFor="confirm">
                  I understand that changing these settings may affect running services
                </Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="primary">Save Changes</Button>
              <Button type="default">Cancel</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatusCard({
  title,
  status,
  description,
}: {
  title: string
  status: 'healthy' | 'warning' | 'error'
  description: string
}) {
  const badgeVariant =
    status === 'healthy' ? 'success' : status === 'warning' ? 'warning' : 'destructive'

  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">{title}</span>
        <Badge variant={badgeVariant}>{status}</Badge>
      </div>
      <p className="text-sm text-foreground-light">{description}</p>
    </Card>
  )
}
