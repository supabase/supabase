import React, { useEffect } from 'react'
import { NextPage } from 'next'

import { observer } from 'mobx-react-lite'
import { Loading } from '@supabase/ui'
import { useStore, withAuth } from 'hooks'
import { LogsSavedQueriesItem } from 'components/interfaces/Settings/Logs'
import LogsExplorerLayout from 'components/layouts/LogsExplorerLayout/LogsExplorerLayout'

import Table from 'components/to-be-cleaned/Table'

export const LogsExplorerPage: NextPage = () => {
  const { content, ui } = useStore()

  useEffect(() => {
    content.load()
  }, [ui.selectedProject])

  if (content.isLoaded)
    return (
      <LogsExplorerLayout>
        <Loading active={true}>loading</Loading>
      </LogsExplorerLayout>
    )

  const saved = content.list()

  console.log('saved in parent', saved)

  return (
    <LogsExplorerLayout>
      <div className="flex flex-col gap-3">
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
            saved.length > 0 &&
            saved[0].map((item: any) => <LogsSavedQueriesItem key={item.id} item={item} />)
          }
        />
      </div>
    </LogsExplorerLayout>
  )
}

export default withAuth(observer(LogsExplorerPage))
