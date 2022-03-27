import React from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { IconCode, Badge } from '@supabase/ui'
import { withAuth } from 'hooks'
import { TEMPLATES } from 'components/interfaces/Settings/Logs'
import LogsExplorerLayout from 'components/layouts/LogsExplorerLayout/LogsExplorerLayout'
import CardButton from 'components/ui/CardButton'

export const LogsExplorerPage: NextPage = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <LogsExplorerLayout>
      <div>
        <div className="grid grid-cols-3 gap-6">
          {TEMPLATES.filter((template) => template.mode === 'custom').map((template) => {
            return (
              <CardButton
                title={template.label}
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
                      <IconCode size={12} strokeWidth={2} />
                    </div>
                  </div>
                }
                linkHref={`/project/${ref}/logs-explorer?q=${encodeURI(template.searchString)}`}
                description={template.description}
              />
            )
          })}
        </div>
      </div>
    </LogsExplorerLayout>
  )
}

export default withAuth(observer(LogsExplorerPage))
