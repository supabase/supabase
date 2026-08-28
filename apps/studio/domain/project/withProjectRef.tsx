import { useAtomValue } from '@effect/atom-react'
import { Option } from 'effect'
import type { Atom } from 'effect/unstable/reactivity'
import type { ComponentType, ReactNode } from 'react'

import { projectRefAtom } from './project.atoms'
import { useReportMissingProjectRefOnce } from './useReportMissingProjectRefOnce'
import type { ErrorReporting } from '@/domain/monitoring/error-reporting'
import { errorReportingRuntime } from '@/domain/monitoring/error-reporting.runtime'

/**
 * Wraps `Component`, injecting `projectRef` as a prop and rendering
 * `fallback` instead when there's no active project route. Hitting that
 * fallback is always a bug for a wrapped component, so it's reported via
 * `ErrorReporting` rather than silently swallowed. `runtime` defaults to the
 * live Sentry-backed one; tests substitute a fake layer instead of mocking
 * `@sentry/nextjs`.
 */
export const withProjectRef = <P extends object>(
  Component: ComponentType<P & { projectRef: string }>,
  fallback: ReactNode,
  runtime: Atom.AtomRuntime<ErrorReporting> = errorReportingRuntime
): ComponentType<P> => {
  const componentName = Component.displayName ?? Component.name ?? 'Component'

  const WithProjectRef = (props: P) => {
    const projectRef = Option.getOrUndefined(useAtomValue(projectRefAtom))
    useReportMissingProjectRefOnce(projectRef, runtime, componentName)

    if (projectRef === undefined) return <>{fallback}</>
    return <Component {...props} projectRef={projectRef} />
  }
  WithProjectRef.displayName = `withProjectRef(${componentName})`
  return WithProjectRef
}
