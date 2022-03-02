import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { IconChevronRight, IconLoader, Typography } from '@supabase/ui'

import { useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'
import { useProjectContentStore } from 'stores/projectContentStore'

import Telemetry from 'lib/telemetry'
import { useStore } from 'hooks'
import { partition } from 'lodash'

import { createSqlSnippet } from './SqlEditor.utils'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import CardButton from 'components/ui/CardButton'

const TabWelcome = observer(() => {
  const router = useRouter()
  const { ref } = router.query

  const { ui } = useStore()
  const { profile: user } = ui

  const sqlEditorStore = useSqlStore()
  const contentStore = useProjectContentStore(ref)

  const [SQL, QuickStart] = partition(SQL_TEMPLATES, { type: 'template' })

  async function handleNewQuery(sql, title) {
    try {
      //do what you need here
      // create new sql snippet
      // this also reloads the project_content store
      const snippet = await createSqlSnippet({ router, sql, name: title })

      // reload the local sqlEditorStore
      await sqlEditorStore.loadRemotePersistentData(contentStore, user?.id)

      // select tab with new snippet
      sqlEditorStore.selectTab(snippet.id)
    } catch (error) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to create new query: ${error.message}`,
      })
    }
  }

  return (
    <div className="block p-6 h-full overflow-y-auto space-y-8">
      <div>
        <div className="mb-4">
          <h1 className="text-scale-1200 text-xl mb-3">Scripts</h1>
          <p className="text-sm text-scale-1100">Quick scripts to run on your database.</p>
          <p className="text-sm text-scale-1100">
            Click on any script to fill the query box, modify the script, then click
            <span className="text-code">Run</span>.
          </p>
        </div>
        <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {SQL.map((x) => (
            <SqlCard
              key={x.title}
              title={x.title}
              description={x.description}
              sql={x.sql}
              onClick={(sql, title) => {
                handleNewQuery(sql, title)
                Telemetry.sendEvent('scripts', 'script_clicked', x.title)
              }}
            />
          ))}
        </div>
      </div>
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-scale-1200 text-xl mb-3">Quick start</h1>
          <p className="text-sm text-scale-1100">
            While we're in beta, we want to offer a quick way to explore Supabase. While we build
            importers, check out these simple starters.
          </p>
          <p className="text-sm text-scale-1100">
            Click on any script to fill the query box, modify the script, then click
            <span className="text-code">Run</span>.
          </p>
        </div>
        <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {QuickStart.map((x) => (
            <SqlCard
              key={x.title}
              title={x.title}
              description={x.description}
              sql={x.sql}
              onClick={(sql, title) => {
                handleNewQuery(sql, title)
                Telemetry.sendEvent('quickstart', 'quickstart_clicked', x.title)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

export default TabWelcome

const SqlCard = ({ title, description, sql, onClick }) => {
  const [loading, setLoading] = useState(false)

  function handleOnClick() {
    setLoading(true)
    onClick(sql, title)
  }
  return (
    <CardButton
      onClick={() => handleOnClick()}
      title={title}
      footer={<span className="text-sm text-scale-1100">{description}</span>}
    >
      {/* <a
        className="rounded bg-panel-header-light dark:bg-panel-header-dark transition-colors 
      border border-panel-border-light dark:border-panel-border-dark 
      hover:border-panel-border-hover-light dark:hover:border-panel-border-hover-dark 
      cursor-pointer"
        onClick={() => handleOnClick()}
      > */}
      {/* <div className="px-6 py-3 border-b dark:border-dark flex items-center justify-between">
        <Typography.Title level={6} className="m-0">
          {title}
        </Typography.Title>
        {loading ? (
          <IconLoader className="animate-spin" size={16} />
        ) : (
          <Typography.Text type="secondary">
            <IconChevronRight />
          </Typography.Text>
        )}
      </div>
      <p className="px-6 py-4 capitalize-first">
        <Typography.Text type="secondary">{description}</Typography.Text>
      </p> */}
      {/* </a> */}
    </CardButton>
  )
}

const FavoriteCard = observer(({ favorite }) => {
  const sqlEditorStore = useSqlStore()
  const { key, name, desc } = favorite

  function onClick() {
    sqlEditorStore.createQueryTabFromFavorite(key)
    Telemetry.sendEvent('script_favorite', 'script_clicked', name)
  }

  return (
    <a
      className="rounded bg-panel-header-light dark:bg-panel-header-dark transition-colors 
      border border-panel-border-light dark:border-panel-border-dark 
      hover:border-panel-border-hover-light dark:hover:border-panel-border-hover-dark 
      cursor-pointer"
      onClick={onClick}
    >
      <div className="p-6 py-3 border-b dark:border-dark flex items-center justify-between">
        <Typography.Title level={6} className="m-0">
          {name}
        </Typography.Title>
        <Typography.Text type="secondary">
          <IconChevronRight />
        </Typography.Text>
      </div>
      <p className="p-6 py-4 capitalize-first">
        <Typography.Text type="secondary">{desc}</Typography.Text>
      </p>
    </a>
  )
})
