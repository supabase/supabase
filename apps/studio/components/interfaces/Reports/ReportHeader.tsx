import { useParams } from 'common'
import { useRouter } from 'next/router'

import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { DocsButton } from '@/components/ui/DocsButton'

interface ReportHeaderProps {
  title: string
  showDatabaseSelector?: boolean
  docsHref?: string
}

const ReportHeader = ({ title, showDatabaseSelector, docsHref }: ReportHeaderProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { db, chart, ...params } = router.query

  return (
    <div className="flex flex-row justify-between gap-4 items-center">
      <h1>{title}</h1>
      {(docsHref || showDatabaseSelector) && (
        <div className="flex items-center gap-2 flex-wrap">
          {docsHref && <DocsButton href={docsHref} />}
          {showDatabaseSelector && (
            <DatabaseSelector
              onSelectId={(db) => {
                router.push({
                  pathname: router.pathname,
                  query: db !== ref ? { ...params, db } : params,
                })
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
export default ReportHeader
