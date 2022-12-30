import React, { useEffect } from 'react'
import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { IconSave, Loading } from 'ui'
import { useStore } from 'hooks'
import { LogsSavedQueriesItem } from 'components/interfaces/Settings/Logs'
import { LogsLayout } from 'components/layouts'

import Table from 'components/to-be-cleaned/Table'
import { useRouter } from 'next/router'
import { NextPageWithLayout } from 'types'
import LogsExplorerHeader from 'components/ui/Logs/LogsExplorerHeader'

export const LogsSavedPage: NextPageWithLayout = () => {
  const { content, ui } = useStore()
  const router = useRouter()
  const { ref } = router.query

  useEffect(() => {
    content.load()
  }, [ui.selectedProject])

  if (content.isLoading) {
    return <Loading active={true}>{null}</Loading>
  }
  const saved = content.savedLogSqlSnippets()
  return (
    <div className="mx-auto w-full px-5 py-6 h-full">
      <LogsExplorerHeader subtitle="Saved Queries" />
      <div className="flex flex-col gap-3 py-6">
        {saved.length > 0 && (
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
        )}
      </div>
      {saved.length === 0 && (
        <div className="my-auto flex h-full flex-grow flex-col items-center justify-center gap-1">
          <IconSave className="animate-bounce" />
          <h3 className="text-lg text-scale-1200">No Saved Queries Yet</h3>
          <p className="text-sm text-scale-900">
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
