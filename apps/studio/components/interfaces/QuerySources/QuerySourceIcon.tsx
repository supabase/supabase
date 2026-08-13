import { Database, ScrollText } from 'lucide-react'

import type { QuerySourceId } from '@/data/query-sources/query-source-registry'

export const QuerySourceIcon = ({
  source,
  className,
}: {
  source: QuerySourceId
  className?: string
}) => {
  const props = { className, size: 16, strokeWidth: 2 }

  return source === 'logs' ? <ScrollText {...props} /> : <Database {...props} />
}
