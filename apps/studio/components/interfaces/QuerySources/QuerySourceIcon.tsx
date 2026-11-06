import { DatabaseIcon, ScrollTextIcon } from 'lucide-react'

import type { QuerySourceTag } from '@/data/query-sources/query-source-registry'

export const QuerySourceIcon = ({
  source,
  className,
}: {
  source: QuerySourceTag
  className?: string
}) => {
  const props = { className, size: 16, strokeWidth: 2 }

  return source === 'logs' ? <ScrollTextIcon {...props} /> : <DatabaseIcon {...props} />
}
