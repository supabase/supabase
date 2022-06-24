import React, { useEffect } from 'react'
import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { Button, IconClock, IconSave, Loading } from '@supabase/ui'
import { useStore, withAuth } from 'hooks'
import RecentQueriesItem from 'components/interfaces/Settings/Logs/RecentQueriesItem'
import LogsExplorerLayout from 'components/layouts/LogsExplorerLayout/LogsExplorerLayout'

import Table from 'components/to-be-cleaned/Table'
import { useRouter } from 'next/router'
import { LogSqlSnippets, NextPageWithLayout } from 'types'

export const LogsSavedPage: NextPageWithLayout = () => {
  const { content, ui } = useStore()
  const router = useRouter()
  const { ref } = router.query

  useEffect(() => {
    content.loadPersistentData()
  }, [ui.selectedProjectRef])
  const recent = content.recentLogSqlSnippets.slice().reverse()

  return (
    <>
      {recent.length > 0 && (
          <Table
            head={
              <>
                <Table.th>Snippets</Table.th>
                <Table.th className="w-24">
                  <Button
                    size="tiny"
                    type="default"
                    onClick={() => {
                      content.clearRecentLogSqlSnippets()
                    }}
                  >
                    Clear history
                  </Button>
                </Table.th>
              </>
            }
            body={recent.map((item: LogSqlSnippets.Content) => (
                  <RecentQueriesItem key={item.sql} item={item} />
                ))
            }
          />
      )}
      {recent.length === 0 && (
        <>
          <div className="my-auto flex h-full flex-grow flex-col items-center justify-center gap-1">
            <IconClock className="animate-bounce" />
            <h3 className="text-scale-1200 text-lg">No Recent Queries Yet</h3>
            <p className="text-scale-900 text-sm">
              Your recent queries run from the{' '}
              <Link href={`/project/${ref}/logs-explorer`}>
                <span className="cursor-pointer font-bold text-white underline">Query</span>
              </Link>{' '}
              tab will show here.
            </p>
          </div>
        </>
      )}
    </>
  )
}

LogsSavedPage.getLayout = (page) => <LogsExplorerLayout>{page}</LogsExplorerLayout>

export default observer(LogsSavedPage)
