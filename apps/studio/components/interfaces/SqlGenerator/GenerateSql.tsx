import dynamic from 'next/dynamic'
import { memo } from 'react'
import { useCommandMenuInitiated } from 'ui-patterns/CommandMenu'

const LazyGenerateSql = dynamic(() => import('./GenerateSqlImpl'), { ssr: false })

const GenerateSql = memo(() => {
  const isInitiated = useCommandMenuInitiated()
  return isInitiated && <LazyGenerateSql />
})
GenerateSql.displayName = 'GenerateSql'

export { GenerateSql }
