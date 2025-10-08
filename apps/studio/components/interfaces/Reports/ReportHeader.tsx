import { useRouter } from 'next/router'

import { useParams } from 'common'
import DatabaseSelector from 'components/ui/DatabaseSelector'

interface ReportHeaderProps {
  title: string
  showDatabaseSelector?: boolean
}

const ReportHeader = ({ title, showDatabaseSelector }: ReportHeaderProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { db, chart, ...params } = router.query

  return (
    <div className="flex flex-row justify-between gap-4 items-center">
      <h1>{title}</h1>
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
  )
}
export default ReportHeader
