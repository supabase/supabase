import { createFileRoute, Link } from '@tanstack/react-router'
import { SaveIcon } from 'lucide-react'
import { Loading } from 'ui'

import { SavedQueriesItem } from '@/components/interfaces/Settings/Logs/Logs.SavedQueriesItem'
import Table from '@/components/to-be-cleaned/Table'
import LogsExplorerHeader from '@/components/ui/Logs/LogsExplorerHeader'
import { useContentQuery } from '@/data/content/content-query'

export const Route = createFileRoute('/project/$ref/logs/explorer/saved')({
  component: LogsSavedPage,
  staticData: { logsLayoutTitle: 'Saved' },
})

// [Joshen] This page looks like its not longer in use from a UI POV - double checking and deprecate + add redirects
function LogsSavedPage() {
  const { ref } = Route.useParams()
  const { data, isPending: isLoading } = useContentQuery({
    projectRef: ref,
    type: 'log_sql',
  })

  if (isLoading) {
    return <Loading active={true}>{null}</Loading>
  }

  const saved = [...(data?.content ?? [])]
    .filter((c) => c.type === 'log_sql')
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="mx-auto w-full px-5 py-6 h-full">
      <LogsExplorerHeader subtitle="Saved Queries" />
      {saved.length > 0 && (
        <div className="flex flex-col gap-3 py-6">
          <Table
            headTrClasses="expandable-tr"
            head={
              <>
                <Table.th>Name</Table.th>
                <Table.th>Description</Table.th>
                <Table.th>Created</Table.th>
                <Table.th>Last updated</Table.th>
                <Table.th></Table.th>
              </>
            }
            body={saved.map((item) => (
              <Table.tr key={item.id}>
                <Table.td colSpan={5} className="p-0!">
                  <SavedQueriesItem item={item} />
                </Table.td>
              </Table.tr>
            ))}
          />
        </div>
      )}
      {saved.length === 0 && (
        <div className="my-auto flex h-full grow flex-col items-center justify-center gap-1">
          <SaveIcon className="animate-bounce" />
          <h3 className="text-lg text-foreground">No Saved Queries Yet</h3>
          <p className="text-sm text-foreground-lighter">
            Saved queries will appear here. Queries can be saved from the{' '}
            <Link to="/project/$ref/logs/explorer" params={{ ref }}>
              <span className="cursor-pointer font-bold underline">Query</span>
            </Link>{' '}
            tab.
          </p>
        </div>
      )}
    </div>
  )
}
