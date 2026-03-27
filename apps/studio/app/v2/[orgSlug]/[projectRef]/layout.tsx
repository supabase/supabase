'use client'

import { useParams } from 'next/navigation'
import { type ReactNode } from 'react'

import { V2ParamsProvider } from '@/app/v2/V2ParamsContext'
import { Shell } from '@/components/v2/Shell'

export default function V2HomeLayout({ children }: { children: ReactNode }) {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined
  const projectRef = params?.projectRef as string | undefined

  return (
    <V2ParamsProvider orgSlug={orgSlug} projectRef={projectRef}>
      <Shell>{children}</Shell>
    </V2ParamsProvider>
  )
}
