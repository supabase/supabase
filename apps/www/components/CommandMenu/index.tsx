'use client'

import dynamic from 'next/dynamic'

import { useCommandMenuInitiated } from 'ui-patterns/CommandMenu'

const LazyCommandMenu = dynamic(() => import('./CommandMenu'), { ssr: false })

export function WwwCommandMenu() {
  const isInitiated = useCommandMenuInitiated()
  return isInitiated && <LazyCommandMenu />
}
