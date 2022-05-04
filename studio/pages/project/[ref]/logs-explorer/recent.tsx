import React, { useEffect } from 'react'
import { NextPage } from 'next'
import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { Button, IconClock, IconSave, Loading } from '@supabase/ui'
import { useStore, withAuth } from 'hooks'
import RecentQueriesItem from 'components/interfaces/Settings/Logs/RecentQueriesItem'
import LogsExplorerLayout from 'components/layouts/LogsExplorerLayout/LogsExplorerLayout'

import Table from 'components/to-be-cleaned/Table'
import { useRouter } from 'next/router'
import { LogSqlSnippets } from 'types'

export const LogsSavedPage: NextPage = () => {
  const { content, ui } = useStore()
  const router = useRouter()
  const { ref } = router.query

  useEffect(()=>{
    content.loadPersistentData()
  }, [ui.selectedProjectRef])
  const recent = content.recentLogSqlSnippets.slice().reverse()

  return (
    <LogsExplorerLayout>
        <div className="flex flex-col gap-3">
          {recent.length > 0 && (
          <>
            <div className="flex flex-row justify-end">
              <Button size="tiny" type="default" onClick={()=>{
                content.clearRecentLogSqlSnippets()
              }}>
                Clear
              </Button>
             </div>
            <Table
              head={
                <>
                  <Table.th>Snippets</Table.th>
                  <Table.th className="w-24"></Table.th>
                </>
              }
              body={
                <>
                  {recent.map((item: LogSqlSnippets.Content) => <RecentQueriesItem key={item.sql} item={item} />)}
                </>
              }
            />
        </>
        )}
      </div>
      {recent.length === 0 && (
        <>
          <div className="items-center flex flex-col gap-1 my-auto justify-center h-full flex-grow">
            <IconClock className="animate-bounce" />
            <h3 className="text-lg text-scale-1200">No Recent Queries Yet</h3>
            <p className="text-sm text-scale-900">
              Your recent queries run from the{' '}
              <Link href={`/project/${ref}/logs-explorer`}>
                <span className="font-bold underline text-white cursor-pointer">Query</span>
              </Link>{' '}
              tab will show here.
            </p>
          </div>
        </>
      )}
    </LogsExplorerLayout>
  )
}

export default withAuth(observer(LogsSavedPage))
