import { useState } from 'react'
import { partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import { IconChevronRight, Typography } from '@supabase/ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'
import Telemetry from 'lib/telemetry'
import { useOptimisticSqlSnippetCreate, checkPermissions, useStore } from 'hooks'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import CardButton from 'components/ui/CardButton'

const TabWelcome = observer(() => {
  const { ui } = useStore()
  const [sql, quickStart] = partition(SQL_TEMPLATES, { type: 'template' })
  const canCreateSQLSnippet = checkPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: ui.profile?.id },
    subject: { id: ui.profile?.id },
  })
  const handleNewQuery = useOptimisticSqlSnippetCreate(canCreateSQLSnippet)

  return (
    <div className="block h-full space-y-8 overflow-y-auto p-6">
      <div>
        <div className="mb-4">
          <h1 className="text-scale-1200 mb-3 text-xl">Scripts</h1>
          <p className="text-scale-1100 text-sm">Quick scripts to run on your database.</p>
          <p className="text-scale-1100 text-sm">
            Click on any script to fill the query box, modify the script, then click
            <span className="text-code">Run</span>.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sql.map((x) => (
            <SqlCard
              key={x.title}
              title={x.title}
              description={x.description}
              sql={x.sql}
              onClick={(sql, title) => {
                handleNewQuery({ sql, name: title })
                Telemetry.sendEvent('scripts', 'script_clicked', x.title)
              }}
            />
          ))}
        </div>
      </div>
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-scale-1200 mb-3 text-xl">Quick start</h1>
          <p className="text-scale-1100 text-sm">
            While we're in beta, we want to offer a quick way to explore Supabase. While we build
            importers, check out these simple starters.
          </p>
          <p className="text-scale-1100 text-sm">
            Click on any script to fill the query box, modify the script, then click
            <span className="text-code">Run</span>.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {quickStart.map((x) => (
            <SqlCard
              key={x.title}
              title={x.title}
              description={x.description}
              sql={x.sql}
              onClick={(sql, title) => {
                handleNewQuery({ sql, name: title })
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
      footer={<span className="text-scale-1100 text-sm">{description}</span>}
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
      className="bg-panel-header-light dark:bg-panel-header-dark border-panel-border-light dark:border-panel-border-dark 
      hover:border-panel-border-hover-light dark:hover:border-panel-border-hover-dark cursor-pointer 
      rounded border 
      transition-colors"
      onClick={onClick}
    >
      <div className="dark:border-dark flex items-center justify-between border-b p-6 py-3">
        <Typography.Title level={6} className="m-0">
          {name}
        </Typography.Title>
        <Typography.Text type="secondary">
          <IconChevronRight />
        </Typography.Text>
      </div>
      <p className="capitalize-first p-6 py-4">
        <Typography.Text type="secondary">{desc}</Typography.Text>
      </p>
    </a>
  )
})
