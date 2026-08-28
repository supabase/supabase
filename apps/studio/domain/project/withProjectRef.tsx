import { useAtomValue } from '@effect/atom-react'
import { Option } from 'effect'
import type { ComponentType, ReactNode } from 'react'

import { projectRefAtom } from './project.atoms'

/**
 * Wraps `Component`, injecting `projectRef` as a prop and rendering
 * `fallback` instead when there's no active project route.
 */
export const withProjectRef = <P extends object>(
  Component: ComponentType<P & { projectRef: string }>,
  fallback: ReactNode
): ComponentType<P> => {
  const WithProjectRef = (props: P) => {
    const projectRef = useAtomValue(projectRefAtom)
    if (Option.isNone(projectRef)) return <>{fallback}</>
    return <Component {...props} projectRef={projectRef.value} />
  }
  WithProjectRef.displayName = `withProjectRef(${Component.displayName ?? Component.name ?? 'Component'})`
  return WithProjectRef
}
