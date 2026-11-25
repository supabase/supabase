import { type AnyRouter, useLocation, useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'

import { DatabaseSelector } from '@/components/ui/DatabaseSelector'

interface ReportHeaderProps {
  title: string
  showDatabaseSelector?: boolean
}

export const ReportHeader = ({ title, showDatabaseSelector }: ReportHeaderProps) => {
  const navigate = useNavigate()
  const pathname = useLocation({ select: (location) => location.pathname })
  const { ref } = useParams()

  return (
    <div className="flex flex-row justify-between gap-4 items-center">
      <h1>{title}</h1>
      {showDatabaseSelector && (
        <DatabaseSelector
          onSelectId={(db) => {
            navigate<AnyRouter, string>({
              to: pathname,
              search: (prev: Record<string, unknown>) => {
                const { db: _db, chart: _chart, ...params } = prev
                return db !== ref ? { ...params, db } : params
              },
            })
          }}
        />
      )}
    </div>
  )
}
