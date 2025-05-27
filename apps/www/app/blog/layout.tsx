import { ReactNode } from 'react'
import { RefreshRouteOnSave } from './RefreshRouteOnSave'

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <RefreshRouteOnSave />
      {children}
    </>
  )
}
