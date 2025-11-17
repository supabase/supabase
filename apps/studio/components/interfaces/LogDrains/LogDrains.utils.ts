import { useFlag } from 'common'
import { LogDrainType } from './LogDrains.constants'

interface Drain {
  drain: LogDrainType
  flag: boolean
}

export function useDisabledDrains(): Set<LogDrainType> {
  const drains: Drain[] = [
    { drain: 'sentry', flag: useFlag('SentryLogDrain')},
    { drain: 'axiom', flag: useFlag('axiomLogDrain')},
  ]
  return new Set(drains.flatMap((d) => (d.flag ? [] : [d.drain])))
}
