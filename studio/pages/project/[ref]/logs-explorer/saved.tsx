import React, { useEffect } from 'react'
import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { IconSave, Loading } from '@supabase/ui'
import { useStore } from 'hooks'
import { LogsSavedQueriesItem } from 'components/interfaces/Settings/Logs'
import LogsExplorerLayout from 'components/layouts/LogsExplorerLayout/LogsExplorerLayout'

import Table from 'components/to-be-cleaned/Table'
import { useRouter } from 'next/router'
import { NextPageWithLayout } from 'types'

export const LogsSavedPage: NextPageWithLayout = () => {
  const { content } = useStore()
  const router = useRouter()
  const { ref } = router.query

  if (content.isLoading) {
    return <Loading active={true}>{null}</Loading>
  }
  const saved = content.savedLogSqlSnippets()
  return (
    <>
      <div className="flex flex-col gap-3">
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
          <h3 className="text-scale-1200 text-lg">No Saved Queries Yet</h3>
          <p className="text-scale-900 text-sm">
            Saved queries will appear here. Queries can be saved from the{' '}
            <Link href={`/project/${ref}/logs-explorer`}>
              <span className="cursor-pointer font-bold underline">Query</span>
            </Link>{' '}
            tab.
          </p>
        </div>
      )}
    </>
  )
}

LogsSavedPage.getLayout = (page) => <LogsExplorerLayout>{page}</LogsExplorerLayout>

export default observer(LogsSavedPage)
