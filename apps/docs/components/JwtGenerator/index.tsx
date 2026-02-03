'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const DynamicJwtGenerator = dynamic(() => import('./JwtGenerator'), { ssr: false })
const DynamicJwtGeneratorSimple = dynamic(() => import('./JwtGeneratorSimple'), { ssr: false })

const JwtGenerator = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DynamicJwtGenerator />
    </Suspense>
  )
}

const JwtGeneratorSimple = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DynamicJwtGeneratorSimple />
    </Suspense>
  )
}

export { JwtGenerator, JwtGeneratorSimple }
