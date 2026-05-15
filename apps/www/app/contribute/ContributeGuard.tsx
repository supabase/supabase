'use client'

import { useFlag } from 'common'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * TODO: Deprecate this once the contribute page is launched.
 * This component is temporary to block access to the contribute page until the feature is launched.
 */
export function ContributeGuard({ children }: { children: React.ReactNode }) {
  //const isPageEnabled = useFlag('contributePage')
  const isPageEnabled = true
  const router = useRouter()

  useEffect(() => {
    if (isPageEnabled !== undefined && !isPageEnabled) {
      router.push('/')
    }
  }, [isPageEnabled, router])

  // if (isPageEnabled === false) {
  //   return null
  // }

  return <>{children}</>
}
