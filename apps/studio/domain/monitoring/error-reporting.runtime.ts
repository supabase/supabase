import { Layer } from 'effect'
import { Atom } from 'effect/unstable/reactivity'

import { CurrentLocationLive } from './current-location'
import { ErrorReportingLive } from './error-reporting'
import { SentryLive } from './sentry'

export const errorReportingRuntime = Atom.runtime(
  Layer.provide(ErrorReportingLive, Layer.merge(CurrentLocationLive, SentryLive))
)
