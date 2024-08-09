import dynamic from 'next/dynamic'
import { memo } from 'react'

import { useCommandMenuInitiated } from 'ui-patterns/CommandMenu'

const LazyGenerateSql = dynamic(() => import('./SqlGeneratorImpl'), { ssr: false })

export const GenerateSql = memo(() => {
  const isInitiated = useCommandMenuInitiated()
  return isInitiated && <LazyGenerateSql />
})
GenerateSql.displayName = 'GenerateSql'
