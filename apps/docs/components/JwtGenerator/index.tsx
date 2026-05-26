'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const DynamicJwtGeneratorSimple = dynamic(() => import('./JwtGeneratorSimple'), { ssr: false })

const JwtGeneratorSimple = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DynamicJwtGeneratorSimple />
    </Suspense>
  )
}

export { JwtGeneratorSimple }
