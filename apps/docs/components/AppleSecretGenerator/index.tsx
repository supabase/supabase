'use client'

import dynamic from 'next/dynamic'

const Generator = dynamic(() => import('./AppleSecretGenerator'), { ssr: false })

export function AppleSecretGenerator() {
  return <Generator />
}
