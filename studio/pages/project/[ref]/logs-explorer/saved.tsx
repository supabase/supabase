import React, { useEffect } from 'react'
import { NextPage } from 'next'
import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { IconSave, Loading } from '@supabase/ui'
import { useStore, withAuth } from 'hooks'
import { LogsSavedQueriesItem } from 'components/interfaces/Settings/Logs'
import LogsExplorerLayout from 'components/layouts/LogsExplorerLayout/LogsExplorerLayout'

import Table from 'components/to-be-cleaned/Table'
import { useRouter } from 'next/router'

export const LogsSavedPage: NextPage = () => {
  const { content, ui } = useStore()
  const router = useRouter()
  const { ref } = router.query

  useEffect(() => {
    if (!content.isLoading) {
      content.load()
    }
  }, [ui.selectedProject])

  if (content.isLoading) {
    return (
      <LogsExplorerLayout>
        <Loading active={true}>{null}</Loading>
      </LogsExplorerLayout>
    )
  }
  const saved = content.logSqlSnippets()

  return (
    <LogsExplorerLayout>
      <div className="flex flex-col gap-3">
        {saved.length > 0 && (
          <Table
            headTrClasses="expandable-tr"
            head={
              <>
                <Table.th>Name</Table.th>
                <Table.th>Description</Table.th>
                <Table.th className="">Created</Table.th>
                <Table.th className="">Last updated</Table.th>
                <Table.th className=""></Table.th>
              </>
            }
            body={
              <>
                {saved.length > 0 &&
                  saved.map((item: any) => <LogsSavedQueriesItem key={item.id} item={item} />)}
              </>
            }
          />
        )}
      </div>
      {saved.length === 0 && (
        <>
          <div className="items-center flex flex-col gap-1 my-auto justify-center h-full flex-grow">
            <IconSave className="animate-bounce" />
            <h3 className="text-lg text-scale-1200">No Saved Queries Yet</h3>
            <p className="text-sm text-scale-900">
              Saved queries will appear here. Queries can be saved from the{' '}
              <Link href={`/project/${ref}/logs-explorer`}>
                <span className="font-bold underline text-white cursor-pointer">Query</span>
              </Link>{' '}
              tab.
            </p>
          </div>
        </>
      )}
    </LogsExplorerLayout>
  )
}

export default withAuth(observer(LogsSavedPage))
