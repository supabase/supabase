import React, { useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import {
  IconCode,
  Badge,
  IconDatabase,
  Icon,
  IconCloud,
  Loading,
  IconSearch,
  Input,
} from '@supabase/ui'
import { useStore, withAuth } from 'hooks'
import { LogsTableName } from 'components/interfaces/Settings/Logs'
import LogsExplorerLayout from 'components/layouts/LogsExplorerLayout/LogsExplorerLayout'
import CardButton from 'components/ui/CardButton'
import { toJS } from 'mobx'

import Table from 'components/to-be-cleaned/Table'
import LogsSavedQueriesItem from 'components/interfaces/Settings/Logs/Logs.SavedQueriesItem'

export const LogsExplorerPage: NextPage = () => {
  const { content, ui } = useStore()

  //   if (content.isLoading) return <LogsExplorerLayout />

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
          head={
            <>
              <Table.th>Name</Table.th>
              <Table.th>Description</Table.th>
              <Table.th className="hidden 2xl:table-cell">Created</Table.th>
              <Table.th className="hidden 2xl:table-cell">Last updated</Table.th>
              <Table.th className="hidden 2xl:table-cell"></Table.th>
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
