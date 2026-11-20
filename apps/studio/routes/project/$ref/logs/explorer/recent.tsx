import { createFileRoute, Link } from '@tanstack/react-router'
import { ClockIcon } from 'lucide-react'
import { Button, Card, Table, TableBody, TableHead, TableHeader, TableRow } from 'ui'

import { RecentQueriesItem } from '@/components/interfaces/Settings/Logs/RecentQueriesItem'
import { useRecentLogSqlSnippets } from '@/components/interfaces/Settings/Logs/useRecentLogSqlSnippets'
import LogsExplorerHeader from '@/components/ui/Logs/LogsExplorerHeader'

export const Route = createFileRoute('/project/$ref/logs/explorer/recent')({
  component: LogsRecentPage,
  staticData: { logsLayoutTitle: 'Recent' },
})

function LogsRecentPage() {
  const { ref } = Route.useParams()

  const [recentLogSnippets, setRecentLogSnippets] = useRecentLogSqlSnippets(ref)
  const recent = recentLogSnippets.slice().reverse()

  return (
    <div className="mx-auto w-full px-5 py-6 h-full">
      <LogsExplorerHeader subtitle="Recent Queries" />
      {recent.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Snippets</TableHead>
                <TableHead className="w-24">
                  <Button size="tiny" onClick={() => setRecentLogSnippets([])}>
                    Clear history
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((item) => (
                <RecentQueriesItem key={item.unchecked_sql} item={item} />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {recent.length === 0 && (
        <>
          <div className="my-auto flex h-full grow flex-col items-center justify-center gap-1">
            <ClockIcon className="animate-bounce" />
            <h3 className="text-lg text-foreground">No Recent Queries Yet</h3>
            <p className="text-sm text-foreground-lighter">
              Your recent queries run from the{' '}
              <Link to="/project/$ref/logs/explorer" params={{ ref }}>
                <span className="cursor-pointer font-bold underline">Query</span>
              </Link>{' '}
              tab will show here.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
