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
          <Typography.Title level={4} className="mb-0">
            Scripts
          </Typography.Title>
          <Typography.Text>
            Quick scripts to run on your database.
            <br />
            Click on any script to fill the query box, modify the script, then click
            <Typography.Text code>Run</Typography.Text>. More scripts coming soon!
          </Typography.Text>
        </div>
        <div className="grid grid-cols-3 gap-4">
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
          <Typography.Title level={4} className="mb-0">
            Quick start
          </Typography.Title>
          <Typography.Text>
            While we're in beta, we want to offer a quick way to explore Supabase. While we build
            importers, check out these simple starters.
            <br />
            Click on any script to fill the query box, modify the script, then click{' '}
            <Typography.Text code>Run</Typography.Text>. More coming soon!
          </Typography.Text>
        </div>
        <div className="grid grid-cols-3 gap-4">
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
    <a
      className="rounded bg-panel-header-light dark:bg-panel-header-dark transition-colors 
      border border-panel-border-light dark:border-panel-border-dark 
      hover:border-panel-border-hover-light dark:hover:border-panel-border-hover-dark 
      cursor-pointer"
      onClick={() => handleOnClick()}
    >
      <div className="px-6 py-3 border-b dark:border-dark flex items-center justify-between">
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
      </p>
    </a>
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
