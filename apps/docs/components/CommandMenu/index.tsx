'use client'

import dynamic from 'next/dynamic'

import { useCommandMenuInitiated } from 'ui-patterns/CommandMenu'

const LazyCommandMenu = dynamic(() => import('./CommandMenu'), { ssr: false })

const DocsCommandMenu = () => {
  const isInitiated = useCommandMenuInitiated()
  return isInitiated && <LazyCommandMenu />
}

export { DocsCommandMenu }
