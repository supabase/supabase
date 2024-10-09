/**
 * This module is a namespace for all telemetry events.
 * It's used for type-checking and code completion.
 * The actual events are defined in separate files and exported here.
 * @module Telemetry
 * @hidden
 */
import type { AcquisitionEvents } from './acquisition'
import type { ActivationEvents } from './activation'
import type { AdoptionEvents } from './adoption'
import type { GeneralEvents } from './general'
import type { RevenueEvents } from './revenue'

export namespace Telemetry {
  export type Events = AcquisitionEvents &
    ActivationEvents &
    AdoptionEvents &
    GeneralEvents &
    RevenueEvents
  export type EventName = keyof Events
  export type EventProps<K extends EventName> = Events[K]
}
