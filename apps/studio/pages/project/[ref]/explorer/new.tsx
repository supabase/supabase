import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { ExplorerLayout } from 'components/layouts/explorer/layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { useProfile } from 'lib/profile'
import { BarChart2, Search, Table2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { NextPageWithLayout } from 'types'
import { Badge, Button, Card, cn, SQL_ICON } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { v4 as uuidv4 } from 'uuid'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { toast } from 'sonner'
import { removeNewTab } from 'state/tabs'

const ExplorerNewPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { ref } = router.query

  const handleNewQuery = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')

    try {
      const snippet = createSqlSnippetSkeletonV2({
        id: uuidv4(),
        name: untitledSnippetTitle,
        owner_id: profile.id,
        project_id: project.id,
        sql: '',
      })
      snapV2.addSnippet({ projectRef: ref as string, snippet })
      removeNewTab('explorer')
      router.push(`/project/${ref}/sql/${snippet.id}`)
    } catch (error: any) {
      toast.error(`Failed to create new query: ${error.message}`)
    }
  }

  return (
    <div className="bg-surface-100 p-6 h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Action Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Table2 className="h-6 w-6 text-foreground" strokeWidth={1.5} />,
              title: 'New Table',
              description: 'Create Postgres tables',
              bgColor: 'bg-blue-500',
              isBeta: false,
            },
            {
              icon: <SQL_ICON className={cn('fill-foreground', 'w-6 h-6')} strokeWidth={1.5} />,
              title: 'New Query',
              description: 'Write and execute SQL queries',
              bgColor: 'bg-violet-500',
              isBeta: false,
              onClick: handleNewQuery,
            },
            {
              icon: <BarChart2 className="h-6 w-6 text-foreground" strokeWidth={2} />,
              title: 'New Report',
              description: 'Create data visualizations',
              bgColor: 'bg-orange-500',
              isBeta: true,
            },
          ].map((item, i) => (
            <Card
              key={i}
              className="bg-surface-100 p-6 transition-colors hover:bg-surface-200 border border-light hover:border-default cursor-pointer"
              onClick={item.onClick}
            >
              <div className={`relative flex flex-col items-center gap-2 text-center`}>
                {item.isBeta && (
                  <Badge className="absolute -right-4 -top-4 bg-zinc-700 text-xs text-foreground">
                    Coming soon
                  </Badge>
                )}
                <div className={`rounded-full ${item.bgColor} p-3`}>{item.icon}</div>
                <h3 className="text-sm text-foreground">{item.title}</h3>
                <p className="text-sm text-foreground-light">{item.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            placeholder="Search all files"
            icon={<Search size={14} className="text-foreground-light" />}
          />
        </div>

        {/* Recent Files */}
        <div className="space-y-4">
          <h2 className="text-sm text-foreground">Recent files</h2>
          <div className="space-y-2">
            {[
              { title: 'Replication', time: '9 hours ago' },
              { title: 'Dashboard Q4 2023', time: '9 hours ago' },
              { title: 'Dashboard Q4', time: '9 hours ago' },
              { title: "Dashboard Original file '20 — '23", time: '9 hours ago' },
              { title: 'Terry dashboard playground', time: '9 hours ago' },
              { title: 'AI', time: '4 days ago' },
              { title: 'Dashboard Q1 2024', time: '4 days ago' },
              { title: 'Design System', time: '4 days ago' },
              { title: 'Dashboard Q2 2024', time: '4 days ago' },
              { title: 'Launch Week 13', time: '13 days ago' },
            ].map((file, index) => (
              <Link
                key={index}
                href="#"
                className="flex items-center gap-4 rounded-lg bg-surface-100 border border-muted p-3 transition-colors hover:bg-surface-200"
              >
                <div className="h-12 w-12 rounded bg-suface-300 border" />
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{file.title}</span>
                  <span className="text-sm text-foreground-lighter">{file.time}</span>
                </div>
              </Link>
            ))}
          </div>
          <Button type="link" className="text-sm text-blue-400 hover:text-blue-300">
            Browse more recent files
          </Button>
        </div>
      </div>
    </div>
  )
}

ExplorerNewPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <ExplorerLayout>{page}</ExplorerLayout>
  </ProjectContextFromParamsProvider>
)

export default ExplorerNewPage
