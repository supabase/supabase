import { Suspense, lazy } from 'react'

const MermaidHeavy = lazy(() => import('./Mermaid'))

export function Mermaid(props) {
  return (
    <Suspense>
      <MermaidHeavy {...props} />
    </Suspense>
  )
}
