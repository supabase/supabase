import { Database, ScrollText } from 'lucide-react'

import type { QuerySourceId } from '@/data/query-sources/query-source-registry'

export const QuerySourceIcon = ({
  source,
  ...props
}: {
  source: QuerySourceId
  className?: string
  size?: number
}) => (source === 'logs' ? <ScrollText {...props} /> : <Database {...props} />)
