'use client'

import dynamic from 'next/dynamic'

import { useCommandMenuInitiated } from 'ui-patterns/CommandMenu'
import { DocsCommandProvider } from './DocsCommandProvider'

const LazyCommandMenu = dynamic(() => import('./CommandMenu'), { ssr: false })

const DocsCommandMenu = () => {
  const isInitiated = useCommandMenuInitiated()
  return isInitiated && <LazyCommandMenu />
}

export { DocsCommandMenu, DocsCommandProvider }
