import { Suspense } from 'react'
import dynamic from 'next/dynamic';

// Rename the dynamic import to DynamicJwtGenerator
const DynamicJwtGenerator = dynamic(() => import('./JwtGenerator'), { ssr: false });

export function MyComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DynamicJwtGenerator />
    </Suspense>
  )
}