import React from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { IconCode, Badge, IconDatabase, Icon, IconCloud } from '@supabase/ui'
import { withAuth } from 'hooks'
import { LogsTableName, LOGS_SOURCE_DESCRIPTION } from 'components/interfaces/Settings/Logs'
import LogsExplorerLayout from 'components/layouts/LogsExplorerLayout/LogsExplorerLayout'
import CardButton from 'components/ui/CardButton'

export const LogsExplorerPage: NextPage = () => {
  const router = useRouter()
  const { ref } = router.query
  // @ts-ignore
  const sources = Object.values(LogsTableName).sort((a, b) => a - b)
  return (
    <LogsExplorerLayout>
      <div className="grid grid-cols-3 gap-6">
        {sources.map((source) => (
          <CardButton
            title={source}
            icon={
              <div
                className="h-6 w-6 text-scale-100 flex items-center justify-center rounded
                bg-scale-1200
                transition-colors
                duration-400
                group-hover:bg-brand-900
                group-hover:text-brand-1200
              "
              >
                <div className="scale-100 group-hover:scale-110">
                  {source === LogsTableName.POSTGRES && <IconDatabase size={12} strokeWidth={2} />}
                  {source === LogsTableName.EDGE && <IconCloud size={12} strokeWidth={2} />}
                  {source === LogsTableName.FUNCTIONS && <IconCode size={12} strokeWidth={2} />}
                  {source === LogsTableName.FN_EDGE && <IconCode size={12} strokeWidth={2} />}
                </div>
              </div>
            }
            linkHref={`/project/${ref}/logs-explorer/sources/${source}`}
            description={LOGS_SOURCE_DESCRIPTION[source]}
          />
        ))}
      </div>
    </LogsExplorerLayout>
  )
}

export default withAuth(observer(LogsExplorerPage))
