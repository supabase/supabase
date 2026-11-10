import { useParams } from 'common'
import {
  ActivityIcon,
  BotIcon,
  FileTextIcon,
  GitBranchIcon,
  TerminalIcon,
  TicketIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  GithubIcon,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import AiSreLayout from '@/components/layouts/AiSreLayout/AiSreLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { clearGithubToken, getGithubToken, setGithubToken } from '@/lib/ai-sre/session-credentials'
import type { NextPageWithLayout } from '@/types'

const IconTile = ({ children }: { children: React.ReactNode }) => (
  <Card className="flex h-8 w-8 shrink-0 items-center justify-center p-0">{children}</Card>
)

/** Compact one-row card: icon · name · one-line description · right-aligned action. */
const IntegrationCard = ({
  icon: Icon,
  name,
  description,
  action,
}: {
  icon?: LucideIcon
  name: string
  description: string
  action: React.ReactNode
}) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-3">
      <IconTile>
        {Icon ? <Icon size={16} strokeWidth={1.5} className="text-foreground-light" /> : null}
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{name}</p>
        <p className="truncate text-xs text-foreground-light">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </CardContent>
  </Card>
)

const ComingSoon = () => (
  <Badge variant="default" className="whitespace-nowrap">
    Coming soon
  </Badge>
)

const GitHubCard = ({ projectRef }: { projectRef: string }) => {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState('')
  const [connected, setConnected] = useState(() => !!getGithubToken(projectRef))

  const onConnect = () => {
    if (!token.trim()) return
    setGithubToken(projectRef, token.trim())
    setToken('')
    setConnected(true)
    setOpen(false)
    toast.success('GitHub connected for this session')
  }

  const onDisconnect = () => {
    clearGithubToken(projectRef)
    setConnected(false)
    setOpen(false)
    toast.success('GitHub disconnected')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Card>
        <CardContent className="flex items-center gap-3 p-3">
          <IconTile>
            <GithubIcon size={16} strokeWidth={1.5} />
          </IconTile>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">GitHub</p>
            <p className="truncate text-xs text-foreground-light">
              Connect your repository so the SRE can tie issues to code
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {connected && <Badge variant="success">Connected</Badge>}
            <DialogTrigger asChild>
              <Button type="button" size="tiny">
                {connected ? 'Manage' : 'Connect'}
              </Button>
            </DialogTrigger>
          </div>
        </CardContent>
      </Card>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect GitHub</DialogTitle>
          <DialogDescription>
            Read-only and session-only. Use a fine-grained token scoped read-only to the repo
            (Contents: Read, Pull requests: Read, Metadata: Read). It is kept only in this browser
            session — never stored in your database or on Supabase servers — and is cleared when you
            close the tab, so scheduled runs can't use it yet. The SRE only reads code; it never
            writes.
          </DialogDescription>
        </DialogHeader>

        {!connected ? (
          <Input
            size="small"
            type="password"
            placeholder="Fine-grained PAT (github_pat_…)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        ) : (
          <p className="text-sm text-foreground-light">
            GitHub is connected for this browser session.
          </p>
        )}

        <DialogFooter>
          {connected ? (
            <Button type="button" onClick={onDisconnect}>
              Disconnect
            </Button>
          ) : (
            <Button type="button" onClick={onConnect} disabled={!token.trim()}>
              Connect
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface Section {
  title: string
  description?: string
  items: { icon: LucideIcon; name: string; description: string }[]
}

const SECTIONS: Section[] = [
  {
    title: 'Observability & errors',
    items: [
      {
        icon: TriangleAlertIcon,
        name: 'Sentry',
        description: 'Investigate errors during incidents',
      },
      { icon: ActivityIcon, name: 'Grafana', description: 'Query Prometheus metrics and panels' },
      { icon: ActivityIcon, name: 'Datadog', description: 'Inspect monitors and search logs' },
    ],
  },
  {
    title: 'Ticketing & docs',
    items: [
      { icon: TicketIcon, name: 'Linear', description: 'File and reference issues' },
      { icon: FileTextIcon, name: 'Notion', description: 'Look up runbooks and docs' },
    ],
  },
  {
    title: 'Bring your own agent',
    description:
      'Run the Supabase SRE inside the agent you already use — connect your own account. Coming soon.',
    items: [
      { icon: BotIcon, name: 'Claude Code', description: 'Run the SRE as a routine' },
      { icon: TerminalIcon, name: 'OpenAI Codex', description: 'Run the SRE from a task' },
      { icon: BotIcon, name: 'Cursor', description: 'Run from a background agent' },
      {
        icon: TerminalIcon,
        name: 'GitHub Actions',
        description: 'Run the SRE on a schedule in CI',
      },
    ],
  },
]

const AiSreIntegrationsPage: NextPageWithLayout = () => {
  const { ref } = useParams()

  return (
    <PageContainer size="large">
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Integrations</PageHeaderTitle>
            <PageHeaderDescription>
              Connect the tools the SRE can read from, and the agent harness you want to run it in.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <div className="flex flex-col gap-6 py-6">
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground">Code</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ref && <GitHubCard projectRef={ref} />}
            <IntegrationCard
              icon={GitBranchIcon}
              name="GitLab"
              description="Connect your codebase"
              action={<ComingSoon />}
            />
          </div>
        </section>

        {SECTIONS.map((sectionItem) => (
          <section key={sectionItem.title} className="flex flex-col gap-2">
            <div>
              <h2 className="text-sm font-medium text-foreground">{sectionItem.title}</h2>
              {sectionItem.description && (
                <p className="text-xs text-foreground-light">{sectionItem.description}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sectionItem.items.map((item) => (
                <IntegrationCard
                  key={item.name}
                  icon={item.icon}
                  name={item.name}
                  description={item.description}
                  action={<ComingSoon />}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageContainer>
  )
}

AiSreIntegrationsPage.getLayout = (page) => (
  <DefaultLayout>
    <AiSreLayout title="AI SRE">{page}</AiSreLayout>
  </DefaultLayout>
)

export default AiSreIntegrationsPage
