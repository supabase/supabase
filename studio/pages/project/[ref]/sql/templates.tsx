import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { SQLEditorLayout } from 'components/layouts'
import CardButton from 'components/ui/CardButton'
import Telemetry from 'lib/telemetry'
import { partition } from 'lodash'
import { NextPageWithLayout } from 'types'

const SqlTemplatesPage: NextPageWithLayout = () => {
  const [sql, quickStart] = partition(SQL_TEMPLATES, { type: 'template' })

  const handleNewQuery = ({ sql, name }: { sql: string; name: string }) => {}

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
}

SqlTemplatesPage.getLayout = (page) => (
  <SQLEditorLayout title="SQL Templates">{page}</SQLEditorLayout>
)

export default SqlTemplatesPage

type SqlCardProps = {
  title: string
  description?: string
  sql: string
  onClick: (sql: string, title: string) => void
}

const SqlCard = ({ title, description, sql, onClick }: SqlCardProps) => {
  function handleOnClick() {
    onClick(sql, title)
  }

  return (
    <CardButton
      onClick={handleOnClick}
      title={title}
      footer={<span className="text-scale-1100 text-sm">{description}</span>}
    />
  )
}
