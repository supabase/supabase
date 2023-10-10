import { observer } from 'mobx-react-lite'
import Link from 'next/link'

import { useParams } from 'common'
import { LogsSavedQueriesItem } from 'components/interfaces/Settings/Logs'
import { LogsLayout } from 'components/layouts'
import Table from 'components/to-be-cleaned/Table'
import LogsExplorerHeader from 'components/ui/Logs/LogsExplorerHeader'
import { useContentQuery } from 'data/content/content-query'
import { NextPageWithLayout } from 'types'
import { IconSave, Loading } from 'ui'

export const LogsSavedPage: NextPageWithLayout = () => {
  const { ref } = useParams()

  const { data, isLoading } = useContentQuery(ref)

  if (isLoading) {
    return <Loading active={true}>{null}</Loading>
  }

  let saved = [...(data?.content ?? [])].filter((c) => c.type === 'log_sql')
  saved.sort((a, b) => a.name.localeCompare(b.name))

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
              <LogsSavedQueriesItem key={item.id} item={item} />
            ))}
          />
        </div>
      )}
      {saved.length === 0 && (
        <div className="my-auto flex h-full flex-grow flex-col items-center justify-center gap-1">
          <IconSave className="animate-bounce" />
          <h3 className="text-lg text-foreground">No Saved Queries Yet</h3>
          <p className="text-sm text-foreground-lighter">
            Saved queries will appear here. Queries can be saved from the{' '}
            <Link href={`/project/${ref}/logs/explorer`}>
              <span className="cursor-pointer font-bold underline">Query</span>
            </Link>{' '}
            tab.
          </p>
        </div>
      )}
    </div>
  )
}

LogsSavedPage.getLayout = (page) => <LogsLayout>{page}</LogsLayout>

export default observer(LogsSavedPage)
