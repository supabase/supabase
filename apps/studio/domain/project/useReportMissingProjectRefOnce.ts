import { useAtomValue } from '@effect/atom-react'
import { Effect } from 'effect'
import { AsyncResult, type Atom } from 'effect/unstable/reactivity'
import { useEffect, useRef } from 'react'

import { reportMissingProjectRef } from './project-ref-reporting'
import type { ErrorReporting } from '@/domain/monitoring/error-reporting'

/**
 * Reports (via `ErrorReporting`) the first time `projectRef` is missing,
 * retrying on later renders if the runtime hasn't resolved yet, but never
 * more than once per missing occurrence.
 */
export const useReportMissingProjectRefOnce = (
  projectRef: string | undefined,
  runtime: Atom.AtomRuntime<ErrorReporting>,
  componentName: string
) => {
  const runtimeResult = useAtomValue(runtime)
  const hasReported = useRef(false)

  useEffect(() => {
    if (projectRef !== undefined) hasReported.current = false
  }, [projectRef])

  useEffect(() => {
    if (projectRef !== undefined || hasReported.current || !AsyncResult.isSuccess(runtimeResult)) {
      return
    }
    hasReported.current = true
    Effect.runFork(Effect.provide(reportMissingProjectRef(componentName), runtimeResult.value))
  }, [projectRef, runtimeResult, componentName])
}
